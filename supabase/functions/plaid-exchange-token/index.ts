import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

const PLAID_BASE = {
  sandbox: "https://sandbox.plaid.com",
  production: "https://production.plaid.com",
};

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("Origin"));

  if (req.method === "OPTIONS") {
    return Object.keys(corsHeaders).length
      ? new Response("ok", { headers: corsHeaders })
      : new Response("Forbidden", { status: 403 });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ error: "Missing Authorization header" }, 401, corsHeaders);
  }

  const supabaseUrl        = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey    = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const plaidClientId      = Deno.env.get("PLAID_CLIENT_ID")!;
  const plaidSecret        = Deno.env.get("PLAID_SECRET")!;
  const plaidEnv           = Deno.env.get("PLAID_ENV") || "sandbox";

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const adminClient = createClient(supabaseUrl, supabaseServiceKey);

  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) {
    return json({ error: "Unauthorized" }, 401, corsHeaders);
  }

  // Parse request body
  let body: { public_token: string; metadata: any };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request body" }, 400, corsHeaders);
  }

  if (!body.public_token) {
    return json({ error: "Missing public_token" }, 400, corsHeaders);
  }

  const baseUrl = PLAID_BASE[plaidEnv as keyof typeof PLAID_BASE] || PLAID_BASE.sandbox;

  try {
    // Exchange public_token for access_token
    const exchangeRes = await fetch(`${baseUrl}/item/public_token/exchange`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: plaidClientId,
        secret: plaidSecret,
        public_token: body.public_token,
      }),
    });

    const exchangeData = await exchangeRes.json();

    if (!exchangeRes.ok) {
      console.error("[plaid-exchange] exchange error:", exchangeData);
      return json({ error: "Failed to exchange token" }, 500, corsHeaders);
    }

    const { access_token, item_id } = exchangeData;

    // Extract account info from metadata passed by Plaid Link
    const account = body.metadata?.accounts?.[0];
    const institution = body.metadata?.institution;

    // Store in plaid_accounts via service_role (no client write policy)
    const { error: insertErr } = await adminClient
      .from("plaid_accounts")
      .upsert({
        user_id: user.id,
        access_token,
        item_id,
        account_id: account?.id || "",
        account_name: account?.name || null,
        account_type: account?.subtype || account?.type || null,
        institution_name: institution?.name || null,
        is_active: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: "item_id" });

    if (insertErr) {
      console.error("[plaid-exchange] insert error:", insertErr);
      return json({ error: "Failed to save account" }, 500, corsHeaders);
    }

    // Set plaid_connected = true via service_role
    await adminClient
      .from("users")
      .update({ plaid_connected: true })
      .eq("id", user.id);

    console.log("[plaid-exchange] success for user:", user.id, "item:", item_id);

    return json({ success: true }, 200, corsHeaders);
  } catch (err) {
    console.error("[plaid-exchange] error:", err);
    return json({ error: "Failed to exchange token" }, 500, corsHeaders);
  }
});

function json(body: unknown, status: number, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
