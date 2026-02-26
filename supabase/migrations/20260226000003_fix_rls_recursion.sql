-- Fix infinite recursion in users_read and churches_admin_write policies.
--
-- Root cause: both policies check `users.role` by querying the users table,
-- which re-triggers the same policy → infinite recursion.
--
-- Fix: SECURITY DEFINER function runs as the owner (bypasses RLS), so the
-- admin check never re-enters the policy evaluation stack.

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Rebuild users read policy
DROP POLICY IF EXISTS "users_read" ON users;
CREATE POLICY "users_read" ON users FOR SELECT
  USING (auth.uid() = id OR is_admin());

-- Rebuild churches admin write policy
DROP POLICY IF EXISTS "churches_admin_write" ON churches;
CREATE POLICY "churches_admin_write" ON churches
  FOR ALL USING (is_admin());
