# Prompt for Agent Planner

## Konteks Penting untuk Agent

1. Stack: Next.js 16 App Router (bukan Pages Router)
2. NextAuth: v5 (bukan v4 — API berbeda)
3. SQLAlchemy: 2.x async
4. FastAPI: gunakan async def untuk semua endpoint
5. Python venv: c:\Users\lenovo\Documents\rafif\.venv
6. Render auto-deploy dari branch main di repo conoday/finance-analyzer
7. Model bisnis: Freemium — Free (manual only, 5 file/bulan) | Pro (Rp 29K/bln) | Business (Rp 99K/bln)

## Master Prompt

```
You are a senior system architect and product planner.

Context:
I am building a personal finance web app with:
- Frontend: Next.js 16 (Vercel) at https://finance-analyzer-roan.vercel.app
- Backend: FastAPI (Render) at https://finance-analyzer-a82j.onrender.com
- Database: PostgreSQL on Supabase (free tier)
- Business model: Freemium (Free / Pro / Business)

Current Features (already implemented):
- CSV/XLSX upload → financial pipeline (categorizer, forecasting, health score, simulator)
- 4 API endpoints: /health, /analyze/sample, /analyze (POST), /simulate
- Frontend dashboard with 5 tabs
- No auth, no database, no persistence, no payment yet

Architecture docs in /artefak/ folder (01 to 10).

Next phases:
1. Phase 2: Auth — NextAuth.js v5 + Google + user table with tier column
2. Phase 3: Transactions + Tier enforcement (5 file/bulan untuk Free)
3. Phase 4: OCR image extraction (Pro tier only)
4. Phase 5: Admin Console
5. Phase 6: Payment Gateway (Midtrans)

Constraints:
- Free-tier infra (Vercel + Render + Supabase)
- No overengineering, keep it simple but extensible
- No heavy AI/ML
- Rule-based OCR only

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
