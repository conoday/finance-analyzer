# Product Overview — OprexDuit

> Last updated: 2026-04-17 (rev 3)

## Objective

Membangun aplikasi pencatatan keuangan yang:

- Mendukung pencatatan transaksi (manual, file, & via Telegram)
- Mendukung multi akun (bank, e-wallet)
- Memiliki sistem autentikasi user
- Memiliki Telegram bot untuk input cepat & belanja rekomendasi
- Model bisnis **Freemium** — fitur dasar gratis, fitur premium berbayar
- Scalable untuk pengembangan ke depan

## Target User

| Segmen | Deskripsi |
|---|---|
| Individu | Mahasiswa / rumah tangga yang ingin tracking pengeluaran harian |
| Freelancer | Butuh pemisahan income stream & expense per project |
| Karyawan | Ingin ringkasan bulanan otomatis dari mutasi rekening |
| Telegram User | Catat transaksi cepat tanpa buka browser |

## Tier System

| Tier | Harga | Target |
|---|---|---|
| Free | Rp 0 / bulan | User casual, coba-coba |
| Pro | Rp 29.000 / bulan | Freelancer, karyawan aktif |
| AI | Rp 59.000 / bulan | User yang butuh insight cerdas |
| Business | Rp 149.000 / bulan | Tim kecil / UKM |

## Core Features

1. **Authentication** — Login via Google OAuth / email, session management
2. **Transaction Tracking** — Pencatatan pemasukan & pengeluaran (web & Telegram)
3. **Telegram Bot** — `/catat`, `/laporan`, `/budget`, `/belanja` dengan inline keyboard
4. **File-Based Import** — Upload CSV/XLSX dari mutasi rekening (dibatasi di Free)
5. **Image-Based Extraction** — Upload screenshot mutasi → di-parse otomatis (Pro)
6. **Affiliate Shopping** — Rekomendasi produk via Telegram, komisi pembelian
7. **Financial Summary** — Ringkasan harian, mingguan, bulanan
8. **Admin Console** — Monitoring produk affiliate & laporan link rusak (repo terpisah)

## Non-Goals (Fase Awal)

- Tidak ada fitur pembayaran / transfer uang antar user
- Tidak ada integrasi langsung ke API bank (open banking)
- Tidak ada versi mobile native (bisa PWA nanti)

## Live URLs

| Komponen | URL |
|---|---|
| Frontend | https://finance-analyzer-roan.vercel.app |
| Backend API | https://oprexduit.onrender.com |
| Admin Console | github.com/conoday/oprex-admin-console |

## Success Metrics

| Metrik | Status |
|---|---|
| User bisa login & tracking transaksi | ✅ Done (Phase 2) |
| Telegram bot catat transaksi & laporan | ✅ Done (Phase Telegram) |
| Affiliate belanja via Telegram | ✅ Done (Phase Affiliate) |
| Admin console kelola produk & laporan | ✅ Done (Phase 5) |
| Upload file CSV dibatasi per tier | 🔲 Phase 3 (enforcement) |
| Upload screenshot → data terisi otomatis | 🔲 Phase 4 (OCR) |
| Pembayaran Pro tier berjalan | 🔲 Phase 6 (Payment) |
