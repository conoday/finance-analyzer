# Authentication Design

## Requirements

- Login via Google OAuth (prioritas utama)
- Session management yang aman
- Secure storage user data
- Mudah di-extend ke provider lain (Facebook, GitHub, dll)

## Recommended Solution — NextAuth.js v5

**Kenapa NextAuth.js v5?**
- Built-in support untuk Next.js App Router
- Handle OAuth flow secara otomatis
- JWT session di-manage dari frontend
- Free, open-source

## Authentication Flow

```
User klik "Login with Google"
        ↓
NextAuth.js redirect ke Google OAuth consent
        ↓
Google kirim authorization code ke callback URL
        ↓
NextAuth.js tukar code → ID token
        ↓
Frontend kirim ID token ke Backend (POST /auth/verify)
        ↓
Backend validasi token via Google Public Keys
        ↓
Backend cek user di DB → buat baru jika belum ada
        ↓
Backend return JWT internal (signed dengan AUTH_SECRET)
        ↓
Frontend simpan JWT → pakai di setiap API request
```

## File yang Perlu Dibuat (Frontend)

```
frontend/src/
├── app/api/auth/[...nextauth]/route.ts
├── lib/auth.ts
└── middleware.ts
```

## Storage (PostgreSQL — Supabase)

```sql
CREATE TABLE users (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email      VARCHAR(255) UNIQUE NOT NULL,
    name       VARCHAR(255),
    provider   VARCHAR(50) NOT NULL,
    role       VARCHAR(20) DEFAULT 'user',
    tier       VARCHAR(20) DEFAULT 'free',
    created_at TIMESTAMP DEFAULT NOW()
);
```

## Security Checklist

- [ ] Jangan simpan password manual
- [ ] JWT signed dengan AUTH_SECRET (min 32 karakter)
- [ ] HTTPS wajib (Vercel + Render sudah auto HTTPS)
- [ ] Batasi ALLOWED_ORIGINS ke domain Vercel saja

## Environment Variables

**Frontend (Vercel):**
```
AUTH_SECRET=<random-string-32-chars>
AUTH_GOOGLE_ID=<dari Google Cloud Console>
AUTH_GOOGLE_SECRET=<dari Google Cloud Console>
NEXT_PUBLIC_API_URL=https://finance-analyzer-a82j.onrender.com
```

**Backend (Render):**
```
AUTH_SECRET=<sama dengan frontend>
ALLOWED_ORIGINS=https://finance-analyzer-roan.vercel.app
DATABASE_URL=postgresql+asyncpg://... (dari Supabase)
```
