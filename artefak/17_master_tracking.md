# Master Tracking Board — OprexDuit

> Last updated: 2026-04-26 (rev 12)
> Agent baru: baca `00_checkpoint_ai.md` dulu, lalu file ini.
> Ini adalah source of truth untuk status semua pekerjaan.
> Baca juga: 07_roadmap.md (fase & sprint), 09_prompt_agent_planner.md (cara kerja agent)

---

## 🔵 STATUS SISTEM (selalu update)

| Komponen | Status | URL / Lokasi |
|---|---|---|
| Frontend | ✅ Live | https://finance-analyzer-roan.vercel.app |
| Backend API | ✅ Live | https://oprexduit.onrender.com |
| Database | ✅ Schema + migrations applied | Supabase — schema.sql + 002_affiliate_tables.sql |
| Auth | ✅ Live | Login/Register/Verify/Callback + hooks + backend JWT |
| Admin Console | ✅ v2 Done, repo terpisah | github.com/conoday/oprex-admin-console |
| Telegram Bot | ✅ Live | Webhook + OCR photo handler + inline keyboard |
| Telegram OCR | ✅ Live | Kirim foto → AI vision → parse transaksi |
| AI Chat | ✅ Live | Guardrails + data access (30 tx terakhir) |
| Shared Room | ✅ Live | Room pasangan/grup + notifikasi |
| Affiliate System | ✅ Done | Backend CRUD + ReportLinkButton frontend |
| Donasi | ✅ Done | QRIS web + Telegram /donasi |
| Git Repo | ✅ Active | conoday/finance-analyzer, branch main |
| Last Commit | ✅ 1a3214b (2026-04-26) | feat: improve categorization, avatar system, nav actions, and motion polish |

---

## ✅ SELESAI — Semua yang sudah diimplementasi

### Infrastruktur & Deploy
- [x] FastAPI backend (`api/main.py`) — 5 endpoints + JWT auth guard
- [x] Next.js 16 frontend — deployed Vercel (auto-deploy dari main)
- [x] Python pipeline 9 modul — parse CSV/Excel mutasi bank
- [x] `vercel.json` + `render.yaml` config
- [x] `requirements.txt` Lambda-safe
- [x] CORS env-based (`ALLOWED_ORIGINS`)
- [x] `.env.example` template
- [x] `SECRETS.md` (gitignored)

### Auth & Session (Phase 2 — commit 14b121c)
- [x] Supabase schema.sql: `profiles`, `categories`, `transactions`, `import_batches` + RLS
- [x] Auth pages: login (light theme), register (T&C UU PDP), verify OTP, callback route
- [x] `frontend/middleware.ts` — route protection (settings/profile/admin protected, `/` public)
- [x] `frontend/src/utils/supabase/{client,server,middleware}.ts`
- [x] `useAuth.ts` hook — `{ user, loading, signOut }` via `onAuthStateChange`
- [x] `useTransactions.ts` — localStorage (guest) → Supabase (cloud), auto-migrate on login
- [x] Header auth state: user first name, signOut, login CTA
- [x] Backend `app/auth.py` — `require_auth` dependency, JWT verify via `SUPABASE_JWT_SECRET`
- [x] Backend `app/supabase_client.py` — service-role admin client
- [x] `GET /me` endpoint — verifikasi token, return user info
- [x] Guard Supabase env vars di middleware (fix nft.json Vercel error — commit a66ccfc)

### Frontend UI
- [x] Upload CSV/Excel mutasi bank + analisis session
- [x] KPI Cards: Pemasukan, Pengeluaran, Net Cashflow, Savings Rate, Tx Count, Langganan
- [x] Monthly Chart (bar chart income vs expense)
- [x] Spending Wheel (pie chart kategori)
- [x] Forecast Chart (time series + ML prediction)
- [x] Health Gauge (skor kesehatan keuangan)
- [x] Top Merchants (leaderboard)
- [x] Subscription List (deteksi langganan)
- [x] Story Cards (narasi bulanan AI-style, rule-based)
- [x] Simulator Panel (what-if scenario)
- [x] Spending Heatmap (GitHub-style kalender)
- [x] SharePanel (WA Share + CSV Export + QRIS Donasi)
- [x] QRIS Donasi modal (qris.jpeg committed)
- [x] SmartInput "Catat Cepat" — NLP parse (25rb, 5jt, ngopi → Makan)
- [x] SmartInput OCR upload — tombol 📷 camera, upload foto → POST `/ai/ocr` → auto-fill form
- [x] QuickTracker — post-input list, delete per-tx, CSV export, period filter
- [x] OprexDuit rebrand: logo PNG baru (128×128 optimized), header cleanup
- [x] **Light theme** font fix — semua komponen pakai warna gelap (slate-600/700)
  - BalanceCard, KPICards, TopMerchants, SpendingWheel, HealthGauge, tab-pill CSS
