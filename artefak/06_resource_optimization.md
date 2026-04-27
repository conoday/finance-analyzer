# Resource Optimization

> Status: RAPI
> Last updated: 2026-04-26 (rev 2)

## Runtime Constraints (Current)

| Layer | Constraint | Impact |
|---|---|---|
| Render free | service sleep saat idle, resource terbatas | first-hit latency dan cold start |
| Vercel free | bandwidth + function limits | perlu jaga bundle size dan request volume |
| Supabase free | DB/storage caps | query dan payload harus efisien |

## Baseline Optimization Yang Sudah Ada

1. Frontend dibangun dengan Next.js 16 + route split per halaman (`/`, `/transaksi`, `/laporan`, `/budget`, dll).
2. Backend FastAPI memakai endpoint yang cenderung ringan untuk fetch list (limit/order sudah ada di endpoint admin/affiliate).
3. AI key rotation + cache 5 menit di `app/ai_service.py` mencegah hit berulang ke tabel `ai_api_keys`.
4. Analisis utama di `api/main.py` menggunakan pandas in-memory; fallback error handling sudah disiapkan agar response tetap aman.

## High-Impact Actions (Disarankan)

### A. Query & Payload Efficiency

1. Tambahkan pagination konsisten untuk endpoint list yang berpotensi besar (`/admin/transactions`, `/affiliate/reports`, `/analyze/me` jika transaksi > N).
2. Hindari select kolom berlebihan; gunakan `select("colA,colB")` spesifik di query Supabase.
3. Untuk agregasi dashboard berat, dorong perhitungan ke SQL view/materialized table jika pola sudah stabil.

### B. AI/OCR Cost & Latency Guard

1. Pertahankan routing provider by purpose:
   - low-cost tasks -> `deepseek`/`gemini`
   - fallback/resilience -> `glm`
2. Simpan metrik request AI ringkas (provider, token estimate, latency) ke `system_logs.details` bila perlu audit biaya.
3. Batasi ukuran file OCR (sudah ada limit 10MB) dan pertimbangkan resize server-side untuk gambar besar.

### C. Render Cold Start Mitigation

1. Health-check terjadwal (`/health`) tetap direkomendasikan untuk mengurangi cold start.
2. Frontend bisa trigger warm-up ringan setelah app init, dengan timeout dan tanpa blok UI.

## Database-Specific Notes (Supabase)

1. Pastikan semua tabel exposed memiliki strategi RLS yang jelas (allow-by-policy atau deny-by-default untuk admin-only table).
2. Buat index sesuai pola query aktual, terutama kombinasi kolom filter + sort (`level+timestamp`, `source+timestamp`, `user_id+date`).
3. Audit table growth berkala pada `system_logs` dan `bank_ocr_metadata`; siapkan retention policy jika volume meningkat.

## Monitoring Checklist

- [ ] Pantau p95 latency endpoint utama: `/analyze/me`, `/ai/chat`, `/ai/ocr`
- [ ] Pantau error rate provider AI dari admin AI logs
- [ ] Pantau growth `system_logs` dan tetapkan retention
- [ ] Pantau growth transaksi per user untuk antisipasi query lambat
- [ ] Pantau biaya/budget provider AI bulanan

## Definition of Done (Optimization Cycle)

- [ ] Endpoint paling sering dipakai punya metric latency dasar
- [ ] Query paling mahal sudah punya index pendukung
- [ ] Tidak ada endpoint list besar tanpa pagination/limit
- [ ] Biaya AI bisa dijelaskan per provider dengan data aktual
