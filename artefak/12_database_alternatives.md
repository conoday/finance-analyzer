# Database Alternatives — Saat Skala Besar

Masalah utama ketika ramai adalah **storage** (data transaksi + file gambar OCR).
Berikut perbandingan dari yang paling murah:

## Fase 1 — Awal (< 1.000 user aktif): Supabase Free

- PostgreSQL 500 MB, 5 GB file storage
- Gratis, tidak butuh kartu kredit
- Batasan: DB pause setelah 1 minggu idle

**Aksi:** Gunakan ini dulu.

---

## Fase 2 — Tumbuh (1.000–10.000 user): Pilih Salah Satu

### Opsi A: Supabase Pro — $25/bulan
- 8 GB DB, 100 GB file storage
- Tidak ada auto-pause
- Branching, PITR backup
- **Rekomendasi jika sudah pakai Supabase** — paling mulus migrasinya

### Opsi B: Neon (PostgreSQL Serverless) — dari $0
- Free: 512 MB, 1 compute unit
- Launch: $19/bulan → 10 GB storage, autoscaling compute
- **Kelebihan:** Scale to zero (bayar per compute, hemat jika traffic tidak merata)
- **Cocok untuk:** Traffic spike tidak menentu

### Opsi C: PlanetScale (MySQL) — dari $0
- Free: 5 GB storage (Hobby plan dihapus → sekarang mulai $39/bulan)
- **Tidak recommended lagi** — harga naik drastis 2024

### Opsi D: Railway.app — dari $5/bulan
- PostgreSQL + storage terintegrasi
- Bayar berdasarkan usage (CPU + RAM + storage)
- Predictable pricing untuk small-medium app
- **Kelebihan:** Bisa host backend FastAPI dan DB di 1 tempat

### Opsi E: Fly.io Postgres — dari $0 (pay-as-you-go)
- Free allowance: 3 GB storage
- $0.15/GB/bulan setelahnya
- Self-managed postgres (butuh lebih banyak setup)

---

## Fase 3 — Skala Besar (10.000+ user): Cloud Native

### AWS RDS PostgreSQL
- db.t4g.micro: ~$15/bulan + storage $0.115/GB/bulan
- Paling reliable, full managed, bisa autoscaling

### Google Cloud SQL
- Mirip RDS, ~$10–20/bulan untuk instance kecil
- Cocok jika pakai Google Cloud ecosystem

### Supabase Business — $599/bulan
- Untuk enterprise, SLA 99.9%, dedicated support

---

## File Storage (Gambar OCR)

Masalah: menyimpan screenshot transaksi user membutuhkan object storage.

| Provider | Harga | Gratis |
|---|---|---|
| Supabase Storage | $0.021/GB/bulan | 5 GB gratis |
| Cloudflare R2 | $0.015/GB/bulan | 10 GB gratis |
| Backblaze B2 | $0.006/GB/bulan | 10 GB gratis |
| AWS S3 | $0.023/GB/bulan | 5 GB (12 bulan) |

**Rekomendasi:** Cloudflare R2 — termurah, tidak ada egress fee, S3-compatible API.

---

## Rekomendasi Jalur Migrasi

```
Phase 1 (0-1K user)
Supabase Free (PostgreSQL) + Supabase Storage
    ↓ (saat mendekati 500 MB atau traffic tinggi)

Phase 2 (1K-10K user)
Supabase Pro $25/bln + Cloudflare R2 (file storage)
    ↓ (saat kebutuhan lebih tinggi)

Phase 3 (10K+ user)
AWS RDS PostgreSQL + S3 / Cloudflare R2
```

## Estimasi Biaya per User

| Jumlah User Aktif | DB | Storage | Total/bulan |
|---|---|---|---|
| 0–1.000 | Gratis | Gratis | $0 |
| 1.000–5.000 | $25 (Supabase Pro) | ~$2 (R2) | ~$27 |
| 5.000–20.000 | $25 (Supabase Pro) | ~$10 (R2) | ~$35 |
| 20.000+ | ~$50 (RDS t4g.small) | ~$25 (R2/S3) | ~$75 |

**Catatan:** dengan Pro tier Rp 29K = ~$1.7, break-even di sekitar 20 subscriber Pro sudah cover biaya DB.
