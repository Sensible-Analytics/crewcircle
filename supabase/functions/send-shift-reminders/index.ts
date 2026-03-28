import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const now = new Date();
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    const { data: upcomingShifts, error: shiftsError } = await supabase
      .from("shifts")
      .select(`
        id,
        profile_id,
        start_time,
        locations (
          name
        )
      `)
      .gte("start_time", now.toISOString())
      .lte("start_time", twoHoursLater.toISOString())
      .is("deleted_at", null);

    if (shiftsError) {
      console.error("Error fetching upcoming shifts:", shiftsError);
      return new Response(JSON.stringify({ error: "Failed to fetch shifts" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!upcomingShifts || upcomingShifts.length === 0) {
      return new Response(JSON.stringify({ message: "No upcoming shifts in next 2 hours" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const shiftsByProfile: Record<string, any[]> = {};
    for (const shift of upcomingShifts as any[]) {
      if (!shiftsByProfile[shift.profile_id]) {
        shiftsByProfile[shift.profile_id] = [];
      }
      shiftsByProfile[shift.profile_id].push(shift);
    }

    const profileIds = Object.keys(shiftsByProfile);

    if (profileIds.length === 0) {
      return new Response(JSON.stringify({ message: "No profiles to notify" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const notifications = profileIds.map(profileId => {
      const shifts = shiftsByProfile[profileId];
      const shiftCount = shifts.length;
      const locationName = shifts[0]?.locations?.name ?? "your scheduled shift";
      
      return {
        profileIds: [profileId],
        title: shiftCount > 1 ? "Upcoming Shifts" : "Upcoming Shift",
        body: shiftCount > 1
          ? `You have ${shiftCount} upcoming shifts, including one at ${locationName}.`
          : `You have an upcoming shift at ${locationName} soon.`,
        data: { 
          screen: "roster",
          shiftIds: shifts.map((s: any) => s.id),
        },
      };
    });

    let totalSent = 0;
    for (const notification of notifications) {
      const pushResponse = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-push-notification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify(notification),
      });

      if (pushResponse.ok) {
        const result = await pushResponse.json();
        totalSent += result.sent ?? 0;
      }
    }

    return new Response(JSON.stringify({ 
      profilesNotified: profileIds.length,
      notificationsSent: totalSent,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Shift reminders error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
