import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  try {
    const { roster_id } = await req.json();

    if (!roster_id) {
      return new Response(
        JSON.stringify({ error: "roster_id is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: roster, error: rosterError } = await supabase
      .from("rosters")
      .select("*")
      .eq("id", roster_id)
      .single();

    if (rosterError) {
      throw rosterError;
    }

    const { data: shifts, error: shiftsError } = await supabase
      .from("shifts")
      .select("profile_id")
      .eq("roster_id", roster_id)
      .is("deleted_at", null);

    if (shiftsError) {
      throw shiftsError;
    }

    // Get unique profile IDs from shifts
    const profileIds = [...new Set(shifts.map(shift => shift.profile_id))];

    // Fetch roster details for notification
    const weekStart = new Date(roster.week_start);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const weekString = `${weekStart.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })} - ${weekEnd.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}`;

    // Send push notifications to all employees with shifts in this roster
    for (const profileId of profileIds) {
      // Get push tokens for this profile
      const { data: pushTokens, error: tokensError } = await supabase
        .from("push_tokens")
        .select("expo_push_token, platform")
        .eq("profile_id", profileId);

      if (tokensError) {
        console.error(`Error fetching push tokens for profile ${profileId}:`, tokensError);
        continue;
      }

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
              title: 'Your roster has been published!',
              body: `Your roster for week of ${weekString} is now available. Check the app to see your shifts.`,
              data: {
                type: 'roster_published',
                roster_id: roster_id
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
          }
        } catch (notificationError) {
          console.error(`Error sending push notification to token ${tokenObj.expo_push_token}:`, notificationError);
        }
      }
    }

    let totalHours = 0;
    shifts.forEach((shift) => {
      // We need to fetch start_time and end_time for hours calculation
      // Let's get the full shift data
    });

    // Refetch shifts with start_time and end_time for hours calculation
    const { data: shiftsWithTimes, error: shiftsTimesError } = await supabase
      .from("shifts")
      .select("start_time, end_time")
      .eq("roster_id", roster_id)
      .is("deleted_at", null);

    if (shiftsTimesError) {
      throw shiftsTimesError;
    }

    let totalHours = 0;
    shiftsWithTimes.forEach((shift) => {
      const start = new Date(shift.start_time);
      const end = new Date(shift.end_time);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      totalHours += hours;
    });

    console.log(`Roster ${roster_id} published. Total shifts: ${shifts.length}, Total hours: ${totalHours}`);

    return new Response(
      JSON.stringify({
        success: true,
        roster_id,
        shifts_count: shifts.length,
        total_hours: totalHours,
        message: "Roster published successfully",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in on-roster-published:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});