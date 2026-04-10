# Mobile Apps Plan — Android & iOS

> Last updated: 2026-04-10
> Status: Planning — belum diimplementasi

---

## Technology Decision

### Pilihan Stack

| Stack | Bahasa | Performance | Code Sharing | Learning Curve | Verdict |
|---|---|---|---|---|---|
| **Expo (React Native)** | TypeScript | ★★★★☆ | ★★★★★ | Rendah (pakai React) | ✅ **Recommended** |
| Flutter | Dart | ★★★★★ | ★★★★☆ | Sedang (belajar Dart baru) | ❌ Terlalu banyak belajar baru |
| Native Android | Kotlin | ★★★★★ | ★☆☆☆☆ | Tinggi | ❌ 2x codebase |
| Native iOS | Swift | ★★★★★ | ★☆☆☆☆ | Tinggi | ❌ 2x codebase |
| Capacitor (Ionic) | TypeScript | ★★★☆☆ | ★★★★☆ | Rendah | ❌ Web-wrapper, feel kurang native |

**Alasan pilih Expo:**
- Kita sudah pakai React + TypeScript di Next.js → komponen bisa di-share
- Expo EAS Build → build cloud, tidak butuh Mac untuk iOS binary
- OTA Updates → update app tanpa submit ulang ke store
- Expo Router → file-based routing (mirip Next.js App Router)
- Community besar, library ekosistem lengkap

---

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐
│   Next.js Web   │     │  Expo Mobile    │
│   (Vercel)      │     │  (iOS/Android)  │
└────────┬────────┘     └────────┬────────┘
         │                       │
         └──────────┬────────────┘
                    │ HTTPS
              ┌─────▼──────┐
              │  FastAPI   │
              │ (Render)   │
              └─────┬──────┘
                    │
              ┌─────▼──────┐
              │  Supabase  │
              │  (DB)      │
              └────────────┘
```

Satu backend untuk semua platform → tidak ada duplikasi logic.

---

## Folder Structure (Expo)

```
finance-analyzer/
├── mobile/                    ← Expo app root
│   ├── app/                   ← Expo Router pages
│   │   ├── _layout.tsx        ← Root layout + auth guard
│   │   ├── (auth)/
│   │   │   └── login.tsx
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx    ← Bottom tab bar
│   │   │   ├── index.tsx      ← Dashboard
│   │   │   ├── transactions.tsx
│   │   │   ├── forecast.tsx
│   │   │   └── settings.tsx
│   │   └── +not-found.tsx
│   ├── components/            ← Shared UI components
│   ├── hooks/                 ← Custom hooks (useAuth, useTransactions)
│   ├── services/              ← API calls (sama seperti web)
│   ├── store/                 ← Zustand state management
│   ├── assets/                ← Images, fonts
│   ├── constants/             ← Colors, layout
│   ├── app.json               ← Expo config (bundle id, permissions)
│   ├── eas.json               ← EAS Build config
│   └── package.json
├── api/                       ← FastAPI (shared)
├── frontend/                  ← Next.js (shared)
└── artefak/
```

---

## Development Phases

### Phase M1 — Setup & Auth (Estimasi: 3 hari)
```
[ ] npx create-expo-app@latest mobile --template tabs
[ ] Setup Expo Router
[ ] Integrasikan API service layer (reuse dari web)
[ ] Implementasi auth flow (Google OAuth via Expo AuthSession)
[ ] Splash screen + app icon
```

### Phase M2 — Core Features (Estimasi: 1-2 minggu)
```
[ ] Dashboard screen (KPI cards + chart)
[ ] Transaction list + filter
[ ] Add transaction form (manual input)
[ ] File upload screen (mutasi PDF → kirim ke API)
[ ] Offline mode dasar (cache last data)
```

### Phase M3 — Polish & Store Prep (Estimasi: 1 minggu)
```
[ ] Animasi & transitions
[ ] Push notifications setup (Expo Notifications)
[ ] Deep linking setup
[ ] App icon final + splash screen final
[ ] Privacy Policy page
[ ] Screenshot generation untuk store
```

---

## App Store (iOS) — Submission Steps

### Persiapan (Sekali seumur hidup akun)

1. **Daftar Apple Developer Program**
   - URL: https://developer.apple.com/programs/enroll/
   - Biaya: **USD 99/tahun** (~Rp 1,6 juta/tahun)
   - Butuh: Apple ID aktif, info pembayaran, waktu verifikasi 1-2 hari

2. **Buat App ID**
   - Di Apple Developer Portal → Identifiers → App IDs
   - Bundle ID: `com.financeanalyzer.app` (harus unik global)

3. **Buat Provisioning Profile & Certificates**
   - Atau biarkan **EAS Build otomatis mengenerate** ini (recommended)
   - `eas credentials` → Expo akan handle certificate management

### Build Process

```bash
# Install EAS CLI
npm install -g eas-cli

# Login ke Expo
eas login

# Init EAS di project
cd mobile
eas build:configure

