-- Fix: social_feed_posts.user_id referenced auth.users, not public.users.
-- PostgREST can't resolve the users(first_name) embedded join without a FK to public.users.
-- Also fix user_badges.user_id for consistency.

-- ── social_feed_posts ─────────────────────────────────────────────────────────

ALTER TABLE social_feed_posts
  DROP CONSTRAINT IF EXISTS social_feed_posts_user_id_fkey;

ALTER TABLE social_feed_posts
  ADD CONSTRAINT social_feed_posts_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- ── user_badges ───────────────────────────────────────────────────────────────

ALTER TABLE user_badges
  DROP CONSTRAINT IF EXISTS user_badges_user_id_fkey;

ALTER TABLE user_badges
  ADD CONSTRAINT user_badges_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
