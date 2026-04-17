# Prompt for Agent Planner

> Last updated: 2026-04-17

## Konteks Penting untuk Agent

1. Stack: Next.js 14 App Router (bukan Pages Router)
2. Auth: Supabase Auth (JWT), bukan NextAuth
3. Backend: FastAPI async Python 3.11
4. Python venv: c:\Users\lenovo\Documents\rafif\.venv
5. Render auto-deploy dari branch main di repo conoday/finance-analyzer
6. Model bisnis: Freemium — Free | Pro (Rp 29K/bln) | AI (Rp 59K/bln) | Business (Rp 149K/bln)
7. Telegram bot ada di `app/telegram_bot.py` — webhook handler, inline keyboard
8. Admin console di repo terpisah: `conoday/oprex-admin-console`

## Live URLs

- Frontend: https://finance-analyzer-roan.vercel.app
- Backend: https://oprexduit.onrender.com
- Admin console: github.com/conoday/oprex-admin-console

## Master Prompt

```
You are a senior system architect and product planner.

Context:
I am building a personal finance web app called OprexDuit with:
- Frontend: Next.js 14 (Vercel) at https://finance-analyzer-roan.vercel.app
- Backend: FastAPI (Render) at https://oprexduit.onrender.com
- Database: PostgreSQL on Supabase (free tier)
- Telegram Bot: webhook handler in app/telegram_bot.py, inline keyboard
- Admin Console: separate repo conoday/oprex-admin-console (Next.js 14, Tailwind)
- Business model: Freemium (Free / Pro Rp29K / AI Rp59K / Business Rp149K)

Current Features (already implemented):
- CSV/XLSX upload → financial pipeline (categorizer, forecasting, health score, simulator)
- Auth: Supabase login/register/OTP/Google OAuth + JWT backend guard (require_auth)
- Transaction tracking: SmartInput NLP parse + QuickTracker dashboard
- Telegram Bot: /catat /ringkasan /laporan /budget /belanja + inline keyboard
- Affiliate system: CRUD products + link_reports table + ReportLinkButton
- Admin Console: affiliate CRUD + broken link reports + settings page

Supabase Tables: profiles, transactions, budgets, affiliate_products, link_reports, pending_telegram_links, import_batches

Architecture docs in /artefak/ folder (01 to 17). Read 17_master_tracking.md first.

Next phases:
1. Phase 3: Transaction CRUD + Tier enforcement (max 3 akun, 3 bulan history untuk Free)
2. Phase AI: LLM insight + financial persona detection
3. Phase 4: OCR struk (Pro tier)
4. Phase 6: Payment Gateway (Midtrans)
5. Phase 7: Mobile (Expo)

Constraints:
- Free-tier infra (Vercel + Render + Supabase)
- No overengineering, keep it simple but extensible
- Auth via Supabase JWT (bukan NextAuth)

For each phase, provide:
1. Files to create/modify (full paths)
2. Complete code per file
3. Env vars to add (which platform)
4. SQL migrations to run on Supabase
5. Test steps / curl examples
6. Free-tier gotchas

Start with: [Phase X]
```

## Tips

- Ganti kalimat terakhir: `Start with Phase 3 (Transaction CRUD)`
- Fokus 1 file: tambahkan `Focus only on file: api/main.py`
- Debug: paste error message + `What is wrong and how do I fix it?`
- Telegram bot context: tambahkan `Focus on app/telegram_bot.py`
