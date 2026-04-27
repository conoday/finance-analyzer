# Authentication Design

> Status: RAPI
> Last updated: 2026-04-26 (rev 4)

## Stack

- Frontend auth client: Supabase (`@supabase/ssr`, `@supabase/supabase-js`)
- Frontend route session refresh: `src/proxy.ts` + `src/utils/supabase/middleware.ts`
- Backend token verification: FastAPI dependency di `app/auth.py`
- Protected backend endpoint contoh: `GET /me`

## Current Flow

```text
User login/register (Supabase Auth)
  -> redirect/confirm via /auth/callback
  -> session cookie dikelola Supabase client
  -> frontend request API dengan Authorization: Bearer <access_token>
  -> backend verify JWT di require_auth
  -> endpoint proses request user
```

## Frontend Files (Auth)

- `frontend/src/app/auth/login/page.tsx`
- `frontend/src/app/auth/register/page.tsx`
- `frontend/src/app/auth/verify/page.tsx`
- `frontend/src/app/auth/callback/route.ts`
- `frontend/src/hooks/useAuth.ts`
- `frontend/src/utils/supabase/client.ts`
- `frontend/src/utils/supabase/server.ts`
- `frontend/src/utils/supabase/middleware.ts`
- `frontend/src/proxy.ts`

## Backend Files (Auth)

- `app/auth.py`
- `app/supabase_client.py`
- `api/main.py` (`/me` and protected endpoints)

## Security Posture (Current)

1. JWT diverifikasi di backend sebelum akses endpoint protected.
2. Supabase session refresh dijaga via server-side helper (`updateSession`).
3. Admin access dapat memakai `ADMIN_SECRET` untuk endpoint admin tertentu.
4. RLS diterapkan pada tabel inti yang berhubungan langsung dengan data user.

## Known Gaps

1. Authorization matrix endpoint belum sepenuhnya formal per role/tier.
2. Tier-based authorization belum menjadi policy backend yang konsisten.
3. Dokumentasi rotasi secret dan incident response belum dibakukan.

## Required Environment Variables

### Frontend (Vercel)

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_API_URL` (production: `https://oprexduit.onrender.com`)

### Backend (Render)

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`
- `ALLOWED_ORIGINS`
- `ADMIN_SECRET` (opsional untuk admin console)

## Verification Checklist

- [ ] Login berhasil dan session persist setelah refresh
- [ ] Callback auth redirect ke route target tanpa error
- [ ] Endpoint `/me` reject token invalid/expired
- [ ] Endpoint protected berhasil dengan token valid
