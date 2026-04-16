-- Add address fields to churches for search and display
ALTER TABLE churches ADD COLUMN IF NOT EXISTS street text;
ALTER TABLE churches ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE churches ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE churches ADD COLUMN IF NOT EXISTS zip text;
