import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@13";
import { createClient } from "npm:@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

let corsHeaders: Record<string, string> = {};

Deno.serve(async (req) => {
  corsHeaders = getCorsHeaders(req.headers.get("Origin"));

  if (req.method === "OPTIONS") {
    return Object.keys(corsHeaders).length
      ? new Response("ok", { headers: corsHeaders })
      : new Response("Forbidden", { status: 403 });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ error: "Missing Authorization header" }, 401);
  }

  // Use user-scoped client — SUPABASE_ANON_KEY + user JWT auto-injected by runtime
  const supabaseUrl        = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey    = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const stripeKey          = Deno.env.get("STRIPE_SECRET_KEY")!;

  console.log("[stripe-setup-intent] env:", {
    url:     !!supabaseUrl,
    anon:    !!supabaseAnonKey,
    service: !!supabaseServiceKey,
    stripe:  !!stripeKey,
  });

  // User client: RLS-scoped, used for reads only — cannot write stripe fields
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  // Admin client: service_role, bypasses RLS — used only for writing stripe_customer_id
  const adminClient = createClient(supabaseUrl, supabaseServiceKey);

  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) {
    console.error("[stripe-setup-intent] auth failed:", authError?.message);
    return json({ error: "Unauthorized" }, 401);
  }

  console.log("[stripe-setup-intent] user ok:", user.id);

  // ── Profile ───────────────────────────────────────────────────────────────
  const { data: profile, error: profileError } = await userClient
    .from("users")
    .select("stripe_customer_id, email, first_name, last_name")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("[stripe-setup-intent] profile error:", profileError.message);
    return json({ error: "Failed to load profile" }, 500);
  }

  // ── Stripe customer (idempotent) ──────────────────────────────────────────
  const stripe = new Stripe(stripeKey, {
    apiVersion: "2023-10-16",
    httpClient: Stripe.createFetchHttpClient(),
  });

  let customerId: string = profile.stripe_customer_id ?? "";

  if (!customerId) {
    const name = [profile.first_name, profile.last_name]
      .filter(Boolean).join(" ").trim() || undefined;

    try {
      const customer = await stripe.customers.create({
        email: user.email ?? profile.email ?? undefined,
        name,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
    } catch (err) {
      console.error("[stripe-setup-intent] create customer failed:", err);
      return json({ error: "Failed to create customer" }, 500);
    }

    // Persist via service_role — stripe_customer_id is locked from client writes via RLS
    const { error: writeErr } = await adminClient
      .from("users")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id);

    if (writeErr) {
      console.error("[stripe-setup-intent] persist customer_id failed:", writeErr.message);
    }
  }

  // ── SetupIntent ───────────────────────────────────────────────────────────
  let setupIntent: Stripe.SetupIntent;
  try {
    setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ["us_bank_account"],
      payment_method_options: {
        us_bank_account: {
          financial_connections: { permissions: ["payment_method"] },
        },
      },
      metadata: { supabase_user_id: user.id },
    });
  } catch (err) {
    console.error("[stripe-setup-intent] create setup intent failed:", err);
    return json({ error: "Failed to create setup intent" }, 500);
  }

  console.log("[stripe-setup-intent] done, si:", setupIntent.id);

  return json({ client_secret: setupIntent.client_secret, customer_id: customerId }, 200);
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
