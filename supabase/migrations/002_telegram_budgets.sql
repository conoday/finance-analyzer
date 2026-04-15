-- Migration: 002_telegram_budgets.sql
-- Adds Telegram integration fields + personal budgets table
-- Run this in Supabase SQL Editor


-- ─────────────────────────────────────────────────────────────────────────
-- 1. Add Telegram fields to profiles
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS telegram_chat_id   TEXT,
  ADD COLUMN IF NOT EXISTS telegram_linked_at TIMESTAMPTZ;

-- Index for fast lookup by chat_id (called on every webhook message)
CREATE INDEX IF NOT EXISTS idx_profiles_telegram_chat_id
  ON profiles (telegram_chat_id)
  WHERE telegram_chat_id IS NOT NULL;


-- ─────────────────────────────────────────────────────────────────────────
-- 2. Pending link codes table
--    Stores temporary chat_id → link_code mapping before user links account.
--    The FastAPI /telegram/link endpoint reads and deletes from here.
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pending_telegram_links (
  chat_id    TEXT        PRIMARY KEY,
  link_code  TEXT        NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-expire rows older than 24 hours (optional — clean up via cron or pg_cron)
-- If you have pg_cron enabled on Supabase:
-- SELECT cron.schedule('clean-pending-tg', '0 * * * *',
--   $$DELETE FROM pending_telegram_links WHERE created_at < NOW() - INTERVAL '24 hours'$$);


-- ─────────────────────────────────────────────────────────────────────────
-- 3. Personal budgets table
--    Stores monthly spending limits per category per user.
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS budgets (
  id            BIGSERIAL   PRIMARY KEY,
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category      TEXT        NOT NULL,
  monthly_limit NUMERIC(18,2) NOT NULL CHECK (monthly_limit > 0),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, category)
);

-- Row Level Security
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "budgets_own_select" ON budgets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "budgets_own_insert" ON budgets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "budgets_own_update" ON budgets
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "budgets_own_delete" ON budgets
  FOR DELETE USING (auth.uid() = user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_budgets_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_budgets_updated_at ON budgets;
CREATE TRIGGER trg_budgets_updated_at
  BEFORE UPDATE ON budgets
  FOR EACH ROW EXECUTE FUNCTION update_budgets_timestamp();
