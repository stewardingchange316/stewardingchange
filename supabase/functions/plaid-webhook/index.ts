import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * Plaid Webhook Handler
 *
 * Handles events from Plaid:
 * - SYNC_UPDATES_AVAILABLE: new transactions ready to sync
 * - ERROR / LOGIN_REQUIRED: bank connection needs re-authentication
 */

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const supabaseUrl  = Deno.env.get("SUPABASE_URL")!;
  const serviceKey   = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const webhookType = body.webhook_type;
  const webhookCode = body.webhook_code;
  const itemId = body.item_id;

  console.log(`[plaid-webhook] type=${webhookType} code=${webhookCode} item=${itemId}`);

  switch (webhookType) {
    case "TRANSACTIONS": {
      if (webhookCode === "SYNC_UPDATES_AVAILABLE") {
        // New transactions available — trigger a sync for this item
        console.log(`[plaid-webhook] New transactions for item ${itemId}`);

        // We could trigger the sync function here, but since we run on a
        // 6-hour cron anyway, just log it. For real-time: invoke plaid-sync-transactions.
      }
      break;
    }

    case "ITEM": {
      if (webhookCode === "ERROR" || webhookCode === "LOGIN_REQUIRED") {
        console.error(`[plaid-webhook] Item error: ${webhookCode} for item ${itemId}`);

        // Deactivate the account
        const { data: account } = await admin
          .from("plaid_accounts")
          .select("id, user_id")
          .eq("item_id", itemId)
          .single();

        if (account) {
          await admin
            .from("plaid_accounts")
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq("id", account.id);

          // Check if user has any remaining active accounts
          const { data: remaining } = await admin
            .from("plaid_accounts")
            .select("id")
            .eq("user_id", account.user_id)
            .eq("is_active", true);

          if (!remaining || remaining.length === 0) {
            await admin
              .from("users")
              .update({ plaid_connected: false })
              .eq("id", account.user_id);
          }

          // Create notification for user
          await admin
            .from("notifications")
            .insert({
              user_id: account.user_id,
              type: "bank_relink_needed",
              title: "Spending account disconnected",
              message: "One of your connected accounts needs to be re-linked. Please reconnect from your dashboard to continue tracking round-ups.",
            });

          console.log(`[plaid-webhook] Deactivated account ${account.id} for user ${account.user_id}`);
        }
      }
      break;
    }

    default:
      console.log(`[plaid-webhook] Unhandled webhook: ${webhookType}/${webhookCode}`);
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