- [x] Header light theme contrast fix (commit af3c3cb)
- [x] Empty state redesign — 2-column (upload + KPI teaser / QuickTracker)
- [x] Dashboard greeting fix (`text-slate-800`)
- [x] Tab "Aktivitas" di dashboard
- [x] Brand icons metode bayar (text-badge fallback)
- [x] FloatingAIChat auth fix — pakai `@/utils/supabase/client` (bukan `@supabase/auth-helpers-nextjs`)

### Backend Bug Fixes
- [x] `_clean_amount` rewrite (commit af3c3cb) — Indonesian number format
  - `1.234.567` → 1234567, `50.000` → 50000, `Rp 1.234.567,89` → 1234567.89
  - 13/13 test cases pass
- [x] `infer_datetime_format` removed (pandas 2+ compat)
- [x] `parseIDR`: rebu/miliar/triliun + brand auto-kategorisasi

### Bugfix + Polish Batch (2026-04-26 — commit 1a3214b)
- [x] Kategorisasi transaksi di-backup dengan AI fallback terukur (mengurangi dominasi kategori `Lainnya`)
- [x] Sinkronisasi kategori canonical backend ↔ frontend + alias mapping yang lebih kuat
- [x] `analyze_me` expose `transaction.id` dan persist recategorization ke `category_raw`
- [x] Delete transaksi dipertegas di daftar transaksi dan dashboard
- [x] Avatar diganti ke sistem avatar hewan (tokenized), konsisten di register/settings/header/topnav
- [x] Top navigation jadi fungsional (Mode selector, Search modal, Bell panel, shortcut Cmd/Ctrl+K)
- [x] Motion system dipoles (scroll reveal reusable + parallax ambient + route/section transitions)

### Dokumentasi Artefak (rev 10)
- [x] 17 file artefak — product, auth, arch, features, DB, optimization, roadmap, admin, agent planner, tier, payment, DB alternatives, feature ideas, redesign, mobile, AI cost, master tracking
- [x] Artefak semua updated 2026-04-20 dengan status OCR pipeline terbaru

### Telegram Bot (Phase Telegram — DONE)
- [x] `app/telegram_bot.py` — webhook handler, auto user create, inline keyboard
- [x] `/start` — auto-create Supabase user (telegram-only), welcome message
- [x] `/link` — generate link code, blocked jika sudah linked
- [x] `/catat` — simpan transaksi via free text (50rb makan siang)
- [x] `/ringkasan` — ringkasan hari ini
- [x] `/laporan` — laporan bulan ini
- [x] `/budget` — cek status budget vs limit
- [x] `/belanja` — shopping flow dengan inline keyboard buttons (platform pilih, produk, lapor)
- [x] `/bantuan` — panduan lengkap
- [x] Shopping intent detection — "saya mau belanja", "cariin", "beli" → auto-trigger /belanja
- [x] Inline keyboard: platform picker (Shopee/TikTok Shop/Alfagift), beli URL button, lapor button
- [x] Konfirmasi "Sudah Beli" via button → auto-catat transaksi
- [x] Lapor link rusak via button → insert ke `link_reports` Supabase
- [x] `_SHOPPING_SESSIONS` dict — stateful per chat_id

### Affiliate System (Phase Affiliate — DONE)
- [x] `data/migrations/002_affiliate_tables.sql` — `affiliate_products` + `link_reports` + triggers
- [x] `GET /affiliate/products` — list produk aktif (publik, no auth)
- [x] `POST /affiliate/products` — tambah produk (auth required)
- [x] `PUT /affiliate/products/{id}` — edit produk (auth required)
- [x] `DELETE /affiliate/products/{id}` — hapus produk (auth required)
- [x] `POST /affiliate/report` — user lapor link rusak (auth required)
- [x] `GET /affiliate/reports` — admin lihat semua laporan + join produk (auth required)
- [x] `DELETE /affiliate/reports/{id}` — admin dismiss laporan (auth required)
- [x] `frontend/src/components/ReportLinkButton.tsx` — button + modal lapor link

