# Product Overview — Finance Analyzer

## Objective

Membangun aplikasi pencatatan keuangan berbasis web yang:

- Mendukung pencatatan transaksi (manual & dari gambar/file)
- Mendukung multi akun (bank, e-wallet)
- Memiliki sistem autentikasi user
- Model bisnis **Freemium** — fitur dasar gratis, fitur premium berbayar
- Scalable untuk pengembangan ke depan

## Target User

| Segmen | Deskripsi |
|---|---|
| Individu | Mahasiswa / rumah tangga yang ingin tracking pengeluaran harian |
| Freelancer | Butuh pemisahan income stream & expense per project |
| Karyawan | Ingin ringkasan bulanan otomatis dari mutasi rekening |

## Tier System

| Tier | Harga | Target |
|---|---|---|
| Free | Rp 0 / bulan | User casual, coba-coba |
| Pro | Rp 29.000 / bulan | Freelancer, karyawan aktif |
| Business | Rp 99.000 / bulan | Tim kecil / UKM |

## Core Features

1. **Authentication** — Login via Google OAuth, session management
2. **Transaction Tracking** — Pencatatan pemasukan & pengeluaran
3. **File-Based Import** — Upload CSV/XLSX dari mutasi rekening (dibatasi di Free)
4. **Image-Based Extraction** — Upload screenshot mutasi → di-parse otomatis
5. **Financial Summary** — Ringkasan harian, mingguan, bulanan
6. **Admin Console** — Monitoring user & transaksi (internal)

## Non-Goals (Fase Awal)

- Tidak ada fitur pembayaran / transfer uang antar user
- Tidak ada integrasi langsung ke API bank (open banking)
- Tidak ada versi mobile native (bisa PWA nanti)
- Tidak ada AI/ML berat — semua rule-based

## Success Metrics

| Metrik | Target |
|---|---|
| User bisa login & tracking transaksi | Phase 2 selesai |
| Upload file CSV dibatasi per tier | Phase 2 selesai |
| Upload screenshot → data terisi otomatis | Phase 3 selesai |
| Pembayaran Pro tier berjalan | Phase 4 selesai |
| Admin bisa monitoring semua user | Phase 5 selesai |
