import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get current time and time 2 hours from now
    const now = new Date();
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

    // Format times for querying (Supabase stores timestamptz in UTC)
    const nowISO = now.toISOString();
    const twoHoursLaterISO = twoHoursLater.toISOString();
    const thirtyMinutesAgoISO = thirtyMinutesAgo.toISOString();

    // Find shifts starting in the next 2 hours that haven't been reminded recently
    const { data: shifts, error: shiftsError } = await supabase
      .from("shifts")
      .select(`
        id,
        start_time,
        end_time,
        profiles!shifts_profile_id_fkey (
          id,
          first_name,
          last_name
        ),
        locations!shifts_location_id_fkey (
          name
        )
      )
      .gte("start_time", nowISO)
      .lte("start_time", twoHoursLaterISO)
      .is("deleted_at", null);

    if (shiftsError) {
      throw shiftsError;
    }

    // For each shift, check if we've sent a reminder in the last 30 minutes
    const { data: recentReminders, error: remindersError } = await supabase
      .from("shift_reminders")
      .select("shift_id")
      .gte("sent_at", thirtyMinutesAgoISO);

    if (remindersError) {
      throw remindersError;
    }

    // Create a set of shift IDs that have been reminded recently
    const recentlyRemindedShiftIds = new Set(recentReminders.map(r => r.shift_id));

    // Filter out shifts that have been reminded recently
    const shiftsToRemind = shifts.filter(shift => !recentlyRemindedShiftIds.has(shift.id));

    console.log(`Found ${shifts.length} shifts starting in next 2 hours, ${shiftsToRemind.length} need reminders`);

    // Send reminders for each shift that needs one
    for (const shift of shiftsToRemind) {
      const profile = shift.profiles;
      const location = shift.locations;
      
      if (!profile || !location) {
        console.warn(`Missing profile or location for shift ${shift.id}`);
        continue;
      }

      // Get push tokens for this profile
      const { data: pushTokens, error: tokensError } = await supabase
        .from("push_tokens")
        .select("expo_push_token, platform")
        .eq("profile_id", profile.id);

      if (tokensError) {
        console.error(`Error fetching push tokens for profile ${profile.id}:`, tokensError);
        continue;
      }

      // Format shift time for display
      const startTime = new Date(shift.start_time);
      const timeString = startTime.toLocaleTimeString('en-AU', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

      // Send notification to each token
      for (const tokenObj of pushTokens) {
        try {
          const notificationResponse = await fetch(`${SUPABASE_URL}/functions/v1/send-push-notification`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
            },
            body: JSON.stringify({
              token: tokenObj.expo_push_token,
              title: 'Shift starting soon!',
              body: `Your shift starts at ${timeString} at ${location.name}.`,
              data: {
                type: 'shift_reminder',
                shift_id: shift.id
              }
            })
          });

          if (!notificationResponse.ok) {
            const errorData = await notificationResponse.json();
            console.error(`Failed to send push notification to token ${tokenObj.expo_push_token}:`, errorData);
            
            // If token is invalid, remove it from database
            if (errorData.error?.includes('InvalidToken') || errorData.error?.includes('DeviceNotRegistered')) {
              await supabase
                .from("push_tokens")
                .delete()
                .eq("expo_push_token", tokenObj.expo_push_token);
            }
          } else {
            console.log(`Sent shift reminder to profile ${profile.id} for shift ${shift.id}`);
          }
        } catch (notificationError) {
          console.error(`Error sending push notification to token ${tokenObj.expo_push_token}:`, notificationError);
        }
      }

      // Record that we sent a reminder for this shift
      const { error: insertError } = await supabase
        .from("shift_reminders")
        .insert({
          shift_id: shift.id
        });

      if (insertError) {
        console.error(`Error recording shift reminder for shift ${shift.id}:`, insertError);
        // Continue anyway - we don't want to fail the whole function because of this
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${shiftsToRemind.length} shift reminders`,
        processed_count: shiftsToRemind.length
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in shift-reminder:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});