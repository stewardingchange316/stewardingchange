import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@17";
import { createClient } from "npm:@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

/**
 * Stripe Connect Onboarding — creates a connected account for a church
 * and returns an Account Link URL for the church admin to complete setup.
 *
 * Admin-only endpoint.
 */

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
  const stripeKey          = Deno.env.get("STRIPE_SECRET_KEY")!;
  const allowedOrigin      = Deno.env.get("ALLOWED_ORIGIN") || "https://stewardingchange.org";

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const adminClient = createClient(supabaseUrl, supabaseServiceKey);

  // Verify admin
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) {
    return json({ error: "Unauthorized" }, 401, corsHeaders);
  }

  const { data: profile } = await adminClient
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return json({ error: "Admin access required" }, 403, corsHeaders);
  }

  let body: { church_id: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request body" }, 400, corsHeaders);
  }

  if (!body.church_id) {
    return json({ error: "Missing church_id" }, 400, corsHeaders);
  }

  const stripe = new Stripe(stripeKey, {
    apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion,
    httpClient: Stripe.createFetchHttpClient(),
  });

  try {
    // Check if church already has a Stripe account
    const { data: church } = await adminClient
      .from("churches")
      .select("id, name, stripe_account_id")
      .eq("id", body.church_id)
      .single();

    if (!church) {
      return json({ error: "Church not found" }, 404, corsHeaders);
    }

    let accountId = church.stripe_account_id;

    if (!accountId) {
      // Create a new Stripe Connect Standard account
      const account = await stripe.accounts.create({
        type: "standard",
        country: "US",
        business_type: "non_profit",
        metadata: {
          church_id: church.id,
          church_name: church.name,
        },
      });

      accountId = account.id;

      // Store on church record
      await adminClient
        .from("churches")
        .update({ stripe_account_id: accountId })
        .eq("id", church.id);

      console.log(`[connect-onboard] Created account ${accountId} for church ${church.id}`);
    }

    // Create an Account Link for the church to complete onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${allowedOrigin}/admin`,
      return_url: `${allowedOrigin}/admin`,
      type: "account_onboarding",
    });

    return json({
      url: accountLink.url,
      account_id: accountId,
    }, 200, corsHeaders);
  } catch (err) {
    console.error("[connect-onboard] error:", err);
    return json({ error: "Failed to create Connect account" }, 500, corsHeaders);
  }
});

function json(body: unknown, status: number, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
