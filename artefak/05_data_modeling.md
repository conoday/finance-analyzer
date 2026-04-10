# Data Modeling

## Entity Relationship

```
users
  ├──< transactions (user_id FK)
  │         ├──< bank_metadata (transaction_id FK)
  │         └──> payment_methods (payment_method_id FK)
  └── tier / subscription status
```

## Table: users

```sql
CREATE TABLE users (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email      VARCHAR(255) UNIQUE NOT NULL,
    name       VARCHAR(255),
    avatar_url VARCHAR(500),
    provider   VARCHAR(50)  NOT NULL,
    role       VARCHAR(20)  NOT NULL DEFAULT 'user',   -- 'user' | 'admin'
    tier       VARCHAR(20)  NOT NULL DEFAULT 'free',   -- 'free' | 'pro' | 'business'
    created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);
```

## Table: subscriptions

```sql
CREATE TABLE subscriptions (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tier             VARCHAR(20) NOT NULL,
    status           VARCHAR(20) NOT NULL DEFAULT 'active',  -- 'active' | 'cancelled' | 'expired'
    started_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at       TIMESTAMP,
    payment_ref      VARCHAR(255),   -- reference dari payment gateway
    amount_paid      NUMERIC(12, 2),
    created_at       TIMESTAMP NOT NULL DEFAULT NOW()
);
```

## Table: payment_methods

```sql
CREATE TABLE payment_methods (
    id   SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(20)  NOT NULL   -- 'bank' | 'e-wallet' | 'cash'
);

INSERT INTO payment_methods (name, type) VALUES
    ('BCA', 'bank'), ('BNI', 'bank'), ('Mandiri', 'bank'), ('BRI', 'bank'),
    ('GoPay', 'e-wallet'), ('OVO', 'e-wallet'), ('DANA', 'e-wallet'),
    ('ShopeePay', 'e-wallet'), ('Cash', 'cash');
```

## Table: transactions

```sql
CREATE TABLE transactions (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type              VARCHAR(10) NOT NULL,   -- 'income' | 'expense'
    amount            NUMERIC(15, 2) NOT NULL,
    date              DATE    NOT NULL,
    category          VARCHAR(100),
    payment_method_id INTEGER REFERENCES payment_methods(id),
    description       TEXT,
    source            VARCHAR(20) DEFAULT 'manual',  -- 'manual' | 'ocr' | 'csv'
    created_at        TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tx_user_date ON transactions(user_id, date DESC);
```

## Table: file_imports (Quota Tracking)

```sql
CREATE TABLE file_imports (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename   VARCHAR(255),
    period     VARCHAR(7) NOT NULL,   -- format: '2025-03' (tahun-bulan)
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Query quota: SELECT COUNT(*) FROM file_imports WHERE user_id=? AND period='2025-03'
```

## Table: bank_metadata

```sql
CREATE TABLE bank_metadata (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id   UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    bank_name        VARCHAR(100),
    raw_text         TEXT,
    extracted_fields JSONB,   -- flexible per format bank
    confidence_score NUMERIC(4,3),
    created_at       TIMESTAMP NOT NULL DEFAULT NOW()
);
```

**Contoh extracted_fields:**
```json
{
  "original_amount": "250.000",
  "merchant_raw": "TOKOPEDIA",
  "date_raw": "15/03/2025",
  "transaction_type_raw": "DEBET",
  "parser_version": "1.0"
}
```

## Notes

- `file_imports` digunakan untuk enforce kuota Free tier (5 file/bulan)
- `JSONB` di bank_metadata agar tidak perlu migrasi schema tiap tambah bank baru
- `source` di transactions untuk audit trail (manual / ocr / csv)
