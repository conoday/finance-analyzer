# Data Modeling

> Status: RAPI
> Last updated: 2026-04-26 (rev 5)

## Source of Truth

Skema database saat ini berasal dari gabungan file berikut:

- `supabase/schema.sql`
- `supabase/migrations/001_rooms.sql`
- `supabase/migrations/002_telegram_budgets.sql`
- `supabase/migrations/20260418_ai_api_keys.sql`
- `supabase/migrations/20260426_admin_logs_ocr_metadata.sql`
- `data/migrations/002_affiliate_tables.sql`
- `supabase_migrations/003_bug_reports.sql`

## Entity Map (Aktual)

```text
auth.users
  -> profiles (1:1)
      -> transactions (1:N)
      -> import_batches (1:N)
      -> budgets (1:N)
      -> monthly_agg (1:N)
      -> link_reports.reported_by (optional)

categories
  -> transactions.category_id (1:N)

rooms
  -> room_members (1:N)

affiliate_products
  -> link_reports.product_id (1:N)
```

## Canonical Tables

### 1) Core User & Finance

| Table | Primary Key | Important Columns | Notes |
|---|---|---|---|
| `profiles` | `id UUID` | `full_name`, `avatar_url`, `currency`, `plan_type`, `telegram_chat_id` | Extend `auth.users`, auto-created by trigger |
| `categories` | `id BIGSERIAL` | `user_id`, `name`, `type`, `is_default` | Support default + user-defined categories |
| `transactions` | `id BIGSERIAL` | `user_id`, `date`, `description`, `amount`, `type`, `category_id`, `category_raw`, `source`, `method`, `tags`, `hour_of_day`, `day_of_week` | Primary ledger |
| `import_batches` | `id UUID` | `user_id`, `filename`, `row_count`, `status` | Tracks upload sessions |
| `monthly_agg` | `id BIGSERIAL` | `user_id`, `month`, `total_income`, `total_expense`, `top_category` | Pre-computed monthly summary |

### 2) Telegram & Budget

| Table | Primary Key | Important Columns | Notes |
|---|---|---|---|
| `pending_telegram_links` | `chat_id TEXT` | `link_code`, `created_at` | Temporary mapping before account linking |
| `budgets` | `id BIGSERIAL` | `user_id`, `category`, `monthly_limit` | Per-user budget limits |

### 3) Shared Room

| Table | Primary Key | Important Columns | Notes |
|---|---|---|---|
| `rooms` | `room_id UUID` | `invite_code`, `plan_type`, `max_members`, `creator_member_id`, `shared_budgets` | Shared budget room |
| `room_members` | `id UUID` | `room_id`, `member_id`, `display_name`, `budgets`, `summary`, `by_category` | Room participant state |

### 4) Affiliate & Commerce

| Table | Primary Key | Important Columns | Notes |
|---|---|---|---|
| `affiliate_products` | `id UUID` | `name`, `price`, `platform`, `affiliate_url`, `is_active` | Product catalog for belanja AI |
| `link_reports` | `id UUID` | `product_id`, `reported_by`, `reason`, `created_at` | Broken-link reports |

### 5) AI & Admin Operations

| Table | Primary Key | Important Columns | Notes |
|---|---|---|---|
| `ai_api_keys` | `id UUID` | `provider`, `label`, `api_key`, `priority`, `is_active`, `is_rate_limited` | Key rotation source for AI service |
| `system_logs` | `id BIGSERIAL` | `timestamp`, `level`, `source`, `message`, `user_id`, `ip`, `details` | Admin Log Explorer backend |
| `bank_ocr_metadata` | `id BIGSERIAL` | `bank_name`, `detected_fields`, `sample_count`, `last_sample_at`, `notes` | OCR field coverage per bank/e-wallet |
| `bug_reports` | `id UUID` | `telegram_chat_id`, `username`, `user_id`, `message`, `status` | User bug reports from Telegram flow |

## RLS Snapshot

### RLS enabled with user policies
- `profiles`
- `categories`
- `transactions`
- `import_batches`
- `monthly_agg`
- `budgets`
- `bug_reports`

### RLS enabled, no public policies (service-role/admin access)
- `ai_api_keys`
- `system_logs`
- `bank_ocr_metadata`

### No RLS in current migration set
- `rooms`
- `room_members`
- `pending_telegram_links`
- `affiliate_products`
- `link_reports`

## Important Modeling Notes

1. `profiles.plan_type` adalah source of truth tier billing (`free|pro|ai|business`).
2. `transactions.id` menggunakan `BIGSERIAL`, bukan UUID.
3. `import_batches` belum punya kolom `period`; enforcement kuota bulanan perlu hitung berbasis `created_at`.
4. `rooms.plan_type` adalah konteks room membership (`solo|couple|family|team`), bukan plan billing user.
5. `bank_ocr_metadata` dipakai endpoint `/ai/ocr` dan `/admin/ocr-metadata`; agregasi sample dilakukan di backend.
6. `system_logs` dipakai endpoint `/admin/logs`.

## Immediate Follow-up

- Jika belum diterapkan di project Supabase aktif, jalankan migration `20260426_admin_logs_ocr_metadata.sql`.
- Saat menambah tabel baru, pastikan keputusan RLS ditulis eksplisit di migration agar tidak ambigu.
