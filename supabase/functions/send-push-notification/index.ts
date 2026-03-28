import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface PushPayload {
  profileIds: string[];
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

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

    const { profileIds, title, body, data }: PushPayload = await req.json();

    if (!profileIds || !Array.isArray(profileIds) || profileIds.length === 0) {
      return new Response(JSON.stringify({ error: "profileIds is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: tokens, error: tokenError } = await supabase
      .from("push_tokens")
      .select("expo_push_token, profile_id")
      .in("profile_id", profileIds);

    if (tokenError) {
      console.error("Error fetching push tokens:", tokenError);
      return new Response(JSON.stringify({ error: "Failed to fetch tokens" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!tokens || tokens.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: "No tokens found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const messages = tokens.map((t: { expo_push_token: string }) => ({
      to: t.expo_push_token,
      title,
      body,
      data,
      sound: "default",
    }));

    const expoResponse = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(messages),
    });

    const result = await expoResponse.json();

    const invalidTokens: string[] = [];
    if (result.data && Array.isArray(result.data)) {
      result.data.forEach((r: any, i: number) => {
        if (r.status === "error" && r.details?.error === "DeviceNotRegistered") {
          invalidTokens.push(tokens[i].expo_push_token);
        }
      });
    }

    if (invalidTokens.length > 0) {
      await supabase
        .from("push_tokens")
        .delete()
        .in("expo_push_token", invalidTokens);
    }

    return new Response(
      JSON.stringify({
        sent: messages.length,
        invalidRemoved: invalidTokens.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Push notification error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
