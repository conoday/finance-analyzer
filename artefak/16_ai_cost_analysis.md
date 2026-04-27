# AI Cost Analysis and Provider Strategy

> Status: RAPI
> Last updated: 2026-04-26 (rev 4)

## Current AI Architecture (Implemented)

Backend AI service (`app/ai_service.py`) saat ini mendukung provider:

- `glm`
- `deepseek`
- `gemini`

Key management:

1. Primary source: Supabase table `ai_api_keys` (managed dari admin console).
2. Fallback source: environment variables.
3. Auto-rotation: key yang rate-limited ditandai dan di-skip.
4. Cache key list: 5 menit untuk mengurangi query berulang.

## Endpoints Yang Menggunakan AI

- `POST /ai/chat`
- `POST /ai/insight`
- `POST /ai/categorize`
- `POST /ai/ocr`

## Cost Model (Praktis)

Biaya AI mengikuti formula:

- `monthly_cost = (input_tokens / 1_000_000 * input_price) + (output_tokens / 1_000_000 * output_price)`

Agar tetap akurat, harga provider harus dicek berkala di dashboard resmi masing-masing provider.

## Recommended Routing by Workload

1. Low-latency simple classification
   - gunakan model murah/cepat (`deepseek` atau `gemini` low tier)
2. Rich reasoning or fallback stability
   - gunakan `glm` sesuai konfigurasi environment
3. OCR post-processing
   - pilih provider yang paling stabil untuk JSON output

## Operational Guardrails

1. Selalu aktifkan retry/fallback antar key provider (sudah berjalan di service).
2. Simpan error/rate-limit log untuk audit (sudah tersedia via in-memory AI logs).
3. Tambahkan budget alarm operasional jika total usage bulanan melewati batas.
4. Untuk fitur berbiaya tinggi, pasang quota berbasis tier user sebelum scale up.

## Gap and Next Actions

1. Belum ada cost telemetry per request yang persisten ke database.
2. Belum ada dashboard biaya AI bulanan yang terstandar.
3. Tier-based AI quota belum enforced penuh di endpoint.

## Suggested Implementation Steps

1. Tambah logging token estimate + provider ke `system_logs.details`.
2. Buat rekap harian biaya AI di tabel agregat (opsional: cron job).
3. Enforce limit AI calls untuk free tier sebelum melanjutkan monetisasi.
