# Product Overview — OprexDuit

> Last updated: 2026-04-20 (rev 5)

## Objective

Membangun aplikasi pencatatan keuangan yang:

- Mendukung pencatatan transaksi (manual, file, OCR foto, & via Telegram)
- Mendukung multi akun (bank, e-wallet)
- Memiliki sistem autentikasi user
- Memiliki Telegram bot untuk input cepat, OCR foto, & belanja rekomendasi
- Memiliki AI Chat yang bisa akses data transaksi user (guardrails)
- Model bisnis **Freemium** — fitur dasar gratis, donasi sukarela
- Scalable untuk pengembangan ke depan

## Target User

| Segmen | Deskripsi |
|---|---|
| Individu | Mahasiswa / rumah tangga yang ingin tracking pengeluaran harian |
| Freelancer | Butuh pemisahan income stream & expense per project |
| Karyawan | Ingin ringkasan bulanan otomatis dari mutasi rekening |
| Telegram User | Catat transaksi cepat tanpa buka browser |
| Pasangan / Grup | Shared budget room untuk monitoring pengeluaran bersama |

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
3. **Telegram Bot** — `/catat`, `/laporan`, `/budget`, `/belanja`, `/donasi` dengan inline keyboard
4. **Telegram OCR** — Kirim foto/screenshot transaksi bank → AI parse otomatis
5. **AI Chat** — Chat keuangan dengan akses data transaksi user + guardrails keamanan
6. **File-Based Import** — Upload CSV/XLSX dari mutasi rekening
7. **Web OCR** — Upload foto struk/screenshot → AI parse (endpoint `/ai/ocr`)
8. **Shared Budget Room** — Room pasangan/grup untuk monitoring bersama + notifikasi
9. **Affiliate Shopping** — Rekomendasi produk via Telegram, komisi pembelian
10. **Financial Summary** — Ringkasan harian, mingguan, bulanan
11. **Admin Console** — Dashboard monitoring, transaksi + user info, log explorer, OCR metadata, API keys
12. **Donasi** — QRIS di web + Telegram (`/donasi`) - non-mandatory

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
| Telegram Bot | @OprexDuidbot |

## Success Metrics

| Metrik | Status |
|---|---|
| User bisa login & tracking transaksi | ✅ Done (Phase 2) |
| Telegram bot catat transaksi & laporan | ✅ Done (Phase Telegram) |
| Telegram OCR foto → parse transaksi | ✅ Done (Phase OCR) |
| AI Chat bisa akses data transaksi user | ✅ Done (Phase AI) |
| AI Guardrails — tidak bocor info backend | ✅ Done (Phase AI) |
| Shared Budget Room + notifikasi | ✅ Done (Phase Room) |
| Affiliate belanja via Telegram | ✅ Done (Phase Affiliate) |
| Admin console: dashboard, logs, OCR metadata | ✅ Done (Phase Admin v2) |
| Web OCR upload foto → parse transaksi | ✅ Done (SmartInput 📷 button) |
| Donasi QRIS di web + Telegram | ✅ Done |
| Upload file CSV dibatasi per tier | 🔲 Phase 3 (enforcement) |
| Pembayaran Pro tier berjalan | 🔲 Phase 6 (Payment) |
