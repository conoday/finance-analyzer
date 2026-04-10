-- =============================================================
-- OprexDuit — Database Schema
-- Run this in Supabase SQL Editor (once, top to bottom)
-- =============================================================

-- ─────────────────────────────────────────────
-- 1. PROFILES
--    Extends auth.users with display info.
--    Created automatically on sign-up via trigger.
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  avatar_url  TEXT,
  currency    CHAR(3)     NOT NULL DEFAULT 'IDR',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile when a new user registers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────
-- 2. CATEGORIES
--    Default categories + user-defined ones.
--    user_id NULL = default/system category.
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.categories (
  id         BIGSERIAL   PRIMARY KEY,
  user_id    UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  icon       TEXT,                      -- emoji or icon key
  color      CHAR(7),                   -- hex e.g. #14b8a6
  type       TEXT        NOT NULL DEFAULT 'expense' CHECK (type IN ('income', 'expense', 'transfer')),
  is_default BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default categories
INSERT INTO public.categories (name, icon, color, type, is_default) VALUES
  ('Makanan & Minuman', '🍜', '#f97316', 'expense', TRUE),
  ('Transportasi',      '🚗', '#3b82f6', 'expense', TRUE),
  ('Belanja',           '🛍️', '#a855f7', 'expense', TRUE),
  ('Hiburan',           '🎬', '#ec4899', 'expense', TRUE),
  ('Kesehatan',         '🏥', '#10b981', 'expense', TRUE),
  ('Pendidikan',        '📚', '#06b6d4', 'expense', TRUE),
  ('Tagihan & Utilitas','💡', '#eab308', 'expense', TRUE),
  ('Investasi',         '📈', '#14b8a6', 'expense', TRUE),
  ('Langganan',         '🔄', '#8b5cf6', 'expense', TRUE),
  ('Lainnya',           '📦', '#6b7280', 'expense', TRUE),
  ('Gaji',              '💰', '#22c55e', 'income',  TRUE),
  ('Freelance',         '💻', '#10b981', 'income',  TRUE),
  ('Investasi (Masuk)', '📊', '#14b8a6', 'income',  TRUE),
  ('Hadiah / Bonus',    '🎁', '#f59e0b', 'income',  TRUE),
  ('Lainnya (Masuk)',   '💸', '#6b7280', 'income',  TRUE)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────
-- 3. TRANSACTIONS
--    Core table — every financial transaction.
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.transactions (
  id            BIGSERIAL   PRIMARY KEY,
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date          DATE        NOT NULL,
  description   TEXT        NOT NULL,
  amount        NUMERIC(18,2) NOT NULL,         -- positive = credit/income
  type          TEXT        NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  category_id   BIGINT      REFERENCES public.categories(id) ON DELETE SET NULL,
  category_raw  TEXT,                           -- original category string from CSV
  merchant      TEXT,
  notes         TEXT,
  source        TEXT        DEFAULT 'manual',   -- 'manual' | 'csv_import' | 'api'
  import_batch  UUID,                           -- groups transactions from the same CSV upload
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_transactions_user_date   ON public.transactions (user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_type   ON public.transactions (user_id, type);
CREATE INDEX IF NOT EXISTS idx_transactions_import_batch ON public.transactions (import_batch);

-- ─────────────────────────────────────────────
-- 4. IMPORT_BATCHES
--    Tracks each CSV upload session.
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.import_batches (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename      TEXT,
  row_count     INT,
  status        TEXT        NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 5. ROW LEVEL SECURITY (RLS)
--    Each user can only see their own data.
-- ─────────────────────────────────────────────

-- profiles
ALTER TABLE public.profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_batches ENABLE ROW LEVEL SECURITY;

-- Profiles: read/write own row only
CREATE POLICY "profiles: own row" ON public.profiles
  FOR ALL USING (auth.uid() = id);

-- Categories: read defaults + own custom categories
CREATE POLICY "categories: read" ON public.categories
  FOR SELECT USING (is_default = TRUE OR auth.uid() = user_id);

CREATE POLICY "categories: insert own" ON public.categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "categories: update own" ON public.categories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "categories: delete own" ON public.categories
  FOR DELETE USING (auth.uid() = user_id);

-- Transactions: own rows only
CREATE POLICY "transactions: own rows" ON public.transactions
  FOR ALL USING (auth.uid() = user_id);

-- Import batches: own rows only
CREATE POLICY "import_batches: own rows" ON public.import_batches
  FOR ALL USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- 6. updated_at auto-update trigger
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────
-- 7. ADDITIONAL COLUMNS (Phase 2+)
-- ─────────────────────────────────────────────

-- profiles: plan type for tier enforcement
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan_type TEXT NOT NULL DEFAULT 'free'
    CHECK (plan_type IN ('free', 'pro', 'ai', 'business'));

-- transactions: AI data collection (add from the start, cheap to store)
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS hour_of_day   SMALLINT,  -- 0-23, for spending pattern analysis
  ADD COLUMN IF NOT EXISTS day_of_week   SMALLINT,  -- 0=Mon, 6=Sun
  ADD COLUMN IF NOT EXISTS recurring_flag BOOLEAN   NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS confidence_score NUMERIC(4,3),  -- AI parsing confidence 0.000-1.000
  ADD COLUMN IF NOT EXISTS method        TEXT,      -- Cash | BCA | GoPay | OVO | etc
  ADD COLUMN IF NOT EXISTS tags          TEXT[];    -- tag array (Phase 3)

-- ─────────────────────────────────────────────
-- 8. PROFILES: plan_type index
-- ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_profiles_plan_type ON public.profiles (plan_type);

-- ─────────────────────────────────────────────
-- 9. MONTHLY AGGREGATES (pre-computed, for perf)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.monthly_agg (
  id             BIGSERIAL    PRIMARY KEY,
  user_id        UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month          CHAR(7)      NOT NULL,  -- 'YYYY-MM'
  total_income   NUMERIC(18,2) NOT NULL DEFAULT 0,
  total_expense  NUMERIC(18,2) NOT NULL DEFAULT 0,
  top_category   TEXT,
  UNIQUE (user_id, month)
);

ALTER TABLE public.monthly_agg ENABLE ROW LEVEL SECURITY;
CREATE POLICY "monthly_agg: own rows" ON public.monthly_agg
  FOR ALL USING (auth.uid() = user_id);

