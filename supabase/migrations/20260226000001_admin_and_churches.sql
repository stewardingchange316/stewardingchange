-- ─── Role column on users (must come first — church policies reference it) ────

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role text DEFAULT 'user'
  CHECK (role IN ('user', 'admin'));

-- ─── Update read RLS on users to allow admins to read all rows ───────────────

DROP POLICY IF EXISTS "Users can view own profile." ON users;
DROP POLICY IF EXISTS "users_read" ON users;

CREATE POLICY "users_read" ON users FOR SELECT
  USING (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- ─── Recreate churches with text PK (was uuid, never had data) ───────────────
-- The old table was an empty placeholder — the app used hardcoded church IDs.
-- users.church_id stores text slugs ('countryside', 'grace'), so the PK must be text.

DROP TABLE IF EXISTS churches;

CREATE TABLE churches (
  id                  text PRIMARY KEY,
  name                text NOT NULL,
  mission_label       text,
  mission_title       text,
  mission_description text,
  mission_goal        text,
  mission_progress    integer DEFAULT 0 CHECK (mission_progress BETWEEN 0 AND 100),
  giving_cadence      text DEFAULT 'Weekly',
  active              boolean DEFAULT true,
  created_at          timestamptz DEFAULT now()
);

ALTER TABLE churches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "churches_public_read" ON churches
  FOR SELECT USING (true);

CREATE POLICY "churches_admin_write" ON churches
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- ─── Seed churches ────────────────────────────────────────────────────────────

INSERT INTO churches (id, name, mission_label, mission_title, mission_description, mission_goal, mission_progress, giving_cadence, active, created_at)
VALUES
  (
    'countryside',
    'Countryside Christian Church',
    'Helping Hands Foundation',
    'Food Truck Outreach Initiative',
    'Our church is working toward launching a food truck that will serve warm meals across Clearwater to families in need.',
    '120 families',
    64,
    'Weekly',
    true,
    now()
  ),
  (
    'grace',
    'Grace Community Church',
    'Local Food Relief',
    'Community Meal Program',
    'Grace Community Church is raising funds to provide weekly community meals to families facing food insecurity across the area.',
    '90 families',
    42,
    'Weekly',
    true,
    now()
  )
ON CONFLICT (id) DO UPDATE SET
  mission_label       = EXCLUDED.mission_label,
  mission_title       = EXCLUDED.mission_title,
  mission_description = EXCLUDED.mission_description,
  mission_goal        = EXCLUDED.mission_goal,
  mission_progress    = EXCLUDED.mission_progress,
  giving_cadence      = EXCLUDED.giving_cadence,
  active              = EXCLUDED.active;
