import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@17";
import { createClient } from "npm:@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion,
  httpClient: Stripe.createFetchHttpClient(),
});

// Service-role client — used for all DB writes so RLS is bypassed correctly.
// Never exposed to the frontend; only runs inside this server-side function.
const adminClient = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("DB_SERVICE_ROLE_KEY")!
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

      default:
        // Acknowledge events we don't handle — Stripe retries on non-2xx
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
      // Ensure onboarding is marked done (handles edge cases where frontend
      // didn't update it before the webhook fired)
      onboarding_step: "done",
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

  // Optionally: write a failure flag or send a notification here.
  // For now we log and move on — the user can retry from /bank.
}
