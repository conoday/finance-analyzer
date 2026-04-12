# Data Modeling

> Status: ✅ schema.sql v3 sudah dibuat — jalankan di Supabase SQL Editor
> Last updated: 2026-04-12 (rev 3)
> File SQL: `supabase/schema.sql`

---

## Entity Relationship

```
auth.users (Supabase managed)
  └── profiles (1:1 via trigger)
        ├──< transactions (user_id FK)
        │        ├── category TEXT (free text + inferred)
        │        ├── method TEXT (cash/bca/gopay/dana/ovo/...)
        │        ├── hour_of_day SMALLINT (untuk AI pattern)
        │        └── day_of_week SMALLINT (untuk AI pattern)
        ├──< import_batches (quota tracking)
        ├──< budgets (monthly cap per category)
        ├──< transaction_tags (many-to-many)
        └── ai_profiles (1:1 per user, AI data)
```

---

## Table: profiles (extends Supabase auth.users)

```sql
CREATE TABLE public.profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email       TEXT,
    full_name   TEXT,
    avatar_url  TEXT,
    plan_type   TEXT NOT NULL DEFAULT 'free',  -- 'free' | 'pro' | 'ai' | 'business'
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ALTER (jika schema lama sudah ada):
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan_type TEXT NOT NULL DEFAULT 'free';
```

---

## Table: transactions (core)

```sql
CREATE TABLE public.transactions (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type           TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    amount         NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    date           DATE NOT NULL,
    category       TEXT,
    sub_category   TEXT,
    method         TEXT DEFAULT 'cash',  -- 'cash' | 'bca' | 'mandiri' | 'gopay' | 'dana' | 'ovo' | 'qris' | ...
    note           TEXT,
    source         TEXT DEFAULT 'manual', -- 'manual' | 'ocr' | 'csv' | 'wa_bot'
    hour_of_day    SMALLINT,  -- 0-23 (untuk AI weekday/weekend analysis)
    day_of_week    SMALLINT,  -- 0=Mon, 6=Sun (untuk AI pattern detection)
    created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tx_user_date ON public.transactions(user_id, date DESC);
CREATE INDEX idx_tx_user_category ON public.transactions(user_id, category);

-- ALTER (jika tabel sudah ada tanpa kolom baru):
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS hour_of_day SMALLINT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS day_of_week SMALLINT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS method TEXT;
```

---

## Table: import_batches (quota tracking)

```sql
-- Renamed dari file_imports (lebih akurat)
CREATE TABLE public.import_batches (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    filename    TEXT,
    period      TEXT NOT NULL,  -- format: '2025-03' (YYYY-MM)
    row_count   INTEGER,
    status      TEXT DEFAULT 'done',  -- 'done' | 'error'
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Query quota: SELECT COUNT(*) FROM import_batches WHERE user_id=? AND period='2025-03'
-- Free tier limit: 5 imports per bulan
```

---

## Table: budgets (Pro tier)

```sql
CREATE TABLE public.budgets (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category    TEXT NOT NULL,
    month       TEXT NOT NULL,   -- format: '2025-03' (YYYY-MM)
    amount_cap  NUMERIC(15, 2) NOT NULL,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, category, month)
);
```

---

## Table: transaction_tags (Pro tier)

```sql
CREATE TABLE public.transaction_tags (
    transaction_id  UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    tag             TEXT NOT NULL,
    PRIMARY KEY (transaction_id, tag)
);

-- Contoh tags: 'ngedate', 'business', 'belanja-bulanan', 'darurat'
```

---

## Table: ai_profiles (AI tier)

```sql
CREATE TABLE public.ai_profiles (
    user_id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    spending_pattern    JSONB,   -- { avg_daily: 50000, top_category: 'Makan', weekend_ratio: 0.4 }
    persona_type        TEXT,    -- 'saver' | 'spender' | 'impulsive' | 'balanced'
    risk_level          TEXT,    -- 'low' | 'medium' | 'high'
    last_analysis       TIMESTAMP WITH TIME ZONE,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## Table: subscriptions (Payment / Billing)

```sql
CREATE TABLE public.subscriptions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_type       TEXT NOT NULL,   -- 'pro' | 'ai' | 'business'
    status          TEXT NOT NULL DEFAULT 'active',  -- 'active' | 'cancelled' | 'expired'
    started_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at      TIMESTAMP WITH TIME ZONE,
    payment_ref     TEXT,    -- Midtrans order_id
    amount_paid     NUMERIC(12, 2),
    gateway         TEXT DEFAULT 'midtrans',
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## Row Level Security (RLS)

```sql
-- Enable RLS di semua table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: user hanya bisa baca/tulis data sendiri
CREATE POLICY "Users can manage own data" ON public.transactions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own profile" ON public.profiles
    FOR ALL USING (auth.uid() = id);

-- (Ulangi pola yang sama untuk tabel lain)
```

---

## Auto-create Profile Trigger

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## Quick ALTER Migration (untuk schema lama)

```sql
-- Jalankan ini di Supabase SQL Editor jika tabel sudah ada
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan_type TEXT NOT NULL DEFAULT 'free';
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS hour_of_day SMALLINT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS day_of_week SMALLINT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS method TEXT;
```

---

## Notes

- `plan_type` di `profiles` adalah source of truth untuk tier enforcement (bukan tabel users terpisah)
- `method` di `transactions` adalah free-text lowercase: `'cash'`, `'bca'`, `'gopay'`, dll
- `source` di `transactions`: `'manual'` (SmartInput/QuickTracker), `'csv'` (upload), `'ocr'` (foto struk), `'wa_bot'` (WhatsApp)
- `import_batches` tracks upload per user per bulan → Free tier cap 5x/bulan
- `ai_profiles` hanya di-populate saat Phase AI aktif
- Semua UUID — tidak ada auto-increment integer ID

