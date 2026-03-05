-- ── Backfill badges and feed posts for all existing users ────────────────────
--
-- Runs the same criteria as badgeService.checkAndAwardBadges but for every
-- user at once. Idempotent: ON CONFLICT DO NOTHING on user_badges,
-- and the feed INSERT guards against duplicates via NOT EXISTS.

-- ── 1. Award eligible badges to all users with a church ───────────────────────

-- connected_steward
INSERT INTO user_badges (user_id, badge_id, awarded_at)
SELECT id, 'connected_steward', now()
FROM users
WHERE bank_connected = true
  AND church_id IS NOT NULL
ON CONFLICT (user_id, badge_id) DO NOTHING;

-- 7_day_steward
INSERT INTO user_badges (user_id, badge_id, awarded_at)
SELECT id, '7_day_steward', (created_at + interval '7 days')
FROM users
WHERE created_at <= now() - interval '7 days'
  AND church_id IS NOT NULL
ON CONFLICT (user_id, badge_id) DO NOTHING;

-- faithful_steward (30 days)
INSERT INTO user_badges (user_id, badge_id, awarded_at)
SELECT id, 'faithful_steward', (created_at + interval '30 days')
FROM users
WHERE created_at <= now() - interval '30 days'
  AND church_id IS NOT NULL
ON CONFLICT (user_id, badge_id) DO NOTHING;

-- steadfast_steward (90 days)
INSERT INTO user_badges (user_id, badge_id, awarded_at)
SELECT id, 'steadfast_steward', (created_at + interval '90 days')
FROM users
WHERE created_at <= now() - interval '90 days'
  AND church_id IS NOT NULL
ON CONFLICT (user_id, badge_id) DO NOTHING;

-- ── 2. Create feed posts for all user_badges with no existing post ─────────────

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
  AND NOT EXISTS (
    SELECT 1 FROM social_feed_posts fp
    WHERE fp.user_id = ub.user_id
      AND fp.badge_id = ub.badge_id
  );
