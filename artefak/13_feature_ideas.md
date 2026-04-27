# Feature Ideas and Status Map

> Status: RAPI
> Last updated: 2026-04-26 (rev 2)

Tujuan dokumen ini: memisahkan fitur yang sudah live dari ide yang masih backlog.

## Already Implemented

### Core Product

- SmartInput transaksi (manual parse nominal + kategori)
- Dashboard KPI dan chart utama
- Upload CSV/XLSX + pipeline analisis
- Export CSV

### AI and OCR

- AI chat endpoint (`/ai/chat`)
- AI insight endpoint (`/ai/insight`)
- AI categorization endpoint (`/ai/categorize`)
- OCR endpoint (`/ai/ocr`) + metadata capture per bank

### Collaboration and Growth

- Shared budget room (create/join/sync/shared budget)
- Affiliate products CRUD + broken-link reports
- Telegram bot command suite (catat/ringkasan/laporan/budget/belanja)

### UI Redesign

- Global visual mode (`ringkas`/`showtime`)
- Dashboard + transaksi + laporan + budget redesign rollout
- Mobile parity improvement untuk mode switch + nav active state

## In Progress

1. Tier enforcement backend (free limits belum fully enforced).
2. OCR quality tuning (akurasi extraction masih iterative).
3. Admin operational logging standardization (`system_logs` adoption).

## Prioritized Backlog (Next)

| Priority | Feature | Why |
|---|---|---|
| P0 | Tier enforcement (history cap, quota) | Dampak langsung ke model bisnis |
| P0 | Payment integration (Midtrans) | Syarat monetisasi |
| P0 | PDF export monthly report | Fitur pro yang paling diminta |
| P1 | Smart search transaksi | UX harian, low risk |
| P1 | Recurring transaction flow | Akurasi tracking bulanan |
| P1 | Category budget alerts >80% | Engagement + retention |
| P2 | Persona/coach deep AI | Nilai tambah AI tier |
| P2 | Mobile app (Expo) | Ekspansi channel |

## Parking Lot

1. Open banking direct sync (kompleks compliance).
2. Multi-currency accounting (scope besar untuk fase awal).
3. Investment brokerage integrations (regulatory heavy).
