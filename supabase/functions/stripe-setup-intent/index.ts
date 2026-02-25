import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@17";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

// Stripe client — uses Fetch so it works in Deno / Edge Runtime
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  // Keep in sync with your Stripe dashboard API version
  apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion,
  httpClient: Stripe.createFetchHttpClient(),
});

Deno.serve(async (req) => {
  // ── CORS preflight ──────────────────────────────────────────────────────────
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // ── Auth: verify caller via their Supabase JWT ──────────────────────────────
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ error: "Missing Authorization header" }, 401);
  }

  // Debug: log which env vars are present
  console.log("[stripe-setup-intent] env check:", {
    SUPABASE_URL:              !!Deno.env.get("SUPABASE_URL"),
    SUPABASE_ANON_KEY:         !!Deno.env.get("SUPABASE_ANON_KEY"),
    SUPABASE_SERVICE_ROLE_KEY: !!Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
    STRIPE_SECRET_KEY:         !!Deno.env.get("STRIPE_SECRET_KEY"),
    auth_header_present:       !!authHeader,
  });

  // Admin client: used for JWT verification and DB operations
  const adminClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authError } = await adminClient.auth.getUser(token);
  if (authError || !user) {
    console.error("[stripe-setup-intent] JWT verification failed:", authError?.message, authError?.status);
    return json({ error: "Unauthorized" }, 401);
  }

  console.log("[stripe-setup-intent] user verified:", user.id);

  // ── Fetch existing profile ──────────────────────────────────────────────────
  const { data: profile, error: profileError } = await adminClient
    .from("users")
    .select("stripe_customer_id, email, first_name, last_name")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("[stripe-setup-intent] profile fetch error:", profileError);
    return json({ error: "Failed to load user profile" }, 500);
  }

  // ── Create or retrieve Stripe customer (idempotent) ─────────────────────────
  let customerId: string = profile.stripe_customer_id ?? "";

  if (!customerId) {
    const displayName = [profile.first_name, profile.last_name]
      .filter(Boolean)
      .join(" ")
      .trim() || undefined;

    let customer: Stripe.Customer;
    try {
      customer = await stripe.customers.create({
        email: user.email ?? profile.email ?? undefined,
        name: displayName,
        metadata: { supabase_user_id: user.id },
      });
    } catch (err) {
      console.error("[stripe-setup-intent] stripe.customers.create failed:", err);
      return json({ error: "Failed to create payment customer" }, 500);
    }

    customerId = customer.id;

    // Persist customer ID — non-fatal if this write fails (customer already
    // exists in Stripe; next call will recreate but Stripe deduplicates by
    // metadata if needed).
    const { error: writeError } = await adminClient
      .from("users")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id);

    if (writeError) {
      console.error(
        "[stripe-setup-intent] failed to persist stripe_customer_id:",
        writeError
      );
    }
  }

  // ── Create SetupIntent ──────────────────────────────────────────────────────
  let setupIntent: Stripe.SetupIntent;
  try {
    setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ["us_bank_account"],
      payment_method_options: {
        us_bank_account: {
          financial_connections: {
            // Grants us the token needed for future debits
            permissions: ["payment_method"],
          },
        },
      },
      // Stored so the webhook can look up the Supabase user
      metadata: { supabase_user_id: user.id },
    });
  } catch (err) {
    console.error("[stripe-setup-intent] stripe.setupIntents.create failed:", err);
    return json({ error: "Failed to create setup intent" }, 500);
  }

  return json(
    {
      client_secret: setupIntent.client_secret,
      customer_id: customerId,
    },
    200
  );
});

// ── Helpers ─────────────────────────────────────────────────────────────────

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
