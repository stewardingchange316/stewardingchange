import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@17";
import { createClient } from "npm:@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion,
  httpClient: Stripe.createFetchHttpClient(),
});

// SUPABASE_SERVICE_ROLE_KEY is auto-injected by Supabase — no custom secret needed.
// Service-role client: bypasses RLS for all DB writes.
const adminClient = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // ── Signature verification ───────────────────────────────────────────────────
  // Read the raw body BEFORE parsing — signature is over the exact bytes.
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    // constructEventAsync uses Web Crypto (required in Deno — no Node crypto)
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      sig,
      Deno.env.get("STRIPE_WEBHOOK_SECRET")!
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[stripe-webhook] Signature verification failed:", msg);
    return new Response(`Webhook signature error: ${msg}`, { status: 400 });
  }

  console.log(`[stripe-webhook] event=${event.type} id=${event.id}`);

  // ── Event dispatch ───────────────────────────────────────────────────────────
  try {
    switch (event.type) {
      case "setup_intent.succeeded":
        await onSetupIntentSucceeded(event.data.object as Stripe.SetupIntent);
        break;

      case "setup_intent.setup_failed":
        await onSetupIntentFailed(event.data.object as Stripe.SetupIntent);
        break;

      case "payment_intent.succeeded":
        await onPaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case "payment_intent.payment_failed":
        await onPaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      default:
        console.log(`[stripe-webhook] Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    // Return 500 so Stripe retries the event
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[stripe-webhook] Handler threw:", msg);
    return new Response(`Handler error: ${msg}`, { status: 500 });
  }

  // Acknowledge receipt — Stripe will not retry
  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

// ── Handlers ─────────────────────────────────────────────────────────────────

async function onSetupIntentSucceeded(si: Stripe.SetupIntent) {
  const userId = si.metadata?.supabase_user_id;
  if (!userId) {
    // Should never happen if every SetupIntent is created with this metadata
    console.error(
      "[stripe-webhook] setup_intent.succeeded missing supabase_user_id in metadata",
      { si_id: si.id }
    );
    return;
  }

  if (!si.payment_method) {
    console.error(
      "[stripe-webhook] setup_intent.succeeded has no payment_method",
      { si_id: si.id, userId }
    );
    return;
  }

  // payment_method can be a string ID or an expanded object
  const pmId =
    typeof si.payment_method === "string"
      ? si.payment_method
      : si.payment_method.id;

  // Idempotent: if bank_connected is already true with the same pm, this is a no-op
  const { error } = await adminClient
    .from("users")
    .update({
      stripe_bank_pm_id: pmId,
      bank_connected: true,
      onboarding_step: "allset",
    })
    .eq("id", userId);

  if (error) {
    console.error(
      "[stripe-webhook] DB update failed after setup_intent.succeeded:",
      { error, userId, pmId }
    );
    // Throw so Deno.serve returns 500 and Stripe retries
    throw error;
  }

  console.log(`[stripe-webhook] Bank connected: userId=${userId} pm=${pmId}`);
}

async function onSetupIntentFailed(si: Stripe.SetupIntent) {
  const userId = si.metadata?.supabase_user_id;
  if (!userId) return;

  console.error("[stripe-webhook] SetupIntent failed:", {
    userId,
    si_id: si.id,
    last_setup_error: si.last_setup_error,
  });
}

// ── Payment (monthly charge) handlers ────────────────────────────────────────

async function onPaymentIntentSucceeded(pi: Stripe.PaymentIntent) {
  const userId = pi.metadata?.supabase_user_id;
  const churchId = pi.metadata?.church_id;
  const billingMonth = pi.metadata?.billing_month;
  const churchAmountStr = pi.metadata?.church_amount;

  if (!userId || !billingMonth) {
    console.log("[stripe-webhook] payment_intent.succeeded — not a monthly charge (missing metadata)");
    return;
  }

  console.log(`[stripe-webhook] Payment succeeded: user=${userId} month=${billingMonth} amount=$${(pi.amount / 100).toFixed(2)}`);

  // Update donation status
  const { error: donErr } = await adminClient
    .from("donations")
    .update({ status: "succeeded", updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("month", billingMonth);

  if (donErr) {
    console.error("[stripe-webhook] Failed to update donation status:", donErr);
  }

  // Transfer to church via Stripe Connect (if church has a connected account)
  if (churchId && churchAmountStr) {
    const { data: church } = await adminClient
      .from("churches")
      .select("stripe_account_id")
      .eq("id", churchId)
      .single();

    if (church?.stripe_account_id) {
      try {
        const churchAmountCents = Math.round(parseFloat(churchAmountStr) * 100);
        const transfer = await stripe.transfers.create({
          amount: churchAmountCents,
          currency: "usd",
          destination: church.stripe_account_id,
          transfer_group: `${userId}_${billingMonth}`,
          metadata: { supabase_user_id: userId, church_id: churchId, billing_month: billingMonth },
        });

        await adminClient
          .from("donations")
          .update({ stripe_transfer_id: transfer.id, updated_at: new Date().toISOString() })
          .eq("user_id", userId)
          .eq("month", billingMonth);

        console.log(`[stripe-webhook] Transfer created: ${transfer.id} → church ${churchId}`);
      } catch (err) {
        console.error("[stripe-webhook] Transfer failed:", err);
        // Payment succeeded but transfer failed — funds held in platform account
        // Admin can manually transfer later
      }
    } else {
      console.log(`[stripe-webhook] Church ${churchId} has no stripe_account_id — funds held`);
    }
  }
}

async function onPaymentIntentFailed(pi: Stripe.PaymentIntent) {
  const userId = pi.metadata?.supabase_user_id;
  const billingMonth = pi.metadata?.billing_month;

  if (!userId || !billingMonth) {
    console.log("[stripe-webhook] payment_intent.payment_failed — not a monthly charge");
    return;
  }

  const failureReason = pi.last_payment_error?.message || "Payment failed";
  console.error(`[stripe-webhook] Payment failed: user=${userId} month=${billingMonth} reason=${failureReason}`);

  // Get current donation record
  const { data: donation } = await adminClient
    .from("donations")
    .select("id, retry_count")
    .eq("user_id", userId)
    .eq("month", billingMonth)
    .single();

  const retryCount = (donation?.retry_count ?? 0) + 1;
  const MAX_RETRIES = 2;

  if (retryCount < MAX_RETRIES) {
    // Retry: create a new PaymentIntent
    console.log(`[stripe-webhook] Retrying (${retryCount}/${MAX_RETRIES}) for user ${userId}`);

    await adminClient
      .from("donations")
      .update({
        status: "retrying",
        retry_count: retryCount,
        failure_reason: failureReason,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("month", billingMonth);

    // Schedule retry — create a new PaymentIntent with same params
    try {
      const { data: user } = await adminClient
        .from("users")
        .select("stripe_customer_id, stripe_bank_pm_id")
        .eq("id", userId)
        .single();

      if (user?.stripe_customer_id && user?.stripe_bank_pm_id) {
        await stripe.paymentIntents.create({
          amount: pi.amount,
          currency: "usd",
          customer: user.stripe_customer_id,
          payment_method: user.stripe_bank_pm_id,
          payment_method_types: ["us_bank_account"],
          confirm: true,
          metadata: pi.metadata,
        });
      }
    } catch (retryErr) {
      console.error("[stripe-webhook] Retry PaymentIntent failed:", retryErr);
    }
  } else {
    // Max retries reached — auto-pause giving
    console.log(`[stripe-webhook] Max retries reached for user ${userId} — pausing giving`);

    await adminClient
      .from("donations")
      .update({
        status: "paused",
        retry_count: retryCount,
        failure_reason: failureReason,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("month", billingMonth);

    // Pause user's giving
    await adminClient
      .from("users")
      .update({ giving_paused: true })
      .eq("id", userId);
  }
}
