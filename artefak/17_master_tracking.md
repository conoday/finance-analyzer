# Master Tracking Board — OprexDuit

> Last updated: 2026-04-10 (rev 4)
> Agent baru: baca file ini PERTAMA sebelum melakukan apapun
> Ini adalah source of truth untuk status semua pekerjaan

---

## 🔵 STATUS SISTEM (selalu update)

| Komponen | Status | URL / Location |
|---|---|---|
| Frontend | ✅ Live | https://finance-analyzer-roan.vercel.app |
| Backend API | ✅ Live | https://finance-analyzer-a82j.onrender.com |
| Database | 🔧 Schema siap | Supabase — jalankan `supabase/schema.sql` |
| Auth | 🔧 UI siap, skip dulu | Login/Register/Verify/Callback pages dibuat |
| Admin Console | 🔧 Scaffolded | admin-console/ di repo, belum deploy |
| Git Repo | ✅ Active | conoday/finance-analyzer, branch main |

---

## ✅ DONE — Semua yang sudah selesai

### Infrastruktur
- [x] FastAPI backend (`api/main.py`) — 5 endpoints
- [x] Next.js 16 frontend — deployed Vercel
- [x] Python pipeline 9 modul — parse CSV/Excel mutasi bank
- [x] Docker Compose stack (Postgres, backend, frontend)
- [x] `vercel.json` + `render.yaml` config
- [x] `requirements.txt` Lambda-safe (streamlit dipisah ke requirements-local.txt)
- [x] CORS env-based (`ALLOWED_ORIGINS`)
- [x] Root `/` HTML endpoint di backend
- [x] `.env.example` template
- [x] `SECRETS.md` (gitignored) — panduan env vars

