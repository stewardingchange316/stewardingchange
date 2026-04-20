import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * Transaction Sync — pulls transactions from Plaid for all active accounts,
 * calculates round-ups, and stores them in the transactions table.
 *
 * Triggered by: pg_cron (every 6 hours) or manual invocation
 * Auth: service_role only (no user JWT)
 */

const PLAID_BASE = {
  sandbox: "https://sandbox.plaid.com",
  production: "https://production.plaid.com",
};

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Verify this is a service_role call (from cron or admin)
  const authHeader = req.headers.get("Authorization");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  if (!authHeader?.includes(serviceKey)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabaseUrl  = Deno.env.get("SUPABASE_URL")!;
  const plaidClientId = Deno.env.get("PLAID_CLIENT_ID")!;
  const plaidSecret   = Deno.env.get("PLAID_SECRET")!;
  const plaidEnv      = Deno.env.get("PLAID_ENV") || "sandbox";
  const baseUrl       = PLAID_BASE[plaidEnv as keyof typeof PLAID_BASE] || PLAID_BASE.sandbox;

  const admin = createClient(supabaseUrl, serviceKey);

  // Get all active Plaid accounts
  const { data: accounts, error: acctErr } = await admin
    .from("plaid_accounts")
    .select("id, user_id, access_token, account_id, cursor")
    .eq("is_active", true);

  if (acctErr || !accounts) {
    console.error("[sync] Failed to load accounts:", acctErr);
    return new Response(JSON.stringify({ error: "Failed to load accounts" }), { status: 500 });
  }

  console.log(`[sync] Processing ${accounts.length} accounts`);

  let totalAdded = 0;
  let totalModified = 0;
  let totalRemoved = 0;

  for (const account of accounts) {
    try {
      let hasMore = true;
      let cursor = account.cursor || undefined;

      while (hasMore) {
        const syncBody: any = {
          client_id: plaidClientId,
          secret: plaidSecret,
          access_token: account.access_token,
          count: 500,
        };
        if (cursor) syncBody.cursor = cursor;

        const res = await fetch(`${baseUrl}/transactions/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(syncBody),
        });

        const data = await res.json();

        if (!res.ok) {
          console.error(`[sync] Plaid error for account ${account.id}:`, data);
          break;
        }

        // Process added transactions
        if (data.added?.length > 0) {
          const rows = data.added
            .filter((tx: any) => tx.amount > 0) // positive = money spent (Plaid convention)
            .map((tx: any) => {
              const amount = Math.abs(tx.amount);
              const ceil = Math.ceil(amount);
              // Round-up is the difference; $0 round-up becomes $1 (whole-dollar purchases)
              let roundUp = ceil - amount;
              if (roundUp < 0.01) roundUp = 1.0;
              // Round to 2 decimal places
              roundUp = Math.round(roundUp * 100) / 100;

              return {
                user_id: account.user_id,
                plaid_account_id: account.id,
                plaid_transaction_id: tx.transaction_id,
                amount: Math.round(amount * 100) / 100,
                round_up_amount: roundUp,
                date: tx.date,
                merchant_name: tx.merchant_name || tx.name || null,
                category: tx.personal_finance_category?.primary || tx.category?.[0] || null,
                pending: tx.pending || false,
              };
            });

          if (rows.length > 0) {
            const { error: insertErr } = await admin
              .from("transactions")
              .upsert(rows, { onConflict: "plaid_transaction_id" });

            if (insertErr) {
              console.error(`[sync] Insert error for account ${account.id}:`, insertErr);
            } else {
              totalAdded += rows.length;
            }
          }
        }

        // Process modified transactions (update amounts)
        if (data.modified?.length > 0) {
          for (const tx of data.modified) {
            if (tx.amount <= 0) continue;
            const amount = Math.abs(tx.amount);
            const ceil = Math.ceil(amount);
            let roundUp = ceil - amount;
            if (roundUp < 0.01) roundUp = 1.0;
            roundUp = Math.round(roundUp * 100) / 100;

            await admin
              .from("transactions")
              .update({
                amount: Math.round(amount * 100) / 100,
                round_up_amount: roundUp,
                merchant_name: tx.merchant_name || tx.name || null,
                pending: tx.pending || false,
              })
              .eq("plaid_transaction_id", tx.transaction_id);

            totalModified++;
          }
        }

        // Process removed transactions
        if (data.removed?.length > 0) {
          const removedIds = data.removed.map((tx: any) => tx.transaction_id);
          await admin
            .from("transactions")
            .delete()
            .in("plaid_transaction_id", removedIds);

          totalRemoved += removedIds.length;
        }

        cursor = data.next_cursor;
        hasMore = data.has_more;
      }

      // Update cursor for next sync
      if (cursor) {
        await admin
          .from("plaid_accounts")
          .update({ cursor, updated_at: new Date().toISOString() })
          .eq("id", account.id);
      }
    } catch (err) {
      console.error(`[sync] Error processing account ${account.id}:`, err);
    }
  }

  const summary = { accounts: accounts.length, added: totalAdded, modified: totalModified, removed: totalRemoved };
  console.log("[sync] Complete:", summary);

  return new Response(JSON.stringify(summary), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
