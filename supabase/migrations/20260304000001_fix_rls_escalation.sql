-- Block privilege escalation via client-side API calls.
--
-- Root cause: users_update_own had no WITH CHECK column restrictions, meaning
-- any authenticated user could run:
--   supabase.from("users").update({ role: "admin" }).eq("id", user.id)
-- and become an admin. Similarly, users_insert_own allowed injecting role = 'admin'
-- on signup.
--
-- Fix: WITH CHECK now enforces role = 'user' on both INSERT and UPDATE for
-- regular users. Admins get a separate unrestricted update policy via is_admin().

-- ── INSERT: prevent role injection on signup ──────────────────────────────────
DROP POLICY IF EXISTS "users_insert_own" ON users;
CREATE POLICY "users_insert_own" ON users
  FOR INSERT
  WITH CHECK (
    auth.uid() = id
    AND role = 'user'
  );

-- ── UPDATE: prevent role escalation via client API ───────────────────────────
DROP POLICY IF EXISTS "users_update_own" ON users;
CREATE POLICY "users_update_own" ON users
  FOR UPDATE
  USING  (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = 'user'
  );

-- ── Admins can update any user row (needed for role management) ───────────────
DROP POLICY IF EXISTS "users_admin_update" ON users;
CREATE POLICY "users_admin_update" ON users
  FOR UPDATE
  USING (is_admin());
