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

  const supabaseUrl     = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const plaidClientId   = Deno.env.get("PLAID_CLIENT_ID")!;
  const plaidSecret     = Deno.env.get("PLAID_SECRET")!;
  const plaidEnv        = Deno.env.get("PLAID_ENV") || "sandbox";

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) {
    return json({ error: "Unauthorized" }, 401, corsHeaders);
  }

  const baseUrl = PLAID_BASE[plaidEnv as keyof typeof PLAID_BASE] || PLAID_BASE.sandbox;

  try {
    const response = await fetch(`${baseUrl}/link/token/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: plaidClientId,
        secret: plaidSecret,
        user: { client_user_id: user.id },
        client_name: "Stewarding Change",
        products: ["transactions"],
        country_codes: ["US"],
        language: "en",
        account_filters: {
          depository: { account_subtypes: ["checking", "savings"] },
          credit: { account_subtypes: ["credit card"] },
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[plaid-link-token] Plaid error:", data);
      return json({ error: "Failed to create link token" }, 500, corsHeaders);
    }

    return json({ link_token: data.link_token }, 200, corsHeaders);
  } catch (err) {
    console.error("[plaid-link-token] error:", err);
    return json({ error: "Failed to create link token" }, 500, corsHeaders);
  }
});

function json(body: unknown, status: number, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
