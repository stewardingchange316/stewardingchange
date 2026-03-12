-- Remove duplicate feed posts, keeping the one with the earliest created_at
DELETE FROM social_feed_posts
WHERE id IN (
  SELECT id FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (PARTITION BY user_id, badge_id ORDER BY created_at ASC) AS rn
    FROM social_feed_posts
    WHERE badge_id IS NOT NULL
  ) dupes
  WHERE rn > 1
);

-- Fill in missing author_first_name from users table
UPDATE social_feed_posts fp
SET author_first_name = u.first_name
FROM users u
WHERE fp.user_id = u.id
  AND fp.author_first_name IS NULL;
