# System Architecture — OprexDuit

> Last updated: 2026-04-19 (rev 4)

## Current Stack (Deployed)

| Layer | Teknologi | Platform |
|---|---|---|
| Frontend | Next.js 16 + Tailwind CSS | Vercel |
| Backend | FastAPI (Python) | Render.com (free) |
| Database / Auth | Supabase (PostgreSQL) | Supabase Cloud |
| AI Provider | GLM-4.7 (chat) + GLM-4V (vision/OCR) | api.z.ai (Anthropic-compatible) |
| Admin Console | Next.js 14 + TypeScript + Tailwind | Vercel (repo terpisah) |

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                    USER BROWSER                      │
└────────────────────┬────────────────────────────────┘
                     │ HTTPS
┌────────────────────▼────────────────────────────────┐
│        FRONTEND — Next.js 16 (Vercel)                │
│  utils/supabase/client.ts  →  Supabase Auth          │
│  FloatingAIChat.tsx        →  AI Chat (+ auth token) │
│  SmartInput.tsx            →  Quick entry + OCR      │
└────────┬──────────────────────────┬─────────────────┘
         │ Authorization: Bearer JWT │ Direct DB queries
         │ REST API                  │
┌────────▼──────────────────────────▼─────────────────┐
│        BACKEND — FastAPI (Render.com)                │
│  app/auth.py          → verify JWT (python-jose)     │
│  app/ai_service.py    → GLM chat + OCR vision        │
│  app/telegram_bot.py  → Telegram webhook handler     │
│  POST /ai/chat        → AI chat (+ user data context)│
│  POST /ai/ocr         → Image OCR → transactions     │
│  GET  /admin/stats    → Admin dashboard metrics      │
│  GET  /admin/logs     → System log explorer          │
│  GET  /admin/ocr-metadata → Bank OCR metadata        │
└────────────────────┬────────────────────────────────┘
                     │ supabase-py (service role)
┌────────────────────▼────────────────────────────────┐
│        SUPABASE (PostgreSQL + Auth)                  │
│  auth.users │ transactions │ profiles │ budgets      │
│  rooms │ room_members │ ai_api_keys │ system_logs    │
│  bank_ocr_metadata │ affiliate_products │ link_reports│
│  Row Level Security (RLS) enforced per user          │
└─────────────────────────────────────────────────────┘
```

## AI Integration

```
┌──────────────────────────┐
│  AI Provider: GLM (z.ai) │
│  ├── glm-4.7 (chat)     │  ← /ai/chat endpoint
│  └── glm-4v-flash (OCR) │  ← /ai/ocr + Telegram photo
│                          │
│  Fallback providers:     │
│  ├── deepseek-chat       │
│  └── gemini-2.0-flash    │
│                          │
│  Key Management:         │
│  └── ai_api_keys table   │  ← Admin Console CRUD
└──────────────────────────┘

Guardrails:
- System prompt melarang bocorkan info backend
- AI hanya bisa jawab topik keuangan
- User data di-inject dari DB (30 tx terakhir)
- API keys dirotasi otomatis (round-robin + rate limit)
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
| `ALLOWED_ORIGINS` | Vercel URL |
| `TELEGRAM_BOT_TOKEN` | @BotFather |
| `ADMIN_SECRET` | Custom admin auth token |
| `GLM_API_KEY` ~ `GLM_API_KEY_5` | api.z.ai dashboard |
| `QRIS_IMAGE_URL` | URL QRIS gambar (default: vercel deployment) |

## Deployment Topology

```
GitHub (conoday/finance-analyzer, branch: main)
    ├──→ Vercel (auto-deploy) → finance-analyzer-roan.vercel.app
    └──→ Render (auto-deploy) → oprexduit.onrender.com

GitHub (conoday/oprex-admin-console, branch: main)
    └──→ Vercel (auto-deploy) → admin console

Supabase → managed separately (no deploy from repo)
```

## Free Tier Limits

| Service | Limit | Mitigation |
|---|---|---|
| Render (free) | Sleep 15 min idle, 512 MB RAM | UptimeRobot ping |
| Vercel (free) | 100 GB bandwidth/bulan | Static compression |
| Supabase (free) | 500 MB DB, 5 GB storage | Data pruning |
| GLM API (free) | Rate limit per key | Multi-key rotation |

## Future Additions

| Komponen | Kapan | Alasan |
|---|---|---|
| Redis | Post Phase 4 | Cache frequent queries |
| Background Queue | Phase 3 | Async OCR processing |
| CDN | Phase 3 | Screenshot storage via Supabase Storage / R2 |
| WhatsApp Bot | Phase Omnichannel | Catat via WA |
| Mobile App | Phase 7 | React Native / Expo |
