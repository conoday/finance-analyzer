# System Architecture — OprexDuit

## Current Stack (Deployed)

| Layer | Teknologi | Platform |
|---|---|---|
| Frontend | Next.js 16 + Tailwind CSS | Vercel |
| Backend | FastAPI (Python) | Render.com (free) |
| Database / Auth | Supabase (PostgreSQL) | Supabase Cloud |
| Storage | In-memory per session (Phase 1) + Supabase DB (Phase 2) | — |

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                    USER BROWSER                      │
└────────────────────┬────────────────────────────────┘
                     │ HTTPS
┌────────────────────▼────────────────────────────────┐
│        FRONTEND — Next.js 16 (Vercel)                │
│  utils/supabase/client.ts  →  Supabase Auth          │
│  utils/supabase/server.ts  →  Server Components      │
│  src/proxy.ts              →  Session refresh        │
└────────┬──────────────────────────┬─────────────────┘
         │ Authorization: Bearer JWT │ Direct DB queries
         │ REST API                  │ (future: Supabase JS)
┌────────▼──────────────────────────▼─────────────────┐
│        BACKEND — FastAPI (Render.com)                │
│  app/auth.py        → verify JWT (python-jose)       │
│  app/supabase_client.py → admin client (service role)│
│  GET /me            → auth test endpoint             │
│  POST /analyze      → file upload + pipeline         │
│  POST /simulate     → budget simulator               │
└────────────────────┬────────────────────────────────┘
                     │ supabase-py (service role)
┌────────────────────▼────────────────────────────────┐
│        SUPABASE (PostgreSQL + Auth)                  │
│  auth.users │ transactions │ accounts │ profiles     │
│  Row Level Security (RLS) enforced per user          │
└─────────────────────────────────────────────────────┘
```

## Auth Flow

```
1. User login di frontend (Supabase Auth — Google / Email)
2. Supabase returns access_token (JWT signed with SUPABASE_JWT_SECRET)
3. Frontend stores session via proxy.ts cookie refresh
4. Protected API calls: Authorization: Bearer <access_token>
5. FastAPI app/auth.py verifies JWT locally (no round-trip to Supabase)
6. Payload contains: sub (user UUID), email, role
```

## Environment Variables

### Frontend (Vercel)
| Key | Source |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Settings → API |
| `NEXT_PUBLIC_API_URL` | Render service URL |

### Backend (Render)
| Key | Source |
|---|---|
| `SUPABASE_URL` | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API (secret!) |
| `SUPABASE_JWT_SECRET` | Supabase → Settings → API → JWT Secret |
| `ALLOWED_ORIGINS` | Vercel URL (e.g. `https://finance-analyzer-roan.vercel.app`) |

## Deployment Topology

```
GitHub (conoday/finance-analyzer, branch: main)
    ├──→ Vercel (auto-deploy) → finance-analyzer-roan.vercel.app
    └──→ Render (auto-deploy) → finance-analyzer-a82j.onrender.com

Supabase → managed separately (no deploy from repo)
```

## Free Tier Limits

| Service | Limit | Mitigation |
|---|---|---|
| Render (free) | Sleep 15 min idle, 512 MB RAM | UptimeRobot ping |
| Vercel (free) | 100 GB bandwidth/bulan | Static compression |
| Supabase (free) | 500 MB DB, 5 GB storage | Data pruning |

## Future Additions

| Komponen | Kapan | Alasan |
|---|---|---|
| Redis | Post Phase 4 | Cache frequent queries |
| Background Queue | Phase 3 | Async OCR processing |
| CDN | Phase 3 | Screenshot storage via Supabase Storage / R2 |
| Rate Limiting | Phase 2 | Protect Render free tier |
