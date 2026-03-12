-- Re-award 7_day_steward badge to any eligible user who doesn't have it yet
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

-- Ensure every badge has a corresponding feed post using the user's CURRENT church
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

-- Fix any feed posts that are still on the wrong church
UPDATE social_feed_posts fp
SET church_id = u.church_id
FROM users u
WHERE fp.user_id = u.id
  AND fp.church_id <> u.church_id;
