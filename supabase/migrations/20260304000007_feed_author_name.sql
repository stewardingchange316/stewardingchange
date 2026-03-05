-- Store author's first_name directly in social_feed_posts so regular
-- users can see names without needing to read other users' rows.

ALTER TABLE social_feed_posts
  ADD COLUMN IF NOT EXISTS author_first_name text;

-- Backfill existing rows
UPDATE social_feed_posts fp
SET author_first_name = u.first_name
FROM users u
WHERE u.id = fp.user_id
  AND fp.author_first_name IS NULL;

-- Update create_feed_post to auto-populate author_first_name
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
DECLARE
  v_first_name text;
BEGIN
  SELECT first_name INTO v_first_name FROM users WHERE id = p_user_id;

  INSERT INTO social_feed_posts (church_id, user_id, author_first_name, post_type, body, badge_id)
  VALUES (p_church_id, p_user_id, v_first_name, p_post_type, p_body, p_badge_id)
  ON CONFLICT (user_id, badge_id) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION create_feed_post(text, uuid, text, text, text) TO authenticated;