# Build untuk iOS (tidak butuh Mac — build di cloud Expo)
eas build --platform ios --profile preview   # untuk TestFlight
eas build --platform ios --profile production # untuk App Store
```

### TestFlight (Internal Testing)

1. Build selesai → download `.ipa` dari EAS dashboard
2. Upload ke App Store Connect (via Transporter app atau EAS Submit)
3. Tunggu processing ~30 menit
4. Tambah internal tester (max 100 orang — butuh Apple ID mereka)
5. Tester install via TestFlight app

```bash
# EAS bisa submit langsung ke TestFlight
eas submit --platform ios
```

### App Store Review

1. Di App Store Connect → buat **New Version**
2. Isi metadata:
   - App name, subtitle, description (maks 4000 karakter)
   - Keywords (100 karakter — penting untuk ASO)
   - Screenshots: iPhone 6.9" dan 6.5" (wajib), iPad opsional
   - App icon: 1024x1024 PNG, tidak ada alpha channel
3. **Privacy Information:**
   - Deklarasikan data apa yang dikumpulkan (wajib sejak iOS 14)
   - Butuh URL Privacy Policy yang live
4. **Submit for Review** → Apple review 1-3 hari kerja
5. Jika ditolak → perbaiki issue → resubmit

**Alasan umum penolakan:**
- App crash saat review (pastikan build stabil)
- Privacy policy tidak ada atau tidak bisa diakses
- Metadata tidak accurately mendeskripsikan app
- Login/demo account tidak disediakan untuk reviewer

---

## Play Store (Android) — Submission Steps

### Persiapan (Sekali seumur hidup akun)

1. **Daftar Google Play Developer**
   - URL: https://play.google.com/console/signup
   - Biaya: **USD 25 sekali bayar** (~Rp 400 ribu)
   - Butuh: Google Account, info dev, verifikasi identitas (KTP/Paspor)
   - Catatan: Google Play sekarang wajib verifikasi identitas untuk account baru

2. **Buat App di Play Console**
   - Play Console → Create app
   - Pilih bahasa default, app type, free/paid

### Build Process

```bash
# Build Android AAB (Android App Bundle — wajib untuk Play Store)
eas build --platform android --profile production

# Output: .aab file
```

**Package name:** `com.financeanalyzer.app` (sama dengan iOS, harus konsisten)

### Internal Testing Track

1. Upload AAB di Play Console → Testing → Internal Testing
2. Tambah email tester (maks 100)
3. Share link internal testing → tester klik link → install via Play Store
4. Tidak ada review Google untuk internal testing → langsung bisa test

### Open/Closed Testing → Production

Alur recommended:
```
Internal Testing (max 100)
    ↓ beberapa hari, perbaiki bugs
Closed Testing / Alfa (invited users)
    ↓ 1-2 minggu, pastikan stabil
Open Testing / Beta (siapapun bisa join)
    ↓ 1-2 minggu waktu review
Production
```

**Metadata yang perlu disiapkan:**
- Short description (80 karakter)
- Full description (4000 karakter)
- App icon: 512x512 PNG
- Feature graphic: 1024x500 PNG
- Screenshots: min 2, maks 8 per device type (phone, 7" tablet, 10" tablet)

**Review Google:** ~1-3 hari, lebih ketat untuk app baru.

### `eas.json` Config (iOS + Android)

```json
{
  "cli": { "version": ">= 16.0.0" },
  "build": {
    "preview": {
      "android": { "buildType": "apk" },
      "ios": { "simulator": false }
    },
    "production": {
      "android": { "buildType": "app-bundle" },
      "ios": {}
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your@email.com",
        "ascAppId": "YOUR_APP_STORE_CONNECT_APP_ID",
        "appleTeamId": "YOUR_TEAM_ID"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

---

## Push Notifications Setup

```typescript
// mobile/hooks/usePushNotifications.ts
import * as Notifications from 'expo-notifications';

export async function registerForPushNotifications() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return null;
  const token = await Notifications.getExpoPushTokenAsync();
  return token.data;
  // Simpan token ke backend → kirimkan notif dari FastAPI via Expo Push API
}
```

Use cases:
- "Budget makanan kamu sudah 80% — tersisa Rp 40.000"
- "Ringkasan bulan April sudah siap — kamu hemat Rp 200.000 vs bulan lalu"
- "Ada transaksi Rp 500.000 baru dari saldo kamu"

---

## ASO (App Store Optimization) Tips

| Elemen | Tips |
|---|---|
| App Name | "Finance Analyzer — Catat Keuangan" (sertakan keyword) |
| Keywords | catat keuangan, pengeluaran, tabungan, mutasi rekening, budget, nabung |
| Screenshots | Tampilkan data nyata (bukan placeholder) — user bisa langsung tahu value |
| Ratings | Minta review di in-app setelah user 7 hari aktif (gunakan `expo-store-review`) |
| Lokalisasi | Bahasa Indonesia sebagai primary + English secondary |

---

## Estimasi Biaya Launch

| Item | Biaya |
|---|---|
| Apple Developer Program | USD 99/tahun |
| Google Play Developer | USD 25 (sekali) |
| Expo EAS Build (free tier) | 30 builds/bulan gratis |
| Expo EAS Build (Production) | USD 0 s/d plan Production |
| **Total awal** | **~USD 125** (~Rp 2 juta) |

---

## Notes untuk Agent

Ketika memulai development mobile:
1. Mulai dengan `npx create-expo-app@latest mobile` di root `finance-analyzer/`
2. Copy service layer dari `frontend/src/services` → `mobile/services` (sesuaikan fetch URL)
3. Backend API tidak perlu diubah — hanya tambah `Authorization: Bearer` header untuk auth
4. Untuk icon, gunakan ukuran 1024x1024 sebagai master, biarkan EAS generate semua ukuran lainnya
