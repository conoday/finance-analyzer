# OprexDuit Mobile App 📱

Aplikasi mobile **OprexDuit** dibangun dengan Expo + React Native, terhubung langsung ke Supabase dan backend yang sama dengan Web dashboard.

## Tech Stack
- **Framework:** Expo SDK 54 + React Native
- **Routing:** Expo Router (file-based)
- **Auth:** Supabase Auth
- **Database:** Supabase (shared dengan Web & Telegram bot)
- **Language:** TypeScript

## Struktur Halaman
```
app/
├── index.tsx              ← Redirect ke auth/tabs otomatis
├── _layout.tsx            ← Root layout
├── catat.tsx              ← Modal: Catat transaksi cepat
├── (auth)/
│   └── login.tsx          ← Login / Register
└── (tabs)/
    ├── index.tsx          ← Dashboard (KPI + transaksi terbaru)
    ├── transaksi.tsx      ← Daftar transaksi + filter bulan + hapus
    ├── laporan.tsx        ← Laporan pengeluaran per kategori
    └── profil.tsx         ← Profil, Telegram bot, settings
```

## Setup

### 1. Copy env
```bash
cp .env.example .env
```
Isi `.env` dengan:
```
EXPO_PUBLIC_SUPABASE_URL=https://zhvrtlmmtmrthfhoeltc.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key dari Supabase dashboard>
EXPO_PUBLIC_API_URL=https://finance-analyzer-api.onrender.com
```

> 📝 Cari anon key di: Supabase Dashboard → Settings → API → `anon public`

### 2. Install dependencies
```bash
npm install
```

### 3. Jalankan
```bash
# Di HP Android via Expo Go
npx expo start

# Build APK (butuh Expo account)
npx eas build --platform android --profile preview
```

## Sinkronisasi Data
Semua transaksi yang dicatat di mobile akan **langsung terlihat** di:
- 🌐 Web Dashboard (oprexduit.vercel.app)
- 🤖 Telegram Bot (/riwayat, /ringkasan, /laporan)

Karena data disimpan ke Supabase yang sama! ✅

## Fitur Utama
| Fitur | Status |
|---|---|
| Login/Register | ✅ |
| Dashboard KPI | ✅ |
| Daftar Transaksi + Filter Bulan | ✅ |
| Hapus Transaksi | ✅ |
| Catat Transaksi (incl. kategori) | ✅ |
| Laporan Per Kategori | ✅ |
| Link ke Telegram Bot | ✅ |
| OCR Foto Struk | 🔜 Coming Soon |
| Notifikasi Reminder | 🔜 Coming Soon |
