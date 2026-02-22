-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- Enables Row Level Security on the users table so that authenticated users
-- can only read and write their own row. Without this, any authenticated user
-- with the anon key can query all rows.

-- 1. Enable RLS on the users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 2. Users can only read their own row
CREATE POLICY "users_select_own"
  ON users
  FOR SELECT
  USING (auth.uid() = id);

-- 3. Users can only insert their own row (profile creation on signup)
CREATE POLICY "users_insert_own"
  ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 4. Users can only update their own row
CREATE POLICY "users_update_own"
  ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Verify RLS is enabled and policies exist:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'users';
-- SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'users';