### Admin Console v1 (Phase 5 — DONE, repo terpisah)
- [x] Repo: `conoday/oprex-admin-console`
- [x] Dashboard, affiliate CRUD, link reports, settings, API keys

### Admin Console v2 (Phase Admin v2 — DONE, 2026-04-19)
- [x] Dashboard overhaul: hapus financial cards, tambah sparkline 7d + source breakdown chart
- [x] Transactions: user name + copyable user_id + tx_id + search filter
- [x] Log Explorer: `app/logs/page.tsx` — live mode, level/source filter, expandable
- [x] OCR Metadata: `app/ocr-metadata/page.tsx` — detected fields per bank
- [x] Sidebar: menu baru (Logs, OCR Metadata)
- [x] Backend: `/admin/stats` (tanpa income/expense), `/admin/logs`, `/admin/ocr-metadata`

### Shared Budget Room (Phase Room — DONE, 2026-04-18)
- [x] Room create/join via Telegram (`/room create`, `/room join KODE`)
- [x] Transaction scope: private / couple / group
- [x] Notifikasi ke member room saat ada transaksi baru
- [x] `_notify_room_members()` — kirim info tx ke semua member

### AI Chat + Guardrails (Phase AI — DONE, 2026-04-19)
- [x] AI Chat dgn akses data transaksi user (30 tx terakhir)
- [x] Guardrails: tidak bocorkan system prompt, API keys, DB schema
- [x] AI hanya jawab topik keuangan
- [x] Multi-provider key rotation (GLM → DeepSeek → Gemini)
- [x] Admin Console: API key management CRUD + priority
- [x] Frontend: auth token dikirim ke `/ai/chat` untuk personalisasi

### OCR (Phase OCR — DONE, iterasi 2026-04-20)
- [x] Backend: Arsitektur 2-Stage OCR Pipeline karena limitasi z.ai proxy membuang gambar.
- [x] Stage 1 (Mata): API Publik gratis `api.ocr.space` menarik raw text berantakan dari gambar (key: `helloworld`).
- [x] Stage 2 (Otak): `GLM-4.7` menerima raw OCR text dan merakitnya ulang menjadi terstruktur JSON.
- [x] Telegram: foto → `_handle_photo_ocr()` → 2-Stage Pipeline → parse JSON → simpan DB
- [x] `_AnthropicCaller.create()` — compatible wrapper proxy z.ai
- [x] `_safe_json_parse()` — repair whitespace, JSON syntax recovery, dan regex list extractor fallback
- [x] Prompt debiased — generic placeholder, bukan contoh spesifik
- [x] Web endpoint: `POST /ai/ocr` (multipart file upload)
- [x] Web SmartInput: tombol 📷 camera → upload foto → OCR → auto-fill form
- [x] Bank metadata collection → `bank_ocr_metadata` table
- [x] Admin Console: OCR Metadata page per bank
- [x] Debug logging: image size (KB), raw AI response (first 500 chars)

### Donasi (Phase Donasi — DONE, 2026-04-19)
- [x] Web: QRIS modal di SharePanel + Header button
- [x] Telegram: `/donasi` command → kirim foto QRIS via `sendPhoto` API
- [x] `/menu` keyboard: tombol 💝 Donasi + 📷 OCR hint text
- [x] Env: `QRIS_IMAGE_URL` (default: oprexduit.vercel.app/qris.jpeg)

---

## ⚠️ BUTUH ACTION DARI KAMU (User)

| # | Task | Di mana | Priority |
|---|---|---|---|
| 1 | Set env vars Supabase (jika belum) | Vercel + Render | 🟡 Jika auth belum jalan |
| 2 | Deploy admin console ke Vercel | cd oprexduit-admin-consol → vercel --prod | 🟡 Optional |
| 3 | Set env admin console | NEXT_PUBLIC_API_URL + NEXT_PUBLIC_ADMIN_TOKEN di Vercel | 🟡 Setelah deploy |
| 4 | Rotate API keys AI | Keys Kimi & GLM yang di-share di chat harus di-revoke | 🔴 Security |
| 5 | Daftar Midtrans Sandbox | https://dashboard.midtrans.com → set MIDTRANS_SERVER_KEY | 🟠 Phase Payment |

