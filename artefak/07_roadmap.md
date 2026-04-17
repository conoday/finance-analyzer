# Roadmap

> Last updated: 2026-04-17 (rev 7)
> Lihat tracking detail di `artefak/17_master_tracking.md`

## Overview

```
Phase 0 ─── Phase 1 ─── Phase 1.5 ── Phase 2 ─── Phase TG ── Phase Aff ─ Phase 5 ─── Phase 3 ─── Phase AI ─── Phase 4 ─── Phase 6
 Docs        Deploy      Sprint 1      Auth       Telegram    Affiliate     Admin        DB+Tier     AI Feat       OCR         Payment
  ✅           ✅           ✅           ✅           ✅           ✅           ✅           🔲           🔲           🔲           🔲
```

## Phase 0 — Documentation ✅ DONE
Folder /artefak/ dengan 17 dokumen arsitektur dan tracking.

## Phase 1 — Deploy ✅ DONE
- Backend live: https://oprexduit.onrender.com
- Frontend live: https://finance-analyzer-roan.vercel.app

## Phase 1.5 — Sprint Free Features ✅ DONE (2026-04-10)
- ✅ Light theme UI (clean, mudah dibaca)
- ✅ QuickTracker: period filter 7d/30d/all, CSV export, brand auto-kategorisasi
- ✅ SmartInput: parse rebu/miliar/triliun, brand detection (Starbucks, Indomaret, dll)
- ✅ Logo thicker strokes
- ✅ Backend: fix infer_datetime_format (pandas 2+ compat)
- ✅ Spending Heatmap, WA Share, QRIS Donasi modal
- ✅ Product vision finalized (Free → Pro → AI tier)

## Phase 2 — Authentication ✅ DONE (commit 14b121c)
**Goal**: user bisa login, data tersimpan permanent (bukan localStorage)
- ✅ Supabase Auth setup (schema.sql: profiles, categories, transactions, import_batches + RLS)
- ✅ Auth pages: login, register (T&C UU PDP), verify OTP, callback route
- ✅ `middleware.ts` — protects /settings, /profile, /admin; `/` tetap publik
- ✅ `useAuth.ts` hook — `{ user, loading, signOut }` via `onAuthStateChange`
- ✅ `useTransactions.ts` — localStorage guest → auto-migrasi ke Supabase saat login
- ✅ Header auth state: user menu, login button, signOut
- ✅ Backend `require_auth` dependency, JWT verify via `SUPABASE_JWT_SECRET`
- ✅ `GET /me` endpoint

## Phase Telegram — Telegram Bot ✅ DONE (commit b8feffc, 2026-04-17)
**Goal**: user bisa catat transaksi, cek laporan, dan belanja via Telegram
- ✅ `app/telegram_bot.py` — webhook handler di `/telegram/webhook`
- ✅ `/start` — auto-create user Supabase, welcome message
- ✅ `/link` — generate link code 6 digit
- ✅ `/catat` — NLP parse free text (50rb makan siang → transaksi)
- ✅ `/ringkasan` — ringkasan pengeluaran hari ini
- ✅ `/laporan` — laporan bulan ini + top 3 kategori
- ✅ `/budget` — cek sisa budget vs limit
- ✅ `/belanja` — shopping flow: pilih platform → cari produk → beli → lapor
- ✅ Inline keyboard (tidak perlu ketik) — platform picker, URL beli, lapor link rusak
- ✅ Shopping intent detection — "saya mau belanja", "beli", "cariin" → auto-trigger /belanja
- ✅ Fix SyntaxError: file truncation commit 5fc7160

## Phase Affiliate — Affiliate System ✅ DONE (commit dc3b2d4)
**Goal**: monetisasi via komisi produk belanja rekomendasi
- ✅ Migration: `affiliate_products` + `link_reports` tables
- ✅ Backend CRUD endpoints (GET/POST/PUT/DELETE /affiliate/products)
- ✅ `POST /affiliate/report` + `GET/DELETE /affiliate/reports`
- ✅ `frontend/src/components/ReportLinkButton.tsx`

## Phase 5 — Admin Console ✅ DONE (repo terpisah, commit 342a5cb)
**Goal**: admin bisa manage produk affiliate, lihat laporan link rusak
- ✅ Repo: `github.com/conoday/oprex-admin-console`
- ✅ Dashboard stat cards (produk aktif, laporan pending)
- ✅ CRUD tabel affiliate products
- ✅ List + dismiss broken link reports
- ✅ Settings: API URL + Bearer token config
- Stack: Next.js 14 App Router, TypeScript, Tailwind

## Phase 3 — Transaction CRUD + Tier Enforcement 🔲 Planned
**Goal**: data persistent, tier dikunci
- CRUD endpoint: POST/GET/PUT/DELETE /transactions
- Accounts CRUD (multi-akun: cash, bank, e-wallet)
- Free tier enforcement: max 3 akun, history 3 bulan
- Budget per kategori (Pro tier)
- Tag transaksi (Pro tier)
- Custom kategori (Pro tier)
- Estimasi: 5-7 hari

## Phase AI — AI Features 🔲 Planned (setelah Phase 3)
**Goal**: insight otomatis, jadi bedanya OprexDuit dari app lain
- Rule-based suggestion engine (IF spending > 30% → warning)
- Financial persona detection (saver/impulsive/balanced)
- LLM integration untuk natural language insight
- "Bulan ini boros di makan +30%", prediksi cashflow
- Estimasi: 7-10 hari

## Phase 4 — Image Extraction (OCR) 🔲 Planned (setelah Phase 3)
- POST /extract-image
- pytesseract + per-bank regex (BCA, GoPay, OVO, DANA)
- Hanya Pro+ tier
- Estimasi: 4-7 hari

## Phase 6 — Payment Gateway (Monetisasi) 🔲 Planned
- Midtrans integration untuk upgrade tier
- POST /subscribe (buat invoice) + webhook /payment/callback
- Update tier user di DB setelah pembayaran sukses
- Estimasi: 3-5 hari

## Phase 7 — Mobile (Post Phase 6) 🔲 Future
- Expo React Native (`mobile/` subfolder)
- iOS + Android
- Lihat `artefak/15_mobile_apps_plan.md`

## Dependency Map
```
Phase 1.5 (Sprint Free) ← SELESAI
     │
Phase 2 (Auth + Supabase) ← SELESAI
     │
Phase Telegram ← SELESAI
     │
Phase Affiliate ← SELESAI
     │
Phase 5 (Admin Console) ← SELESAI (repo terpisah)
     │
Phase 3 (Transactions + Tier) ← NEXT
     ├─→ Phase AI (AI Categorization)
     ├─→ Phase 4 (OCR)
     └─→ Phase 6 (Payment)
              └─→ Phase 7 (Mobile)
```
