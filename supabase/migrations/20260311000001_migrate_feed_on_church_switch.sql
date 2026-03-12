-- Allow users to migrate their own feed posts when switching churches.
-- Uses SECURITY DEFINER so RLS is bypassed safely — only church_id is updated,
-- and only for rows belonging to the calling user.

CREATE OR REPLACE FUNCTION migrate_feed_posts_to_church(p_new_church_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE social_feed_posts
  SET church_id = p_new_church_id
  WHERE user_id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION migrate_feed_posts_to_church(text) TO authenticated;

-- Backfill: move any existing feed posts for users whose church_id
-- doesn't match their posts' church_id (e.g. Israel)
UPDATE social_feed_posts fp
SET church_id = u.church_id
FROM users u
WHERE fp.user_id = u.id
  AND fp.church_id <> u.church_id;
