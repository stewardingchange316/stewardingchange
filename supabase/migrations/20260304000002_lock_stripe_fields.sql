-- Lock sensitive payment fields from client-side mutation.
--
-- Problem: users_update_own has no restrictions on stripe_customer_id,
-- stripe_bank_pm_id, or bank_connected. A user in the DevTools console can:
--   supabase.from("users").update({ bank_connected: true })      <- fake bank link
--   supabase.from("users").update({ stripe_customer_id: "..." }) <- inject customer ID
--
-- Fix: SECURITY DEFINER function reads the OLD row values (bypassing RLS so
-- it doesn't recurse) and validates the proposed new values:
--   - role             must stay 'user'
--   - stripe_customer_id  immutable (only service_role via edge function can write it)
--   - stripe_bank_pm_id   immutable (only service_role via stripe webhook can write it)
--   - bank_connected   can go true→false (disconnect) but never false→true

CREATE OR REPLACE FUNCTION users_update_check(
  p_id              uuid,
  p_role            text,
  p_bank_connected  boolean,
  p_stripe_cust_id  text,
  p_stripe_pm_id    text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  old_bank_connected  boolean;
  old_stripe_cust_id  text;
  old_stripe_pm_id    text;
BEGIN
  SELECT bank_connected, stripe_customer_id, stripe_bank_pm_id
  INTO   old_bank_connected, old_stripe_cust_id, old_stripe_pm_id
  FROM   users
  WHERE  id = p_id;

  RETURN (
    -- Role cannot be changed via client API
    p_role = 'user'
    -- bank_connected can decrease (disconnect) but never increase (fake connection)
    AND (NOT p_bank_connected OR old_bank_connected)
    -- Stripe fields are immutable by users — only service_role (edge functions) can write
    AND p_stripe_cust_id IS NOT DISTINCT FROM old_stripe_cust_id
    AND p_stripe_pm_id   IS NOT DISTINCT FROM old_stripe_pm_id
  );
END;
$$;

-- Rebuild users_update_own with the stricter check
DROP POLICY IF EXISTS "users_update_own" ON users;
CREATE POLICY "users_update_own" ON users
  FOR UPDATE
  USING  (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND users_update_check(
      id,
      role,
      bank_connected,
      stripe_customer_id,
      stripe_bank_pm_id
    )
  );
