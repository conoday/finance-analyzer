# Roadmap

> Last updated: 2026-04-10 (rev 5)
> Lihat tracking detail di `artefak/17_master_tracking.md`

## Overview

```
Phase 0 ─── Phase 1 ─── Phase 1.5 ── Phase 2 ─── Phase 3 ─── Phase AI ─── Phase 4 ─── Phase 5 ─── Phase 6
 Docs        Deploy      Sprint 1      Auth         DB+Tier     AI Feat       OCR          Admin       Payment
  ✅           ✅           ✅           ✅           🔲           🔲           🔲            🔧           🔲
```

## Phase 0 — Documentation ✅ DONE
Folder /artefak/ dengan 17 dokumen arsitektur dan tracking.

## Phase 1 — Deploy ✅ DONE
- Backend live: https://finance-analyzer-a82j.onrender.com
- Frontend live: https://finance-analyzer-roan.vercel.app

## Phase 1.5 — Sprint Free Features ✅ DONE (2026-04-10)
- ✅ Light theme UI (clean, mudah dibaca)
- ✅ QuickTracker: period filter 7d/30d/all, CSV export, brand auto-kategorisasi
- ✅ SmartInput: parse rebu/miliar/triliun, brand detection (Starbucks, Indomaret, dll)
- ✅ Logo thicker strokes
- ✅ Backend: fix infer_datetime_format (pandas 2+ compat)
- ✅ Spending Heatmap, WA Share, QRIS Donasi modal
- ✅ Product vision finalized (Free → Pro → AI tier)

## Phase 2 — Authentication ✅ DONE (commit 14b121c + polish session)
**Goal**: user bisa login, data tersimpan permanent (bukan localStorage)
- ✅ Supabase Auth setup (schema.sql: profiles, categories, transactions, import_batches + RLS)
- ✅ Auth pages: login (light theme), register (T&C UU PDP), verify OTP, callback route
- ✅ `middleware.ts` proxy — protects /settings, /profile, /admin; `/` tetap publik
- ✅ `useAuth.ts` hook — `{ user, loading, signOut }` via `onAuthStateChange`
- ✅ `useTransactions.ts` — localStorage guest → auto-migrasi ke Supabase saat login
- ✅ Header auth state: user menu (first name), login button, signOut
- ✅ Backend `_clean_amount` fix — Indonesian dot-thousands format (1.234.567 → 1234567, 50.000 → 50000)
- ✅ Header light theme contrast fix — `rgba(255,255,255,0.88)` + `text-slate-800`
- ✅ Empty state redesign — 2-column: upload+teaser KPI / QuickTracker
- ✅ Dashboard greeting: `text-slate-100 → text-slate-800`

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
- Data collection: simpan `ai_profiles` dari pola transaksi
- Rule-based suggestion engine (IF spending > 30% → warning)
- Financial persona detection (saver/impulsive/balanced)
- DeepSeek-V3 integration untuk natural language insight
- "Bulan ini boros di makan +30%", prediksi cashflow
- Personal AI agent dengan memory per user
- Estimasi: 7-10 hari

## Phase 4 — Image Extraction (OCR) 🔲 Planned (setelah Phase 3)
- POST /extract-image
- pytesseract + per-bank regex (BCA, GoPay, OVO, DANA)
- Hanya Pro+ tier
- Estimasi: 4-7 hari

## Phase 5 — Admin Console 🔧 Scaffolded
- Deploy admin-console ke Vercel (project baru)
- Real user metrics

## Phase 6 — Payment 🔲 Planned
- Midtrans integration untuk upgrade tier
- Webhook /payment/callback
- Upgrade CTA di frontend

## Phase 5 — Admin Console 🔧 IN PROGRESS (scaffold done)
- Scaffold: `admin-console/` di repo ✅
- Deploy ke Vercel (project baru) 🔲
- Data real (butuh Phase 2+3) 🔲
- Estimasi deploy: 1 hari, data real: +2-3 hari

## Phase 6 — Payment Gateway (Monetisasi) 🔲 Planned
- Integrasi Midtrans atau Xendit
- Endpoint: POST /subscribe (buat invoice) + webhook /payment/callback
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
Phase 2 (Auth + Supabase)
     ├─→ Phase 3 (Transactions + Tier)
     │       ├─→ Phase AI (AI Categorization)
     │       ├─→ Phase 4 (OCR)
     │       └─→ Phase 6 (Payment)
     └─→ Phase 5 (Admin — data real)
              └─→ Phase 7 (Mobile)
```

## Quick Wins Berikutnya (sebelum Phase 2)

Tanpa database pun bisa dikerjakan:
1. F01 Quick Add Transaction (localStorage sementara)
2. F06 Smart Search (client-side filter transaksi)
3. A08 Year-in-Review summary card
4. Merchant leaderboard visual upgrade
5. Sample data button lebih prominent