---

## 🟡 IN PROGRESS

| Task | Status | Notes |
|---|---|---|
| OCR quality tuning | 🔧 Iterating | AI kadang misread gambar, prompt & model terus ditune |
| Tier enforcement backend | 🔧 Schema ready | Belum enforce max 3 akun, max 3 bulan history |
| SQL migration: system_logs | 🔧 Pending | Tabel untuk Log Explorer — harus run manual di Supabase |
| SQL migration: bank_ocr_metadata | 🔧 Pending | Tabel untuk OCR Metadata — harus run manual di Supabase |

---

## 🔲 BACKLOG — Phase 3 (Sprint Berikutnya)

| ID | Fitur | Estimasi | Tier | Dependency |
|---|---|---|---|---|
| P3-1 | Transaction CRUD endpoints (POST/GET/PUT/DELETE /transactions) | 4 jam | All | Supabase setup |
| P3-2 | Budget per kategori — set monthly cap, progress bar, alert >80% | 3 jam | Pro | P3-1 |
| P3-3 | Multi-rekening — Cash/BCA/Dana/GoPay di SmartInput | 3 jam | Pro | P3-1 |
| P3-4 | Free tier enforcement: max 3 akun, history 3 bulan | 2 jam | Free | P3-1 |
| P3-5 | PDF export laporan bulanan | 3 jam | Pro | P3-1 |
| P3-6 | Dark/light mode toggle — simpan di localStorage | 2 jam | All | — |
| P3-7 | Smart Search transaksi (client-side filter) | 2 jam | Free | P3-1 |
| P3-8 | Recurring transaction detection & flag | 3 jam | Pro | P3-1 |

## ✅ DONE — Phase AI (sebelumnya BACKLOG)

| ID | Fitur | Status | Notes |
|---|---|---|---|
| AI-3 | Financial Coach Chat — tanya-jawab keuangan | ✅ Done | AI Chat dgn guardrails + data access |
| AI-7 | AI Guardrails — keamanan | ✅ Done | Tidak bocorkan info backend |
| AI-8 | Multi-provider key rotation | ✅ Done | GLM → DeepSeek → Gemini fallback |

## 🔲 BACKLOG — Phase AI (lanjutan)

| ID | Fitur | Estimasi | Provider | Dependency |
|---|---|---|---|---|
| AI-1 | Smart Kategorisasi — auto-tag dari deskripsi merchant | 3 jam | GLM | - |
| AI-2 | Monthly Insight — "boros makan +30%" | 3 jam | GLM | - |
| AI-4 | Spending Prediction — prediksi pengeluaran bulan depan | 4 jam | Rule-based + LLM | - |
| AI-5 | Financial Persona — saver/impulsive/balanced | 3 jam | Rule-based | AI-2 |
| AI-6 | Bank Statement Parser AI — PDF → transaksi | 5 jam | DeepSeek R1 | - |

## ✅ DONE — Phase OCR (sebelumnya BACKLOG)

| ID | Fitur | Status | Notes |
|---|---|---|---|
| OCR-1 | Telegram photo OCR → AI vision parse | ✅ Done | `_handle_photo_ocr()` + GLM-4V |
| OCR-2 | Web `POST /ai/ocr` endpoint | ✅ Done | Multipart upload → AI parse |
| OCR-3 | Bank metadata collection | ✅ Done | `bank_ocr_metadata` table |
| OCR-4 | Admin OCR Metadata page | ✅ Done | Detected fields per bank |

## 🔲 BACKLOG — Phase OCR (lanjutan)

| ID | Fitur | Estimasi | Notes |
|---|---|---|---|
| OCR-5 | Web SmartInput: drag-drop foto + preview | 3 jam | Frontend UI |
| OCR-6 | Rule-based parser per bank (BCA/GoPay/OVO/Dana) | 4 jam | Dari bank_ocr_metadata |

## 🔲 BACKLOG — Phase Payment / Billing

