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

  let body: { plaid_account_id: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request body" }, 400, corsHeaders);
  }

  if (!body.plaid_account_id) {
    return json({ error: "Missing plaid_account_id" }, 400, corsHeaders);
  }

  try {
    // Verify user owns this account
    const { data: account, error: fetchErr } = await adminClient
      .from("plaid_accounts")
      .select("id, access_token, item_id, user_id")
      .eq("id", body.plaid_account_id)
      .single();

    if (fetchErr || !account) {
      return json({ error: "Account not found" }, 404, corsHeaders);
    }

    if (account.user_id !== user.id) {
      return json({ error: "Unauthorized" }, 403, corsHeaders);
    }

    // Remove item from Plaid
    const baseUrl = PLAID_BASE[plaidEnv as keyof typeof PLAID_BASE] || PLAID_BASE.sandbox;
    await fetch(`${baseUrl}/item/remove`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: plaidClientId,
        secret: plaidSecret,
        access_token: account.access_token,
      }),
    });

    // Deactivate in our DB
    await adminClient
      .from("plaid_accounts")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", account.id);

    // Check if user has any remaining active accounts
    const { data: remaining } = await adminClient
      .from("plaid_accounts")
      .select("id")
      .eq("user_id", user.id)
      .eq("is_active", true);

    if (!remaining || remaining.length === 0) {
      await adminClient
        .from("users")
        .update({ plaid_connected: false })
        .eq("id", user.id);
    }

    console.log("[plaid-remove] removed account:", account.id, "for user:", user.id);

    return json({ success: true }, 200, corsHeaders);
  } catch (err) {
    console.error("[plaid-remove] error:", err);
    return json({ error: "Failed to remove account" }, 500, corsHeaders);
  }
});

function json(body: unknown, status: number, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
