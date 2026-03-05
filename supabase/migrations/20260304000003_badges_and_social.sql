-- ── Phase 1: Badges & Social tables ──────────────────────────────────────────
--
-- New tables: badges, user_badges, user_badge_settings,
--             social_feed_posts, feed_reactions, church_banners
-- New columns: users.church_joined_at
-- New RPCs:    award_badge(), create_feed_post()

-- ── 0. New column on users ────────────────────────────────────────────────────

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS church_joined_at timestamptz;

-- ── 1. badges — static catalog ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS badges (
  id          text PRIMARY KEY,
  name        text NOT NULL,
  description text NOT NULL,
  icon_emoji  text NOT NULL DEFAULT '🏅',
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "badges_public_read" ON badges
  FOR SELECT USING (true);

CREATE POLICY "badges_admin_write" ON badges
  FOR ALL USING (is_admin());

INSERT INTO badges (id, name, description, icon_emoji, sort_order) VALUES
  ('first_fruits',       'First Fruits',       'Made your first round-up donation.',                 '🌱', 1),
  ('connected_steward',  'Connected Steward',  'Connected your bank account.',                       '🔗', 2),
  ('first_impact',       'First Impact',       'Donated $5 or more in total round-ups.',             '✨', 3),
  ('7_day_steward',      '7 Day Steward',      'Your account is at least 7 days old.',               '🙌', 4),
  ('faithful_steward',   'Faithful Steward',   'Your account is at least 30 days old.',              '🙏', 5),
  ('steadfast_steward',  'Steadfast Steward',  'Your account is at least 90 days old.',              '⛪', 6),
  ('kingdom_builder',    'Kingdom Builder',    'Donated $100 or more in total round-ups.',           '👑', 7)
ON CONFLICT (id) DO NOTHING;

-- ── 2. user_badges — earned badges per user ───────────────────────────────────

CREATE TABLE IF NOT EXISTS user_badges (
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id   text NOT NULL REFERENCES badges(id)     ON DELETE CASCADE,
  awarded_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, badge_id)
);

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- Users can read their own earned badges
CREATE POLICY "user_badges_read_own" ON user_badges
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can read all
CREATE POLICY "user_badges_admin_read" ON user_badges
  FOR SELECT USING (is_admin());

-- No direct client INSERT — badges awarded only via award_badge() RPC below
CREATE POLICY "user_badges_admin_write" ON user_badges
  FOR ALL USING (is_admin());

-- SECURITY DEFINER: bypasses RLS so badgeService can award without self-insert
CREATE OR REPLACE FUNCTION award_badge(p_user_id uuid, p_badge_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_badges (user_id, badge_id)
  VALUES (p_user_id, p_badge_id)
  ON CONFLICT (user_id, badge_id) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION award_badge(uuid, text) TO authenticated;

-- ── 3. user_badge_settings — privacy toggle ───────────────────────────────────

CREATE TABLE IF NOT EXISTS user_badge_settings (
  user_id      uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  show_on_feed boolean NOT NULL DEFAULT true,
  updated_at   timestamptz DEFAULT now()
);

ALTER TABLE user_badge_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "badge_settings_own" ON user_badge_settings
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── 4. social_feed_posts ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS social_feed_posts (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  church_id  text        NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  user_id    uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  post_type  text        NOT NULL CHECK (post_type IN ('badge', 'weekly_impact', 'admin')),
  body       text        NOT NULL,
  badge_id   text        REFERENCES badges(id) ON DELETE SET NULL,
  is_pinned  boolean     NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE social_feed_posts ENABLE ROW LEVEL SECURITY;

-- Users can read posts from their own church
CREATE POLICY "feed_read_own_church" ON social_feed_posts
  FOR SELECT USING (
    church_id = (SELECT church_id FROM users WHERE id = auth.uid())
  );

-- Admins can read all
CREATE POLICY "feed_admin_read" ON social_feed_posts
  FOR SELECT USING (is_admin());

-- Only admins can write directly; user-triggered posts go via create_feed_post()
CREATE POLICY "feed_admin_write" ON social_feed_posts
  FOR ALL USING (is_admin());

-- SECURITY DEFINER: badgeService creates feed posts on behalf of users
CREATE OR REPLACE FUNCTION create_feed_post(
  p_church_id text,
  p_user_id   uuid,
  p_post_type text,
  p_body      text,
  p_badge_id  text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO social_feed_posts (church_id, user_id, post_type, body, badge_id)
  VALUES (p_church_id, p_user_id, p_post_type, p_body, p_badge_id);
END;
$$;

GRANT EXECUTE ON FUNCTION create_feed_post(text, uuid, text, text, text) TO authenticated;

-- ── 5. feed_reactions ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS feed_reactions (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id    uuid        NOT NULL REFERENCES social_feed_posts(id) ON DELETE CASCADE,
  user_id    uuid        NOT NULL REFERENCES auth.users(id)        ON DELETE CASCADE,
  emoji      text        NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (post_id, user_id, emoji)
);

ALTER TABLE feed_reactions ENABLE ROW LEVEL SECURITY;

-- Read reactions on posts from user's church
CREATE POLICY "reactions_read" ON feed_reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM social_feed_posts fp
      JOIN users u ON u.church_id = fp.church_id
      WHERE fp.id = post_id AND u.id = auth.uid()
    )
  );

-- Users insert their own reactions
CREATE POLICY "reactions_insert_own" ON feed_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users delete their own reactions
CREATE POLICY "reactions_delete_own" ON feed_reactions
  FOR DELETE USING (auth.uid() = user_id);

-- ── 6. church_banners ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS church_banners (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  church_id   text        REFERENCES churches(id) ON DELETE CASCADE,
  title       text        NOT NULL,
  message     text        NOT NULL,
  video_url   text,
  is_active   boolean     NOT NULL DEFAULT true,
  created_by  uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE church_banners ENABLE ROW LEVEL SECURITY;

-- Users read active banners for their own church OR global banners (church_id IS NULL)
CREATE POLICY "banners_read_own_church" ON church_banners
  FOR SELECT USING (
    is_active = true
    AND (
      church_id IS NULL
      OR church_id = (SELECT church_id FROM users WHERE id = auth.uid())
    )
  );

-- Admins full access
CREATE POLICY "banners_admin_all" ON church_banners
  FOR ALL USING (is_admin());
