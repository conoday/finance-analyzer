# Mobile Apps Plan (Android and iOS)

> Status: RAPI (Planning)
> Last updated: 2026-04-26 (rev 2)

## Product Context

Web app OprexDuit sudah stabil di Next.js 16 dengan backend FastAPI + Supabase. Mobile app direncanakan sebagai channel tambahan, bukan pengganti web.

## Recommended Stack

- Expo (React Native) + TypeScript
- Expo Router untuk struktur route
- Shared API contract dengan backend yang sama

Alasan utama: reuse skill React/TS, development velocity cepat, dan distribusi lintas platform lebih hemat.

## Proposed Folder

```text
finance-analyzer/
  mobile/
    app/
    components/
    hooks/
    services/
    store/
```

## MVP Scope for Mobile

1. Auth basic (login + session restore).
2. Dashboard ringkas (summary + KPI utama).
3. Daftar transaksi + tambah transaksi manual.
4. Budget summary minimal.
5. Link out ke fitur kompleks yang belum mobile-native.

## Not in MVP

1. Full admin console.
2. Full parity semua chart interaktif desktop.
3. Full room management advanced.

## API and Auth Strategy

1. Tetap pakai backend `https://oprexduit.onrender.com`.
2. Supabase auth token dikirim sebagai Bearer token ke endpoint protected.
3. Simpan session aman sesuai praktik Expo/Supabase mobile.

## Delivery Phases

### M1 - Foundation

- Init Expo app
- Setup theme tokens + navigation shell
- Integrasi auth and API client

### M2 - Core Finance Flow

- Dashboard basic
- Transactions list + create
- Basic budget indicators

### M3 - Polish and Release Prep

- Crash/error tracking
- Push notifications essentials
- Store assets + metadata

## Release Requirements

### Google Play

- Developer account aktif
- Signed AAB build
- Privacy policy URL

### Apple App Store

- Apple Developer Program aktif
- TestFlight validation
- App privacy disclosure

## Risks

1. Scope creep jika mengejar parity total sejak awal.
2. Performa chart berat di low-end device.
3. Sinkronisasi auth edge-case antar web/mobile.

## Done Criteria (MVP)

- [ ] Login dan session restore stabil
- [ ] User bisa melihat dan menambah transaksi
- [ ] Build Android/iOS lolos internal testing
- [ ] Crash kritis tidak ditemukan pada smoke test
