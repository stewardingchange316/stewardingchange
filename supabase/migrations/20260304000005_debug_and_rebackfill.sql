-- ── Debug RPC (admin only) — returns row counts for diagnosis ─────────────────

CREATE OR REPLACE FUNCTION admin_feed_debug()
RETURNS TABLE (
  total_users          bigint,
  users_with_church    bigint,
  users_7day_eligible  bigint,
  total_user_badges    bigint,
  total_feed_posts     bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM users)                                                         AS total_users,
    (SELECT COUNT(*) FROM users WHERE church_id IS NOT NULL)                             AS users_with_church,
    (SELECT COUNT(*) FROM users WHERE church_id IS NOT NULL
       AND created_at <= now() - interval '7 days')                                      AS users_7day_eligible,
    (SELECT COUNT(*) FROM user_badges)                                                   AS total_user_badges,
    (SELECT COUNT(*) FROM social_feed_posts)                                             AS total_feed_posts;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_feed_debug() TO authenticated;

-- ── Re-backfill: award badges more defensively ────────────────────────────────
-- Uses auth.users.created_at as a fallback in case public.users.created_at is NULL.

-- connected_steward (idempotent)
INSERT INTO user_badges (user_id, badge_id, awarded_at)
SELECT u.id, 'connected_steward', COALESCE(u.created_at, au.created_at, now())
FROM users u
JOIN auth.users au ON au.id = u.id
WHERE u.bank_connected = true
  AND u.church_id IS NOT NULL
ON CONFLICT (user_id, badge_id) DO NOTHING;

-- 7_day_steward — use auth.users.created_at if public.users.created_at is NULL
INSERT INTO user_badges (user_id, badge_id, awarded_at)
SELECT
  u.id,
  '7_day_steward',
  COALESCE(u.created_at, au.created_at) + interval '7 days'
FROM users u
JOIN auth.users au ON au.id = u.id
WHERE COALESCE(u.created_at, au.created_at) <= now() - interval '7 days'
  AND u.church_id IS NOT NULL
ON CONFLICT (user_id, badge_id) DO NOTHING;

-- faithful_steward (30 days)
INSERT INTO user_badges (user_id, badge_id, awarded_at)
SELECT
  u.id,
  'faithful_steward',
  COALESCE(u.created_at, au.created_at) + interval '30 days'
FROM users u
JOIN auth.users au ON au.id = u.id
WHERE COALESCE(u.created_at, au.created_at) <= now() - interval '30 days'
  AND u.church_id IS NOT NULL
ON CONFLICT (user_id, badge_id) DO NOTHING;

-- steadfast_steward (90 days)
INSERT INTO user_badges (user_id, badge_id, awarded_at)
SELECT
  u.id,
  'steadfast_steward',
  COALESCE(u.created_at, au.created_at) + interval '90 days'
FROM users u
JOIN auth.users au ON au.id = u.id
WHERE COALESCE(u.created_at, au.created_at) <= now() - interval '90 days'
  AND u.church_id IS NOT NULL
ON CONFLICT (user_id, badge_id) DO NOTHING;

-- ── Re-backfill feed posts (add unique constraint first to guard duplicates) ──

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'social_feed_posts_user_badge_uniq'
      AND conrelid = 'social_feed_posts'::regclass
  ) THEN
    ALTER TABLE social_feed_posts
      ADD CONSTRAINT social_feed_posts_user_badge_uniq UNIQUE (user_id, badge_id);
  END IF;
END;
$$;

INSERT INTO social_feed_posts (church_id, user_id, post_type, body, badge_id, created_at)
SELECT
  u.church_id,
  ub.user_id,
  'badge',
  CASE ub.badge_id
    WHEN 'first_fruits'      THEN 'Earned the "First Fruits" badge — Made your first round-up donation.'
    WHEN 'connected_steward' THEN 'Earned the "Connected Steward" badge — Connected your bank account.'
    WHEN 'first_impact'      THEN 'Earned the "First Impact" badge — Donated $5 or more in total round-ups.'
    WHEN '7_day_steward'     THEN 'Earned the "7 Day Steward" badge — Your account is at least 7 days old.'
    WHEN 'faithful_steward'  THEN 'Earned the "Faithful Steward" badge — Your account is at least 30 days old.'
    WHEN 'steadfast_steward' THEN 'Earned the "Steadfast Steward" badge — Your account is at least 90 days old.'
    WHEN 'kingdom_builder'   THEN 'Earned the "Kingdom Builder" badge — Donated $100 or more in total round-ups.'
    ELSE 'Earned a badge.'
  END,
  ub.badge_id,
  ub.awarded_at
FROM user_badges ub
JOIN users u ON u.id = ub.user_id
WHERE u.church_id IS NOT NULL
ON CONFLICT (user_id, badge_id) DO NOTHING;