| ID | Fitur | Estimasi | Notes |
|---|---|---|---|
| PAY-1 | Midtrans Snap integration backend | 4 jam | `POST /subscribe` |
| PAY-2 | Webhook handler `POST /payment/callback` | 2 jam | Signature verify |
| PAY-3 | Subscription CRUD (create, cancel, renew) | 3 jam | Tabel `subscriptions` |
| PAY-4 | Cron job: expire subscription lama | 1 jam | Via Supabase scheduled |
| PAY-5 | Frontend: upgrade CTA + payment flow | 4 jam | Redirect ke Midtrans Snap |
| PAY-6 | Billing portal: riwayat pembayaran | 3 jam | Pro tier |

## 🔲 BACKLOG — Omnichannel / WhatsApp

| ID | Fitur | Estimasi | Notes |
|---|---|---|---|
| WA-1 | WhatsApp Bot: catat transaksi via WA | 5 jam | Meta WABA / Twilio / Fonnte |
| WA-2 | WA: tanya ringkasan "berapa pengeluaran bulan ini?" | 4 jam | Butuh AI-2 |
| WA-3 | WA: kirim laporan bulanan otomatis | 3 jam | Cron + WA send |
| WA-4 | Email notifikasi: budget alert, laporan bulanan | 3 jam | Resend / Supabase email |
| WA-5 | Push notif (PWA) | 2 jam | service-worker |

## 🔲 BACKLOG — Mobile

| ID | Fitur | Estimasi | Notes |
|---|---|---|---|
| MOB-1 | Setup Expo project `mobile/` | 1 jam | `npx create-expo-app@latest` |
| MOB-2 | Shared auth dengan web | 4 jam | Setelah Web Auth done |
| MOB-3 | Bottom nav + gesture input | 3 jam | Native feel |
| MOB-4 | Mobile OCR (kamera langsung) | 4 jam | expo-camera |

---

## 🗺️ PRODUCT VISION & PRICING

### Tier Gratis — "Coba dulu, ketagihan nanti"

Tujuan: user masuk tanpa friction, rasakan value, lalu upgrade sendiri.

| Fitur | Status |
|---|---|
| Input manual transaksi (income/expense) | ✅ Done (SmartInput + QuickTracker) |
| Kategori otomatis (aturan keyword) | ✅ Done |
| Metode bayar: Cash, Bank, E-wallet | ✅ Done |
| Dashboard: saldo, income, expense bulan ini | ✅ Done |
| Chart pengeluaran per kategori | ✅ Done (SpendingWheel) |
| History transaksi — max 3 bulan | ✅ Done UI, 🔲 enforcement backend |
| Jumlah akun — max 3 | ✅ Done UI, 🔲 enforcement backend |
| Login Google | ✅ Done (Supabase auth, butuh env vars) |
| Upload file mutasi bank — max 5/bulan | ✅ Done UI, 🔲 enforcement backend |
| Spending Heatmap, WA Share, CSV Export | ✅ Done |

### Tier PRO — Rp 29.000/bulan (~$1.75)

Target: freelancer, karyawan aktif yang butuh kontrol lebih.

| Fitur | Status |
|---|---|
| Unlimited akun & history | 🔲 Phase 3 |
| Custom kategori | 🔲 Phase 3 |
| Tag transaksi | 🔲 Phase 3 |
| Budget per kategori + notifikasi >80% | 🔲 Phase 3 |
| Laporan bulanan otomatis (PDF) | 🔲 Phase 3 |
| Export CSV + PDF | ✅ CSV done — PDF 🔲 Phase 3 |
| OCR foto struk | 🔲 Phase OCR |
| Recurring transaction detection | 🔲 Phase 3 |
| Smart Search | 🔲 Phase 3 |

### Tier AI Personal — Rp 59.000/bulan (~$3.60)

Target: user yang mau insight cerdas, bukan cuma pencatatan.

| Fitur | Status |
|---|---|
| "Bulan ini boros di makan +30%" | 🔲 Phase AI |
| Weekend vs weekday pattern | 🔲 Phase AI |
| Smart suggestion ("kurangi kopi → hemat 300rb") | 🔲 Phase AI |
| Financial persona: saver/spender/impulsive | 🔲 Phase AI |
| Prediksi cashflow akhir bulan | 🔲 Phase AI |
| Smart kategorisasi AI (lebih akurat) | 🔲 Phase AI |
| Financial Coach Chat | ✅ Done |

