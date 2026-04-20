import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@17";
import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * Monthly Charge Processor
 *
 * Runs on the 1st of each month. For each eligible user:
 * 1. Sums round-ups from the previous month
 * 2. Applies monthly cap
 * 3. Calculates platform fee ($1/member + 4% of total)
 * 4. Creates Stripe PaymentIntent to debit user's bank via ACH
 * 5. Records donation in donations table
 *
 * Triggered by: pg_cron or manual invocation
 * Auth: service_role only
 */

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const authHeader = req.headers.get("Authorization");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  if (!authHeader?.includes(serviceKey)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const stripeKey   = Deno.env.get("STRIPE_SECRET_KEY")!;

  const admin = createClient(supabaseUrl, serviceKey);
  const stripe = new Stripe(stripeKey, {
    apiVersion: "2024-12-18.acacia",
    httpClient: Stripe.createFetchHttpClient(),
  });

  // Determine billing month (previous month)
  const now = new Date();
  const billingMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const billingMonthStr = billingMonth.toISOString().slice(0, 10); // e.g. "2026-03-01"
  const monthStart = billingMonthStr;
  const monthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10); // last day of prev month

  console.log(`[charges] Billing for ${billingMonthStr} (${monthStart} to ${monthEnd})`);

  // Get all eligible users
  const { data: users, error: usersErr } = await admin
    .from("users")
    .select("id, church_id, weekly_cap, stripe_customer_id, stripe_bank_pm_id")
    .eq("bank_connected", true)
    .eq("giving_paused", false)
    .eq("plaid_connected", true)
    .not("stripe_customer_id", "is", null)
    .not("stripe_bank_pm_id", "is", null)
    .not("church_id", "is", null);

  if (usersErr || !users) {
    console.error("[charges] Failed to load users:", usersErr);
    return new Response(JSON.stringify({ error: "Failed to load users" }), { status: 500 });
  }

  console.log(`[charges] ${users.length} eligible users`);

  let charged = 0;
  let skipped = 0;
  let failed = 0;

  for (const user of users) {
    try {
      // Sum round-ups for the billing month (only unbilled transactions)
      const { data: roundUps, error: ruErr } = await admin
        .from("transactions")
        .select("round_up_amount")
        .eq("user_id", user.id)
        .gte("date", monthStart)
        .lte("date", monthEnd)
        .is("included_in_donation", null)
        .eq("pending", false);

      if (ruErr || !roundUps) {
        console.error(`[charges] Failed to sum round-ups for user ${user.id}:`, ruErr);
        failed++;
        continue;
      }

      let totalRoundUps = roundUps.reduce((sum, tx) => sum + Number(tx.round_up_amount), 0);
      totalRoundUps = Math.round(totalRoundUps * 100) / 100;

      // Apply monthly cap (weekly_cap is actually monthly cap based on UI)
      const monthlyCap = user.weekly_cap; // null = no limit
      if (monthlyCap !== null && totalRoundUps > monthlyCap) {
        totalRoundUps = monthlyCap;
      }

      // Minimum charge is $1 to cover Stripe fees
      if (totalRoundUps < 1.00) {
        // If round-ups are under $1, round up to $1
        if (totalRoundUps > 0) {
          totalRoundUps = 1.00;
        } else {
          // No round-ups this month — skip
          skipped++;
          continue;
        }
      }

      // Calculate platform fee: $1 per active member + 4% of total
      const platformFee = Math.round((1.00 + totalRoundUps * 0.04) * 100) / 100;
      // Estimate Stripe ACH fee (0.8%, capped at $5)
      const stripeFee = Math.round(Math.min(totalRoundUps * 0.008, 5.00) * 100) / 100;
      // Church receives: total - platform fee (Stripe fee comes from platform fee)
      const churchAmount = Math.round((totalRoundUps - platformFee) * 100) / 100;

      if (churchAmount <= 0) {
        // Edge case: round-ups too small to cover fees
        skipped++;
        continue;
      }

      // Create PaymentIntent (auto-confirmed since mandate already accepted)
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(totalRoundUps * 100), // cents
        currency: "usd",
        customer: user.stripe_customer_id,
        payment_method: user.stripe_bank_pm_id,
        payment_method_types: ["us_bank_account"],
        confirm: true,
        mandate_data: {
          customer_acceptance: {
            type: "online",
            online: {
              ip_address: "0.0.0.0",
              user_agent: "Stewarding Change Server",
            },
          },
        },
        metadata: {
          supabase_user_id: user.id,
          church_id: user.church_id,
          billing_month: billingMonthStr,
          platform_fee: platformFee.toString(),
          church_amount: churchAmount.toString(),
        },
      });

      // Record donation
      const { data: donation, error: donErr } = await admin
        .from("donations")
        .upsert({
          user_id: user.id,
          church_id: user.church_id,
          month: billingMonthStr,
          total_round_ups: totalRoundUps,
          transaction_count: roundUps.length,
          platform_fee: platformFee,
          stripe_fee_estimate: stripeFee,
          church_amount: churchAmount,
          stripe_payment_intent_id: paymentIntent.id,
          status: "processing",
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id,month" })
        .select("id")
        .single();

      // Link transactions to this donation
      if (donation) {
        await admin
          .from("transactions")
          .update({ included_in_donation: donation.id })
          .eq("user_id", user.id)
          .gte("date", monthStart)
          .lte("date", monthEnd)
          .is("included_in_donation", null)
          .eq("pending", false);
      }

      charged++;
      console.log(`[charges] Charged user ${user.id}: $${totalRoundUps} (church: $${churchAmount}, fee: $${platformFee})`);
    } catch (err) {
      console.error(`[charges] Error charging user ${user.id}:`, err);
      failed++;

      // Record failed donation
      await admin
        .from("donations")
        .upsert({
          user_id: user.id,
          church_id: user.church_id,
          month: billingMonthStr,
          status: "failed",
          failure_reason: err instanceof Error ? err.message : "Unknown error",
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id,month" });
    }
  }

  const summary = { billing_month: billingMonthStr, eligible: users.length, charged, skipped, failed };
  console.log("[charges] Complete:", summary);

  return new Response(JSON.stringify(summary), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
