-- Create share_cards table for public giving impact cards shared via /s/:id links
create table if not exists share_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  first_name text,
  church_name text,
  total_given numeric default 0,
  streak_weeks integer default 0,
  round_ups integer default 0,
  badges_earned integer default 0,
  badge_emojis text[] default '{}',
  member_since timestamptz,
  date_from date,
  date_to date,
  filter_label text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