### Tier Business — Rp 149.000/bulan (Future)

Target: UMKM, tim kecil, pasangan.

| Fitur | Status |
|---|---|
| Multi-user / shared wallet | 🔲 Far future |
| Laporan bisnis | 🔲 Far future |
| API access | 🔲 Far future |

### Scaling Pricing Guide:
```
0 → 100 user    : Supabase free (500MB), Render free → $0/bln infra
100 → 1.000     : Supabase Pro ($25), Render Starter ($7) → $32/bln infra
1.000 → 10.000  : Supabase Pro + pgBouncer, Render Standard → ~$60/bln infra
10.000+         : Migrate ke RDS + custom infra → lihat 12_database_alternatives.md
```

---

## 🗄️ DATABASE SCHEMA LENGKAP (Target v3)

Lihat detail di [05_data_modeling.md](05_data_modeling.md).

```
profiles              → id (FK auth.users), email, name, plan_type, telegram_chat_id, created_at
accounts              → id, user_id, name, type (bank/ewallet/cash), color, balance
transactions          → id, user_id, account_id, amount, type, category, sub_category,
                         payment_method, note, date, source, hour_of_day, day_of_week,
                         method, created_at
tags                  → id, user_id, name
transaction_tags      → transaction_id, tag_id
categories            → id, user_id, name, icon, color, budget_limit
budgets               → id, user_id, category_id, month, limit_amount, spent_amount
subscriptions         → id, user_id, tier, status, started_at, expires_at, payment_ref
import_batches        → id, user_id, filename, period, row_count, created_at
ai_profiles           → user_id, spending_pattern, risk_level, persona_type, last_analysis
affiliate_products    → id, name, url, platform, price, commission_rate, is_active, created_at
link_reports          → id, product_id, reported_by (username), reason, created_at
pending_telegram_links → chat_id, link_code, created_at
```

### Migration files
```
supabase/schema.sql              — core tables (v1)
data/migrations/002_affiliate_tables.sql — affiliate_products + link_reports
```

---

## 🤖 AI STRATEGY

```
Step 1 → Kumpulkan data (transaksi: waktu, kategori, frekuensi, nominal) ✅ DONE
Step 2 → Feature engineering (avg/hari, weekend ratio, top category) ✅ DONE
Step 3 → LLM Chat dgn data user + guardrails ✅ DONE
Step 4 → OCR Vision — foto → transaksi ✅ DONE
Step 5 → User profiling rule-based (saver/impulsive/balanced) 🔲 NEXT
Step 6 → Suggestion engine (IF makan>30% → warning) 🔲 NEXT
Step 7 → Personal AI agent per user (memory: kebiasaan, preferensi) 🔲 FUTURE
```

**AI Providers (aktif di `ai_api_keys` table):**

| Priority | Provider | Base URL | Model | Usage |
|---|---|---|---|---|
| 1 | **GLM** | api.z.ai (Anthropic-compatible) | glm-4.7 (chat), glm-4v-flash (OCR) | Primary provider |
| 2 | **DeepSeek** | api.deepseek.com/v1 | deepseek-chat | Fallback |
| 3 | **Gemini** | generativelanguage.googleapis.com | gemini-2.0-flash | Fallback |

Key dikelola via Admin Console → API Keys CRUD.
Rotasi otomatis (round-robin) + rate limit tracking.
Implementasi: `app/ai_service.py` — `_call_with_fallback()`.

---

## 📧 EMAIL & NOTIFIKASI

| Service | Use Case | Provider | Status |
|---|---|---|---|
| Email verifikasi akun | Kirim magic link / OTP saat register | **Supabase built-in SMTP** | ✅ Otomatis (tinggal aktifkan) |
| Email laporan bulanan | Kirim PDF setiap awal bulan | **Resend** (resend.com) | 🔲 Phase 3 |
| Email budget alert | "Pengeluaran Makan sudah 80%" | Resend | 🔲 Phase 3 |
| WhatsApp transaksi | Catat via WA chat | Fonnte / Twilio WABA | 🔲 Phase WA |
| WhatsApp laporan | Kirim otomatis tiap akhir bulan | Fonnte / Twilio WABA | 🔲 Phase WA |
| Push notif (PWA) | Alert real-time di browser | service-worker + Supabase Realtime | 🔲 Phase 3 |

