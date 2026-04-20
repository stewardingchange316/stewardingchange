-- ============================================================================
-- Plaid accounts, transactions, and donations (billing) tables
-- ============================================================================

-- plaid_accounts: stores Plaid Link connections per user
-- access_token is sensitive — only service_role edge functions can read/write
CREATE TABLE IF NOT EXISTS plaid_accounts (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token     text NOT NULL,
  item_id          text NOT NULL UNIQUE,
  account_id       text NOT NULL,
  account_name     text,
  account_type     text,            -- 'checking', 'savings', 'credit card', etc.
  institution_name text,
  cursor           text,            -- Plaid sync cursor for incremental transaction sync
  is_active        boolean DEFAULT true,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

ALTER TABLE plaid_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plaid_accounts_read_own" ON plaid_accounts
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================================================

-- donations: monthly billing records (one per user per month)
-- Created before transactions so transactions can reference it
CREATE TABLE IF NOT EXISTS donations (
  id                         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  church_id                  text NOT NULL REFERENCES churches(id),
  month                      date NOT NULL,              -- first day of the billing month
  total_round_ups            numeric(10,2) NOT NULL DEFAULT 0,
  transaction_count          integer NOT NULL DEFAULT 0,
  platform_fee               numeric(10,2) NOT NULL DEFAULT 0,  -- $1 per member + 4%
  stripe_fee_estimate        numeric(10,2) NOT NULL DEFAULT 0,  -- estimated Stripe ACH cost
  church_amount              numeric(10,2) NOT NULL DEFAULT 0,  -- what the church receives
  stripe_payment_intent_id   text,
  stripe_transfer_id         text,
  status                     text NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending','processing','succeeded','failed','retrying','paused')),
  retry_count                integer DEFAULT 0,
  failure_reason             text,
  created_at                 timestamptz DEFAULT now(),
  updated_at                 timestamptz DEFAULT now(),
  UNIQUE (user_id, month)
);

ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "donations_read_own" ON donations
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================================================

-- transactions: raw Plaid transactions with calculated round-ups
CREATE TABLE IF NOT EXISTS transactions (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id               uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plaid_account_id      uuid NOT NULL REFERENCES plaid_accounts(id) ON DELETE CASCADE,
  plaid_transaction_id  text NOT NULL UNIQUE,
  amount                numeric(10,2) NOT NULL,    -- original spend amount (positive = purchase)
  round_up_amount       numeric(10,2) NOT NULL,    -- ceil(amount) - amount, min $0.01
  date                  date NOT NULL,
  merchant_name         text,
  category              text,
  pending               boolean DEFAULT false,
  included_in_donation  uuid REFERENCES donations(id),
  created_at            timestamptz DEFAULT now()
);

CREATE INDEX idx_transactions_user_date ON transactions(user_id, date);
CREATE INDEX idx_transactions_plaid_account ON transactions(plaid_account_id);
CREATE INDEX idx_transactions_unbilled ON transactions(user_id) WHERE included_in_donation IS NULL;

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transactions_read_own" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================================================

-- Add Stripe Connect account ID to churches (for payouts)
ALTER TABLE churches ADD COLUMN IF NOT EXISTS stripe_account_id text;

-- Add plaid_connected flag to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS plaid_connected boolean DEFAULT false;
