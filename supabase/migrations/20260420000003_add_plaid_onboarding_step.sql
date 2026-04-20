-- Add 'plaid' as a valid onboarding step
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_onboarding_step_check;
ALTER TABLE users ADD CONSTRAINT users_onboarding_step_check
  CHECK (onboarding_step IN ('church', 'cap', 'bank', 'plaid', 'done'));