**Email Verifikasi — sudah built-in Supabase:**
- Aktifkan di Supabase → Auth → Email templates
- Template bisa di-customize (nama brand OprexDuit, warna teal)
- Untuk production: pasang custom SMTP (Resend/SendGrid) agar tidak masuk spam

---

## 💳 BILLING FLOW (FREE → PRO)

```
User klik "Upgrade ke Pro"
    ↓
Frontend POST /subscribe { tier: "pro" }
    ↓
Backend buat order Midtrans Snap
    ↓
Frontend redirect → halaman pembayaran Midtrans
    ↓
User bayar (QRIS / VA Bank / GoPay / OVO / Kartu)
    ↓
Midtrans POST /payment/callback (webhook)
    ↓
Backend verifikasi HMAC-SHA512 signature
    ↓
Backend UPDATE profiles SET plan_type = 'pro', expires_at = NOW() + 30d
    ↓
✅ User langsung dapat akses fitur Pro
```

**Biaya nyata per transaksi Rp 29.000:**
- Via QRIS: fee 0.7% = Rp 203 → kamu terima Rp 28.797
- Via VA Bank: fee Rp 4.000 flat → kamu terima Rp 25.000
- Midtrans tidak ada biaya bulanan — bayar per transaksi saja

Lihat detail kode di [11_payment_gateway.md](11_payment_gateway.md).

---

## 📱 OMNICHANNEL / WHATSAPP

**Pilihan Provider WA:**

| Provider | Harga | Kemudahan | Cocok untuk |
|---|---|---|---|
| **Fonnte** | Rp 99K/bulan | ⭐⭐⭐⭐⭐ | MVP Indonesia — paling mudah setup |
| **Twilio WABA** | $0.005/pesan | ⭐⭐⭐ | Scale — butuh Meta Business verification |
| **WA Cloud API (Meta)** | Gratis 1000 conv/bln | ⭐⭐ | Gratis tapi proses approval lama |
| **Wablas** | Rp 75K/bulan | ⭐⭐⭐⭐ | Alternatif Fonnte |

**Flow WhatsApp Bot:**
```
User kirim WA ke nomor bot
    ↓
"belanja 50rb indomaret"
    ↓
Webhook → FastAPI POST /wa/message
    ↓
Parse natural language (sama seperti SmartInput)
    ↓
Simpan ke Supabase transactions (user_id dari nomor WA)
    ↓
Reply: "✅ Dicatat! Belanja Rp 50.000 di Indomaret"
```

Ini Phase WA — ditunda sampai Phase 3 selesai.

---

## 🆕 INISIATIF & KEPUTUSAN (Changelog)

| Tanggal | Inisiatif | Status |
|---|---|---|
| 2026-04-10 | Redesign warm dark → light palette | ✅ Done |
| 2026-04-10 | Spending Heatmap | ✅ Done |
| 2026-04-10 | WA Share + CSV Export + QRIS modal | ✅ Done |
| 2026-04-10 | Admin Console scaffold | ✅ Done |
| 2026-04-10 | AI provider analysis → DeepSeek recommended | ✅ Documented |
| 2026-04-10 | Light theme + encoding bug fixes (4e98fb0) | ✅ Done |
| 2026-04-10 | parseIDR: rebu/miliar/triliun + brand auto-kategorisasi | ✅ Done |
| 2026-04-10 | Phase 2 Auth complete (14b121c) | ✅ Done |
| 2026-04-12 | Artefak full cleanup & checkpoint (rev 6) | ✅ Done |
| 2026-04-17 | Telegram Bot launch + affiliate system | ✅ Done |
| 2026-04-18 | Shared Budget Room + notifikasi ke members | ✅ Done |
| 2026-04-18 | Admin Console: API key management CRUD | ✅ Done |
| 2026-04-18 | Bug fix: parser "27 rebu" → 27000, budget alert schema | ✅ Done |
| 2026-04-19 | AI Chat: guardrails + akses data transaksi user | ✅ Done |
| 2026-04-19 | Telegram OCR: foto → AI vision → parse transaksi | ✅ Done |
| 2026-04-19 | Web OCR endpoint: POST /ai/ocr | ✅ Done |
| 2026-04-19 | Admin Console v2: dashboard overhaul, log explorer, OCR metadata | ✅ Done |
| 2026-04-19 | Donasi: QRIS Telegram + /donasi command | ✅ Done |
| 2026-04-19 | Logo baru: logo_oprexduit.png → frontend/public/logo.png | ✅ Done |
| 2026-04-19 | Artefak rev 8: 01,03,04,07,08,17 updated | ✅ Done |

