# Prompt Agent Planner

> Status: RAPI
> Last updated: 2026-04-26 (rev 2)

## Wajib Dibaca Sebelum Planning

1. `artefak/00_checkpoint_ai.md`
2. `artefak/17_master_tracking.md`
3. Dokumen domain spesifik yang relevan (auth, data modeling, roadmap, dll)

## Baseline Konteks Project (Aktual)

- Product: OprexDuit
- Frontend: Next.js 16 App Router + React 19 + Tailwind
- Backend: FastAPI (single service) + Supabase
- Auth: Supabase Auth + JWT verify di backend
- AI layer: multi-provider (`glm`, `deepseek`, `gemini`) dengan key rotation dari tabel `ai_api_keys`
- Telegram bot: aktif (catat, ringkasan, belanja, room, OCR)
- Admin console: repo terpisah `conoday/oprex-admin-console`

## URL Produksi

- Frontend: https://finance-analyzer-roan.vercel.app
- Backend: https://oprexduit.onrender.com

## Catatan Arsitektur Penting

1. Source of truth tracking pekerjaan ada di `artefak/17_master_tracking.md`.
2. `profiles.plan_type` adalah source of truth tier billing user.
3. `rooms.plan_type` adalah plan room (`solo/couple/family/team`), bukan billing subscription.
4. Beberapa fitur admin bergantung pada tabel opsional (`system_logs`, `bank_ocr_metadata`).
5. Jangan ubah scope implementasi tanpa menyatakan dampak ke artefak tracking.

## Master Prompt (Updated)

```text
You are a senior system architect and delivery planner.

Project context:
- Product: OprexDuit
- Frontend: Next.js 16 App Router (Vercel)
- Backend: FastAPI (Render)
- Database/Auth: Supabase (JWT auth)
- Admin console: separate repository (conoday/oprex-admin-console)
- Business model: freemium (free/pro/ai/business)

Current implementation highlights:
- Auth flow complete (login/register/verify/callback)
- Dashboard + transaksi + laporan + budget pages active
- AI endpoints active (/ai/chat, /ai/insight, /ai/categorize, /ai/ocr)
- Telegram bot and shared room flows active
- Affiliate CRUD and report flows active

Constraints:
- Keep solution simple and production-safe
- Prioritize backward compatibility and data safety
- Respect free-tier infra limits
- Reflect all major changes into artifacts (especially 00 and 17)

For each requested phase/task, output:
1. Scope and assumptions
2. File-level change list
3. SQL/migration changes (if any)
4. Verification plan (lint/test/build/manual checks)
5. Rollback or risk mitigation notes
```

## Practical Use

### Start from a specific phase

```text
Start with Phase 3 backlog item P3-1 and P3-4.
```

### Limit planning to one subsystem

```text
Focus only on backend API and SQL migrations.
Do not change frontend in this plan.
```

### Force artifact sync

```text
After implementation steps, include exact artifact files to update.
```
