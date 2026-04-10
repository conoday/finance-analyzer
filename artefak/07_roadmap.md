# Roadmap

> Last updated: 2026-04-10
> Lihat tracking detail di `artefak/17_master_tracking.md`

## Overview

```
Phase 0 ─── Phase 1 ─── Phase 1.5 ── Phase 2 ─── Phase 3 ─── Phase AI ─── Phase 4 ─── Phase 5 ─── Phase 6
 Docs        Deploy      Sprint 1      Auth         DB+Tier     AI Feat       OCR          Admin       Payment
  ✅           ✅           ✅           🔲           🔲           🔲           🔲            🔧           🔲
```

## Phase 0 — Documentation ✅ DONE
Folder /artefak/ dengan 17 dokumen arsitektur dan tracking.

## Phase 1 — Deploy ✅ DONE
- Backend live: https://finance-analyzer-a82j.onrender.com
- Frontend live: https://finance-analyzer-roan.vercel.app

## Phase 1.5 — Sprint Free Features ✅ DONE (2026-04-10)
Semua fitur free diaktifkan, redesign, new components:
- ✅ Warm dark redesign (amber palette, DM Mono font)
- ✅ Spending Heatmap (GitHub-style kalender)
- ✅ Savings Rate % KPI card
- ✅ WA Share (floating panel, teks pre-filled)
- ✅ CSV Export
- ✅ QRIS Donasi modal
- ✅ Tab "Aktivitas" di dashboard
- ✅ Hero landing page lebih informatif
- 🔧 Admin Console scaffold (`admin-console/` folder)
- ⏳ QRIS image: user perlu taruh `frontend/public/qris.png`

## Phase 2 — Authentication 🔲 Next Sprint
- NextAuth.js v5 + Google OAuth
- User disimpan di Supabase PostgreSQL
- Field `tier` (free/pro/business) di tabel users
- Estimasi: 2-3 hari

## Phase 3 — Transaction CRUD + Tier Enforcement 🔲 Planned
- CRUD endpoint: POST/GET/PUT/DELETE /transactions
- Tabel file_imports untuk tracking kuota
- Middleware quota: Free = max 5 file upload/bulan
- Frontend: form input manual + file upload
- Estimasi: 3-5 hari

## Phase AI — AI Features 🔲 Planned (setelah Phase 2)
- Provider: **DeepSeek-V3** (lihat artefak/16_ai_cost_analysis.md)
- Auto-kategorisasi transaksi
- Monthly AI insight
- Rate limiting per tier
- Estimasi: 4-6 hari

## Phase 4 — Image Extraction (OCR) 🔲 Planned (setelah Phase 3)
- POST /extract-image
- pytesseract + per-bank regex (BCA, GoPay, OVO, DANA)
- User konfirmasi sebelum simpan
- OCR hanya tersedia untuk Pro dan Business tier
- Estimasi: 4-7 hari

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