### Frontend Features
- [x] Upload CSV/Excel mutasi bank
- [x] KPI Cards: Pemasukan, Pengeluaran, Net Cashflow, **Savings Rate** (baru), Tx Count, Langganan
- [x] Monthly Chart (bar chart income vs expense)
- [x] Spending Wheel (pie chart kategori)
- [x] Forecast Chart (time series + ML prediction)
- [x] Health Gauge (skor kesehatan keuangan)
- [x] Top Merchants (leaderboard)
- [x] Subscription List (deteksi langganan)
- [x] Story Cards (narasi bulanan AI-style)
- [x] Simulator Panel (what-if scenario)
- [x] **SpendingHeatmap** (baru) — GitHub-style kalender pengeluaran/pemasukan
- [x] **SharePanel** (baru) — floating bar: WA Share + CSV Export + QRIS Donasi
- [x] **DonasiModal** (baru) — modal QRIS donasi dengan placeholder qris.png
- [x] Tab "Aktivitas" (baru) di dashboard
- [x] Redesign warm dark palette (#0f1117, amber accent)
- [x] DM Mono font untuk angka
- [x] Redesign teal/navy (Sprint 2 — #060d1a bg, #14b8a6 teal)
- [x] SmartInput "Catat Cepat" — natural language parse (25rb, 5jt, dll)
- [x] Bug fix: duplikat kategori di SmartInput (Transport+Transportasi, Tagihan+Utilitas)
- [x] SmartInput redesign — cleaner form UI, select dropdown kategori, brand icons metode bayar
- [x] Brand icons metode bayar — **text-badge fallback** (Simple Icons tidak punya bank Indonesia: BCA/OVO/Dana/BRI/BNI/Mandiri/QRIS)
- [x] **OprexDuit rebrand**: logo SVG, header cleanup, Login "Soon" tooltip
- [x] **QuickTracker**: post-input dashboard, category breakdown, delete per-tx, brand text badges
- [x] **QRIS modal fix**: qris.jpeg committed, white-bg container, Clipboard API copy + download fallback
- [x] **ParseInput fix**: ngopi/nongkrong/kopdar/warteg → Makan; 50.000 dot=thousands separator bug fixed
- [x] **UI lighten**: background #060d1a→#0d1829, glass opacity +0.025, borders lebih visible
- [x] Supabase setup: schema.sql (profiles, categories, transactions, import_batches + RLS)
- [x] Auth pages: login, register (T&C 5 seksi UU PDP), verify OTP, callback route
- [x] Route protection via proxy.ts
- [x] TransactionList, BalanceCard, CategoryBadge components

### Dokumentasi Artefak (15+2 files)
- [x] 01-09: Product overview, auth, arch, features, DB, optimization, roadmap, admin, agent planner
- [x] 10-12: Tier system, payment gateway, DB alternatives
- [x] 13-15: Feature ideas, redesign plan, mobile apps plan
- [x] 16: AI cost analysis (DeepSeek vs Gemini vs Kimi)
- [x] 17: Master tracking (file ini)

---

## 🟡 BUTUH ACTION DARI KAMU (User)

| # | Task | Di mana | Notes |
|---|---|---|---|
| 1 | Run `supabase/schema.sql` | Supabase → SQL Editor | Paste & Run sekali |
| 2 | Set Site URL + Redirect URL | Supabase → Auth → URL Config | `https://finance-analyzer-roan.vercel.app/auth/callback` |
| 3 | Enable Email provider | Supabase → Auth → Providers → Email | ON, Confirm email ON |
| 4 | Setup Google OAuth | Google Cloud Console → Credentials | Client ID + Secret → paste ke Supabase |
| 5 | Set Vercel env vars | Vercel → Project → Settings → Env | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |
| 6 | Taruh QRIS image | ~~`frontend/public/qris.png`~~ **DONE** — `qris.jpeg` committed | ✅ Modal donasi sudah live |

## 🟡 IN PROGRESS

| Task | Who | Notes |
|---|---|---|
| Auth flow (ditunda) | — | Pages sudah dibuat, diaktifkan setelah Supabase dikonfigurasi |
| Admin Console scaffold | Agent | Folder `admin-console/` sudah dibuat, belum deploy |

---

## 🔲 BACKLOG — Ordered by Priority

### Sprint Berikutnya (Quick Win, Max Impact)

| ID | Fitur | Estimasi | Tier |
|---|---|---|---|
| QW-1 | F01: Quick Add Transaction (modal input manual, simpan ke localStorage dulu) | 4 jam | Free |
| QW-2 | A02: Merchant Leaderboard visual upgrade (rank badges, % share bar) | 2 jam | Free |
| QW-3 | F06: Smart Search — cari transaksi di client-side | 3 jam | Free |
| QW-4 | A08: Year-in-Review summary card | 3 jam | Free |
| QW-5 | Sample Data button lebih prominent di hero | 1 jam | Free |
| QW-6 | Dark mode toggle (sudah gelap, tambah light mode opsional) | 3 jam | Free |

### Phase 2 — Auth (Prioritas Tinggi)

| Task | Estimasi | Dependency |
|---|---|---|
| Install next-auth@^5, setup Google OAuth | 2 jam | Google Cloud Console project |
| Buat `frontend/src/app/api/auth/[...nextauth]/route.ts` | 1 jam | NEXTAUTH_SECRET di Vercel env |
| Setup Supabase project + run DDL dari artefak/05 | 2 jam | Supabase account |
| Protect routes dengan middleware.ts | 1 jam | Auth setup done |
| Update Header: login/logout button | 1 jam | Auth setup done |
| Backend `POST /auth/verify` endpoint | 2 jam | DATABASE_URL di Render env |

### Phase 3 — DB + Tier Enforcement

| Task | Estimasi | Dependency |
|---|---|---|
| Transaction CRUD endpoints | 4 jam | Database Phase 2 |
| File import quota (table file_imports) | 2 jam | Database Phase 2 |
| Frontend: form input manual per transaksi | 4 jam | Auth Phase 2 |

### Phase AI — AI Features

| Task | Estimasi | Dependency |
|---|---|---|
| Setup DeepSeek API key di Render | 30 menit | DEEPSEEK_API_KEY |
| Buat `backend/services/ai.py` | 3 jam | API key done |
| Auto-kategorisasi batch saat upload | 2 jam | ai.py done |
| Monthly AI insight di dashboard | 2 jam | ai.py done |
| Rate limiting per tier (Free 20x/bulan) | 2 jam | Auth + DB done |

### Phase 4 — OCR (Foto Struk)

| Task | Estimasi | Dependency |
|---|---|---|
| Endpoint `POST /extract-image` | 4 jam | pytesseract install |
| BCA/GoPay/OVO regex parser | 3 jam | Image endpoint done |
| Frontend: upload foto + preview + konfirmasi | 3 jam | OCR done |

### Phase 5 — Admin Console (Deploy)

| Task | Estimasi | Dependency |
|---|---|---|
| Deploy admin-console ke Vercel (project baru) | 1 jam | Scaffold done |
| Connect ke backend API | 1 jam | Deploy done |
| Real user data (ganti mock) | 3 jam | Auth + DB done |

### Phase 6 — Payment

| Task | Estimasi | Dependency |
|---|---|---|
| Midtrans integration backend | 4 jam | SERVER_KEY env var |
| `POST /subscribe` + webhook `/payment/callback` | 3 jam | Midtrans setup |
| Frontend: upgrade CTA + payment flow | 4 jam | Backend done |

### Mobile (Post Phase 6)

| Task | Estimasi | Notes |
|---|---|---|
| Setup Expo project `mobile/` | 1 jam | `npx create-expo-app@latest mobile --template tabs` |
| Shared auth dengan web | 4 jam | Setelah Web Auth done |
| Lihat artefak/15_mobile_apps_plan.md | — | Detail planning sudah ada |

---

## 🗺️ PRODUCT VISION — Free vs Subscription (Finalized 2026-04-10)

### 🎁 FREE tier — "ketagihan dulu, bayar nanti"

| Fitur | Status |
|---|---|
| Tambah transaksi manual (income/expense) | ✅ SmartInput done (localStorage) |
| Kategori otomatis (makan, transport, dll) | ✅ Brand rules done |
| Metode bayar: Cash, Bank, E-wallet | ✅ Done |
| Dashboard: saldo total, pengeluaran/pemasukan bulan ini | ✅ Done |
| Chart pengeluaran per kategori | ✅ SpendingWheel done |
| History transaksi | ✅ QuickTracker done |
| Filter: periode (7d/30d/all) | ✅ Done |
| Login Google | 🔲 Phase 2 |
| **Limitasi**: max 3 akun, history 3 bulan, tanpa export, tanpa AI | 🔲 Phase 3 enforcement |

### 💎 PRO Personal (target Rp 29K/bln)

| Fitur | Status |
|---|---|
| Unlimited akun & unlimited history | 🔲 Phase 3 |
| Custom kategori | 🔲 Phase 3 |
| Tag transaksi (ngedate, kerja, dll) | 🔲 Phase 3 |
| Smart input — natural language parsing | ✅ Done (rule-based) |
| Export CSV / PDF | ✅ CSV done — PDF 🔲 |
| Laporan bulanan otomatis | 🔲 Phase 3 |
| Budget per kategori + notifikasi over budget | 🔲 Phase 3 |

### 🤖 AI Personal Finance (target Rp 59K/bln)

| Fitur | Status |
|---|---|
| "Bulan ini boros di makan +30%" | 🔲 Phase AI |
| Weekend vs weekday pattern detection | 🔲 Phase AI |
| Smart suggestion ("kurangi kopi → hemat 300rb") | 🔲 Phase AI |
| Financial persona: saver / spender / impulsive | 🔲 Phase AI |
| Prediksi sisa uang & cashflow bulan depan | 🔲 Phase AI |
| Personal AI agent dengan user memory | 🔲 Phase AI+ |

### 🏢 Business / UMKM (Future)

| Fitur | Status |
|---|---|
| Multi-user / team wallet | 🔲 Far future |
| Laporan bisnis | 🔲 Far future |

---

## 🗄️ DATA MODEL TARGET v2

```
users          → id, email, created_at, plan_type
accounts       → id, user_id, name, type (bank/ewallet/cash), balance
transactions   → id, user_id, account_id, amount, type, category,
                 sub_category, payment_method, note, date, created_at
tags           → id, name
transaction_tags → transaction_id, tag_id
monthly_agg    → user_id, month, total_income, total_expense  [perf]
ai_profiles    → user_id, spending_pattern, risk_level,
                 persona_type, last_analysis  [AI data]
```

---

## 🤖 AI STRATEGY (jangan skip ini)

```
Step 1 → Collect data (transaksi: waktu, kategori, frekuensi, nominal)
Step 2 → Feature engineering (avg/day, weekend ratio, top category)
Step 3 → User profiling rule-based (saver/impulsive/balanced)
Step 4 → Suggestion engine rule-based dulu (IF makan>30% → warning)
Step 5 → LLM integration (DeepSeek-V3) → jawab "kenapa uang cepat habis?"
Step 6 → Personal AI agent per user (memory: kebiasaan, preferensi)
```

> **Prinsip**: bangun data dulu, baru AI. Value utama = insight, bukan cuma pencatatan.

---

## 🆕 NEW INITIATIVE — Baru Diputuskan

| Tanggal | Inisiatif | Status |
|---|---|---|
| 2026-04-10 | Redesign warm dark palette | ✅ Done |
| 2026-04-10 | Spending Heatmap | ✅ Done |
| 2026-04-10 | WA Share + CSV Export + QRIS modal | ✅ Done |
| 2026-04-10 | Admin Console scaffold | 🔧 In progress |
| 2026-04-10 | AI provider analysis → DeepSeek recommended | ✅ Documented |
| 2026-04-10 | Light theme UI + encoding bug fixes | ✅ Done (4e98fb0) |
| 2026-04-10 | QuickTracker period filter + CSV export | ✅ Done (2ca3753) |
| 2026-04-10 | parseIDR: rebu/miliar/triliun + brand auto-kategorisasi | ✅ Done |
| 2026-04-10 | Backend fix: infer_datetime_format removed (pandas 2+) | ✅ Done |
| 2026-04-10 | Product vision finalized: Free/Pro/AI tiers + AI strategy | ✅ Documented |
| 2026-04-10 | WA Bot/Omnichannel | ⏳ Ditunda |

---

## 🚫 DITUNDA / PARKING LOT

| Fitur | Alasan Ditunda |
|---|---|
| WhatsApp Bot | Focus web dulu, butuh Meta Business API review |
| Open Banking API | Regulasi OJK, butuh lisensi |
| Multi-currency | Scope terlalu lebar |
| Crypto portfolio | Risiko regulasi Indonesia |
| Investasi reksa dana | Butuh lisensi OJK |

---

## 📋 DISKUSI & KEPUTUSAN PENTING

| Tanggal | Topik | Keputusan |
|---|---|---|
| 2026-04-10 | AI Provider | **DeepSeek-V3** untuk MVP. Hybrid Gemini Flash untuk scale. |
| 2026-04-10 | Tier strategy | Free powerful→ketagihan, Pro export+budget, AI insight+prediction |
| 2026-04-10 | AI build order | Data dulu → rule-based → LLM insight → personal agent |
| 2026-04-10 | Database | Supabase free → Pro $25 → AWS RDS |
| 2026-04-10 | Admin console | Subfolder `admin-console/` di repo, deploy Vercel project berbeda |

---

## 🔑 CREDENTIAL CHECKLIST (user action needed)

- [ ] Set `NEXT_PUBLIC_API_URL` di Vercel dashboard → `https://finance-analyzer-a82j.onrender.com`
- [ ] Buat Supabase project → simpan connection string di SECRETS.md
- [ ] Set Site URL + Redirect URL di Supabase Auth config → `https://finance-analyzer-roan.vercel.app/auth/callback`
- [ ] Buat Google Cloud OAuth credentials → simpan di SECRETS.md
- [ ] Daftar DeepSeek → top up $5 → simpan API key di SECRETS.md

---

## 📎 FILE REFERENSI PENTING

| File | Isi |
|---|---|
| `artefak/09_prompt_agent_planner.md` | Master prompt untuk agent lanjutkan pekerjaan |
| `artefak/05_data_modeling.md` | SQL DDL + SQLAlchemy models |
| `artefak/10_tier_system.md` | Feature gate table per tier |
| `artefak/11_payment_gateway.md` | Midtrans integration code |
| `artefak/16_ai_cost_analysis.md` | Pilihan AI provider + sample code |
| `SECRETS.md` | Env vars lengkap (GITIGNORED) |
| `.env.example` | Template env vars |
