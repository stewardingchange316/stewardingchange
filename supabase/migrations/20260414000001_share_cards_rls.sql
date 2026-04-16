-- Enable RLS on share_cards and add policies
-- share_cards stores public giving impact cards shared via /s/:id links

ALTER TABLE IF EXISTS share_cards ENABLE ROW LEVEL SECURITY;

-- Anyone can read a share card by ID (public share links)
CREATE POLICY share_cards_public_read
  ON share_cards FOR SELECT
  USING (true);

-- Users can insert their own share card
CREATE POLICY share_cards_insert_own
  ON share_cards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own share card
CREATE POLICY share_cards_update_own
  ON share_cards FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own share card
CREATE POLICY share_cards_delete_own
  ON share_cards FOR DELETE
  USING (auth.uid() = user_id);
