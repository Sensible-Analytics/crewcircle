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

    const { roster_id, tenant_id, week_start } = await req.json();

    if (!roster_id || !tenant_id) {
      return new Response(JSON.stringify({ error: "roster_id and tenant_id are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: shifts, error: shiftsError } = await supabase
      .from("shifts")
      .select("profile_id")
      .eq("roster_id", roster_id)
      .is("deleted_at", null);

    if (shiftsError) {
      console.error("Error fetching shifts:", shiftsError);
      return new Response(JSON.stringify({ error: "Failed to fetch shifts" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const profileIds = [...new Set(shifts?.map((s: any) => s.profile_id).filter(Boolean) ?? [])];

    if (profileIds.length === 0) {
      return new Response(JSON.stringify({ message: "No employees to notify" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pushResponse = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-push-notification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
      body: JSON.stringify({
        profileIds,
        title: "Roster Published",
        body: `Your roster for the week of ${week_start ?? "this week"} is now available.`,
        data: { rosterId: roster_id, screen: "roster" },
      }),
    });

    const pushResult = await pushResponse.json();

    return new Response(JSON.stringify({ 
      notified: profileIds.length,
      pushResult 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Roster published notification error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