---

## 🚫 DITUNDA / PARKING LOT

| Fitur | Alasan |
|---|---|
| WhatsApp Bot | Focus web dulu, setup Meta WABA butuh waktu |
| Open Banking API | Regulasi OJK, butuh lisensi AFPI |
| Multi-currency | Scope terlalu lebar untuk MVP |
| Crypto portfolio | Risiko regulasi Indonesia |
| Investasi reksa dana | Butuh lisensi OJK |
| Native Android/iOS | Pakai PWA + Expo nanti — setelah web stabil |

---

## 📋 KEPUTUSAN TEKNIS PENTING

| Tanggal | Topik | Keputusan |
|---|---|---|
| 2026-04-10 | Database | Supabase free → Pro $25 → AWS RDS (lihat 12_database_alternatives.md) |
| 2026-04-10 | AI Provider | Kimi (grupy) atau DeepSeek-V3 untuk MVP. Hybrid Gemini Flash untuk scale |
| 2026-04-10 | Auth | Supabase Auth (bukan NextAuth) — JWT verify di FastAPI via python-jose |
| 2026-04-10 | Tier strategy | Free = ketagihan, Pro = export+budget, AI = insight+prediction |
| 2026-04-10 | AI build order | Data dulu → rule-based → LLM insight → personal agent |
| 2026-04-10 | Payment | Midtrans (MVP) → Xendit (scale) |
| 2026-04-12 | Email notif | Supabase built-in (verifikasi) + Resend (transactional) |
| 2026-04-12 | WhatsApp | Fonnte (MVP Indonesia) → Twilio WABA (scale) |
| 2026-04-12 | Mobile | PWA-first, lalu Expo React Native |

---

## 🔑 CREDENTIAL CHECKLIST

**Supabase (wajib sebelum login bisa jalan):**
- [ ] `NEXT_PUBLIC_SUPABASE_URL` → Vercel env vars
- [ ] `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` → Vercel env vars
- [ ] `SUPABASE_JWT_SECRET` → Render env vars
- [ ] `SUPABASE_SERVICE_ROLE_KEY` → Render env vars (backend admin)
- [ ] Site URL: `https://finance-analyzer-roan.vercel.app`
- [ ] Redirect URL: `https://finance-analyzer-roan.vercel.app/auth/callback`

**Lainnya:**
- [ ] `NEXT_PUBLIC_API_URL=https://finance-analyzer-a82j.onrender.com` → Vercel
- [ ] `ALLOWED_ORIGINS=https://finance-analyzer-roan.vercel.app` → Render
- [ ] Google OAuth: Client ID + Secret → Supabase Auth → Google provider
- [ ] Midtrans: `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY` → Render (Phase Payment)
- [ ] AI key: `KIMI_API_KEY`, `KIMI_BASE_URL` → Render (Phase AI)
- [ ] AI key: `GLM_API_KEY` → Render (Phase AI)
- [ ] Resend: `RESEND_API_KEY` → Render (Phase email notif)
- [ ] Fonnte/Twilio: WA token → Render (Phase WA)

---

## 📎 FILE REFERENSI

| File | Isi |
|---|---|
| `artefak/09_prompt_agent_planner.md` | Master prompt untuk agent lanjutkan pekerjaan |
| `artefak/05_data_modeling.md` | SQL DDL lengkap + schema v3 |
| `artefak/07_roadmap.md` | Fase & sprint detail |
| `artefak/10_tier_system.md` | Feature gate per tier + kode enforcement |
| `artefak/11_payment_gateway.md` | Midtrans integration (kode lengkap) |
| `artefak/16_ai_cost_analysis.md` | Pilihan AI provider + sample code |
| `artefak/15_mobile_apps_plan.md` | Expo mobile plan |
| `SECRETS.md` | Env vars lengkap (GITIGNORED) |
| `.env.example` | Template env vars |
| `test_ai_keys.py` | Script test AI API keys (grupy-aware) |

