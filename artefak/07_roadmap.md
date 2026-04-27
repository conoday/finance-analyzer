# Roadmap

> Last updated: 2026-04-27 (rev 10)
> Lihat tracking detail di `artefak/17_master_tracking.md`

## Overview

```
Phase 0 ─ Phase 1 ─ Phase 1.5 ─ Phase 2 ─ Phase TG ─ Phase Aff ─ Phase 5 ─ Phase Room ─ Phase AI ─ Phase OCR ─ Phase Admin2 ─ Phase DocOps ─ Phase 3
     Docs     Deploy    Sprint 1     Auth     Telegram   Affiliate    Admin     Room+Notif   AI Chat    OCR Photo   Admin v2     Doc+DB Ops      DB+Tier
      ✅        ✅         ✅         ✅         ✅         ✅          ✅          ✅           ✅          ✅          ✅             ✅            🔲
```

## Phase 0 — Documentation ✅ DONE
Folder /artefak/ dengan 17 dokumen arsitektur dan tracking.

## Phase 1 — Deploy ✅ DONE
- Backend live: https://oprexduit.onrender.com
- Frontend live: https://finance-analyzer-roan.vercel.app

## Phase 1.5 — Sprint Free Features ✅ DONE (2026-04-10)
- ✅ Light theme UI, QuickTracker, SmartInput NLP parser
- ✅ Spending Heatmap, WA Share, QRIS Donasi modal
- ✅ Product vision finalized (Free → Pro → AI tier)

## Phase 2 — Authentication ✅ DONE
- ✅ Supabase Auth + JWT verify + backend guard
- ✅ Auth pages: login, register, verify OTP, callback
- ✅ useAuth hook + useTransactions (localStorage → cloud migration)

## Phase Telegram — Telegram Bot ✅ DONE
- ✅ 10+ commands: /start, /catat, /laporan, /ringkasan, /budget, /belanja, /room, /donasi
- ✅ NLP parser: "27 rebu" → 27000, "100k" → 100000
- ✅ Inline keyboard, shopping flow, link report button
- ✅ Shopping intent detection

## Phase Affiliate — Affiliate System ✅ DONE
- ✅ CRUD endpoints + link_reports
- ✅ Frontend ReportLinkButton

## Phase 5 — Admin Console v1 ✅ DONE
- ✅ Dashboard, affiliate CRUD, link reports, settings
- ✅ Repo terpisah: `conoday/oprex-admin-console`

## Phase Room — Shared Budget Room ✅ DONE (2026-04-18)
- ✅ Room create/join via Web & Telegram
- ✅ Transaction scope: private/couple/group
- ✅ Notifikasi ke member room saat ada transaksi baru
- ✅ Room info + member list

## Phase AI — AI Chat + Guardrails ✅ DONE (2026-04-19)
- ✅ AI Chat dengan akses data transaksi user (30 tx terakhir)
- ✅ Guardrails: tidak bocorkan system prompt, API keys, DB schema
- ✅ AI hanya jawab topik keuangan
- ✅ Multi-provider key rotation (GLM → DeepSeek → Gemini)
- ✅ Admin Console: API key management CRUD

## Phase OCR — Image Extraction ✅ DONE (iterasi 2026-04-20)
- ✅ Telegram: kirim foto → AI vision (GLM-4.7) → OCR → parse → simpan DB
- ✅ Web: `POST /ai/ocr` endpoint (multipart upload)
- ✅ Web SmartInput: tombol 📷 camera → upload foto → OCR → auto-fill form
- ✅ `_AnthropicCaller` auto-convert OpenAI image_url → Anthropic format
- ✅ `_repair_json()` + `_safe_json_parse()` — robust JSON parsing
- ✅ Prompt debiased (generic placeholders)
- ✅ Bank metadata collection → `bank_ocr_metadata` table
- ✅ Admin Console: OCR Metadata page per bank
- 🔧 OCR accuracy masih di-tune (AI kadang misread gambar)

## Phase Admin v2 — Admin Console Overhaul ✅ DONE (2026-04-19)
- ✅ Dashboard: hapus financial cards, tambah sparkline + source chart
- ✅ Transactions: user name + copyable IDs + search
- ✅ Log Explorer: terpusat, live mode + filter
- ✅ OCR Metadata: per bank/e-wallet
- ✅ Sidebar: menu baru (Logs, OCR Metadata)

## Phase DocOps — Documentation + Admin DB Ops ✅ DONE (2026-04-26)
- ✅ Artefak pending (P0+P1) direfresh sampai status `RAPI`
- ✅ Ditambahkan migration `20260426_admin_logs_ocr_metadata.sql`
- ✅ OCR metadata aggregation dipoles agar `sample_count` akumulatif dan field terdeteksi di-merge

## Phase Donasi — Donation Feature ✅ DONE (2026-04-19)
- ✅ Web: QRIS modal di SharePanel + Header button
- ✅ Telegram: `/donasi` command + QRIS photo via `sendPhoto`
- ✅ `/menu` keyboard: tombol 💝 Donasi + 📷 OCR hint
- ✅ Light theme font fix — 6 komponen warna digelapkan

## Phase 3 — Transaction CRUD + Tier Enforcement 🔲 Planned
- CRUD endpoint: POST/GET/PUT/DELETE /transactions
- Accounts CRUD (multi-akun: cash, bank, e-wallet)
- Free tier enforcement: max 3 akun, history 3 bulan
- Estimasi: 5-7 hari

## Phase 6 — Payment Gateway (Monetisasi) 🔲 Planned
- Midtrans integration untuk upgrade tier
- Estimasi: 3-5 hari

## Phase 7 — Mobile (Post Phase 6) 🔲 Future
- Expo React Native
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
Phase 5 (Admin Console v1) ← SELESAI
     │
Phase Room (Shared Budget) ← SELESAI
     │
Phase AI (Chat + Guardrails) ← SELESAI
     │
Phase OCR (Image Extraction) ← SELESAI
     │
Phase Admin v2 (Overhaul) ← SELESAI
     │
Phase DocOps (Docs + DB Ops) ← SELESAI
     │
Phase 3 (Transactions + Tier) ← NEXT
     ├─→ Phase 6 (Payment)
     └─→ Phase 7 (Mobile)
```
