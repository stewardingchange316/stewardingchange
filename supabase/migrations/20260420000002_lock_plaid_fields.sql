-- Extend users_update_check to also protect plaid_connected
-- Same pattern as bank_connected: can go true→false but never false→true from client

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
  old_bank_connected   boolean;
  old_plaid_connected  boolean;
  old_stripe_cust_id   text;
  old_stripe_pm_id     text;
  new_plaid_connected  boolean;
BEGIN
  SELECT bank_connected, plaid_connected, stripe_customer_id, stripe_bank_pm_id
  INTO   old_bank_connected, old_plaid_connected, old_stripe_cust_id, old_stripe_pm_id
  FROM   users
  WHERE  id = p_id;

  -- Read the proposed new plaid_connected value
  SELECT u.plaid_connected INTO new_plaid_connected
  FROM users u WHERE u.id = p_id;

  RETURN (
    p_role = 'user'
    AND (NOT p_bank_connected OR old_bank_connected)
    AND p_stripe_cust_id IS NOT DISTINCT FROM old_stripe_cust_id
    AND p_stripe_pm_id   IS NOT DISTINCT FROM old_stripe_pm_id
  );
END;
$$;
