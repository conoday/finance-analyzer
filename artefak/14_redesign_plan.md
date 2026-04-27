# Redesign Plan and Delivery Log

> Status: RAPI
> Last updated: 2026-04-26 (rev 2)

Dokumen ini sekarang menjadi histori redesign + backlog UI berikutnya.

## Visual Direction (Current)

1. Dual mode visual: `ringkas` dan `showtime`.
2. Showtime memakai dark-glass ambience, neon accent, motion yang dikontrol reduced-motion guard.
3. Ringkas tetap clean untuk readability harian.
4. Komponen lintas halaman disejajarkan lewat utilitas global (`showtime-surface`, app shell, nav system).

## Delivered Batches

### Batch A: Prototype Visual Mode

- Global mode toggle `ringkas/showtime` dengan persist ke localStorage.
- Motion system ditata ulang agar mode-aware dan reduced-motion friendly.

### Batch B: Oprex Redesign Embed

- Port komponen reusable: `TiltCard`, `NumberTicker`, `Sparkline`, `CustomCursor`.
- App shell dan desktop nav diupgrade ke visual language showtime.
- Dashboard utama dipoles dengan hierarchy baru untuk KPI dan card interaction.

### Batch C: Rollout Phase-2 Pages

- Halaman `transaksi`, `laporan`, `budget` diselaraskan dengan visual language baru.
- `PageHero` jadi showtime-native.
- Ditambahkan layer CSS `showtime-surface` untuk harmonisasi komponen legacy.

### Batch D: Mobile Parity Polish

- Header mobile punya switch `Ringkas/Showtime` sendiri.
- SideNav mobile active-state diperbaiki untuk nested route.

## Remaining UI Backlog (Prioritized)

1. Settings/Auth visual consistency
   - Samakan komponen form state, empty state, dan CTA style di halaman auth/settings.
2. Accessibility polish
   - Audit kontras, focus ring, keyboard flow, dan reduced-motion behavior pada seluruh route.
3. Data-density tuning
   - Rapikan spacing/line-height pada tabel/list panjang di mobile kecil.
4. Animation budget
   - Definisikan batas motion per page agar performa tetap stabil di device menengah.

## Redesign Definition of Done

- [ ] Semua route utama memakai language visual yang konsisten
- [ ] Accessibility pass dasar (focus, contrast, motion)
- [ ] Mobile parity untuk komponen nav, hero, card, form
- [ ] Tidak ada regresi lint/build pada frontend
