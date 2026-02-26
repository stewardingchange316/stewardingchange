-- Enforce valid onboarding steps — prevents garbage values being written
ALTER TABLE users
  ADD CONSTRAINT users_onboarding_step_check
  CHECK (onboarding_step IN ('church', 'cap', 'bank', 'done'));

-- Enforce positive weekly cap — NULL means no limit, 0 or negative is nonsensical
ALTER TABLE users
  ADD CONSTRAINT users_weekly_cap_check
  CHECK (weekly_cap IS NULL OR weekly_cap > 0);
