# Authentication Design

> Status: ✅ **IMPLEMENTED** — Phase 2 complete (commit 14b121c + a66ccfc)
> Last updated: 2026-04-12 (rev 3)

⚠️ **PENTING**: Dokumen ini BUKAN lagi tentang NextAuth.js. Kita sudah pakai **Supabase Auth**.

---

## Implementasi Aktual — Supabase Auth + FastAPI JWT

### Stack Auth
- **Frontend**: Supabase Auth JS SDK (`@supabase/ssr`)
- **Backend**: FastAPI + `python-jose` verify JWT
- **Bukan**: NextAuth.js (deprecated dari planning, sudah diganti)

---

## Authentication Flow (AKTUAL)

```
User klik "Login with Google"
        ↓
Supabase Auth → signInWithOAuth({ provider: 'google' })
        ↓
Redirect ke Google OAuth consent
        ↓
Google redirect ke /auth/callback
        ↓
frontend/src/app/auth/callback/route.ts
        ↓
supabase.auth.exchangeCodeForSession(code)
        ↓
Supabase simpan session (cookie httpOnly via @supabase/ssr)
        ↓
onAuthStateChange() di useAuth.ts trigger
        ↓
User redirect ke dashboard "/"
        ↓
API calls: Authorization: Bearer <supabase_jwt>
        ↓
FastAPI require_auth(Depends) → python-jose verify JWT
        ↓
JWT secret = SUPABASE_JWT_SECRET (dari Supabase dashboard)
```

---

## File Auth yang Sudah Ada

```
frontend/src/
├── utils/supabase/
│   ├── client.ts           ← browser client (localStorage session)
│   ├── server.ts           ← server components (cookie session)
│   └── middleware.ts       ← updateSession() — refresh session per request
├── app/
│   ├── auth/
│   │   ├── login/page.tsx          ← Google OAuth button + light theme
│   │   ├── register/page.tsx       ← T&C UU PDP (5 seksi)
│   │   ├── verify-otp/page.tsx     ← magic link / OTP verify
│   │   └── callback/route.ts       ← exchangeCodeForSession
│   └── ...
├── hooks/
│   ├── useAuth.ts          ← { user, loading, signOut } via onAuthStateChange
│   └── useTransactions.ts  ← localStorage (guest) → Supabase (logged in)
└── middleware.ts            ← route protection
```

```
backend/
├── app/auth.py             ← require_auth Depends, python-jose verify
└── api/main.py             ← GET /me endpoint (test auth)
```

---

## Route Protection (middleware.ts)

```typescript
// Protected routes → redirect to /auth/login if not authenticated
const protectedRoutes = ['/settings', '/profile', '/admin']

// Public routes → always accessible (even guests can use app)
// '/' = dashboard (guest mode dengan localStorage)
```

---

## Supabase Database Schema (Auth-related)

```sql
-- Dibuat di supabase/schema.sql
CREATE TABLE public.profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email       TEXT,
    full_name   TEXT,
    avatar_url  TEXT,
    plan_type   TEXT NOT NULL DEFAULT 'free',  -- 'free' | 'pro' | 'ai' | 'business'
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name',
          new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

---

## FastAPI JWT Verification

```python
# app/auth.py
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
import os

security = HTTPBearer()

def require_auth(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(
            credentials.credentials,
            os.getenv("SUPABASE_JWT_SECRET"),
            algorithms=["HS256"],
            options={"verify_aud": False}
        )
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
```

---

## Environment Variables (AKTUAL)

**Frontend (Vercel):**
```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJ...   ← anon key
NEXT_PUBLIC_API_URL=https://finance-analyzer-a82j.onrender.com
```

**Backend (Render):**
```
SUPABASE_JWT_SECRET=<dari Supabase → Settings → API → JWT Secret>
ALLOWED_ORIGINS=https://finance-analyzer-roan.vercel.app
```

---

## Security Checklist

- [x] Tidak simpan password — semua via OAuth
- [x] HTTPS enforced (Vercel + Render auto HTTPS)
- [x] CORS locked ke domain Vercel (`ALLOWED_ORIGINS` env var)
- [x] JWT verify via HS256 + Supabase secret
- [x] RLS di Supabase — setiap user hanya bisa akses data sendiri
- [x] Middleware env guard — tidak crash kalau Supabase env vars belum di-set
- [ ] Google OAuth Client ID/Secret → perlu di-setup di Google Cloud Console
- [ ] Supabase env vars → perlu di-set di Vercel + Render (user action)

---

## Setup Steps (User Action Required)

1. **Supabase**: Auth → Providers → Google → Enable → paste Client ID + Secret
2. **Supabase**: Auth → URL Config → Site URL: `https://finance-analyzer-roan.vercel.app`
3. **Supabase**: Auth → URL Config → Redirect URL: `https://finance-analyzer-roan.vercel.app/auth/callback`
4. **Vercel**: Add env vars `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
5. **Render**: Add env var `SUPABASE_JWT_SECRET`

---

## Guest Mode

App bisa digunakan tanpa login:
- Data tersimpan di `localStorage` (hilang kalau clear browser)
- Saat login, `useTransactions.ts` auto-migrate localStorage → Supabase cloud
- Free tier masih dapat semua basic features
