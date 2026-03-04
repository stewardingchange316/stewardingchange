-- Persist giving paused state so it survives page refreshes
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS giving_paused boolean DEFAULT false;
