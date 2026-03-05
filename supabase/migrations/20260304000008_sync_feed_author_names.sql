-- Sync author_first_name in social_feed_posts with current users.first_name.
-- Runs as a one-time backfill; going forward, EditProfileModal updates posts on name change.

UPDATE social_feed_posts fp
SET author_first_name = u.first_name
FROM users u
WHERE u.id = fp.user_id
  AND u.first_name IS NOT NULL
  AND fp.author_first_name IS DISTINCT FROM u.first_name;
