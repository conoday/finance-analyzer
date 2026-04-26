# Artefak Checkpoint for AI

> Last updated: 2026-04-26 (rev 5)
> Tujuan: jadi gerbang kualitas dokumentasi sebelum lanjut implementasi fitur.

## Mandatory Reading Order

1. `00_checkpoint_ai.md` (file ini)
2. `17_master_tracking.md` (source of truth status implementasi)
3. `07_roadmap.md` (fase dan urutan kerja)
4. Dokumen spesifik sesuai task (contoh: auth -> `02_authentication_design.md`)

## Rules Before Continuing Any New Feature

1. Jika masih ada status `PERLU UPDATE BESAR`, prioritas utama adalah rapihkan dokumentasi dulu.
2. Implementasi fitur baru boleh lanjut hanya jika:
   - semua dokumen minimal `RAPI` atau `PERLU UPDATE RINGAN`, dan
   - tidak ada kontradiksi terhadap `17_master_tracking.md`.
3. Setiap update dokumen wajib:
   - update `Last updated` + `rev`,
   - sinkronkan URL produksi, stack, dan status fase,
   - update status di tabel checkpoint ini.

## Status Definition

- `RAPI`: konsisten dengan kondisi project saat ini, struktur jelas, tidak ada kontradiksi penting.
- `PERLU UPDATE RINGAN`: mayoritas benar, ada mismatch minor (URL, path, versi, detail fase).
- `PERLU UPDATE BESAR`: informasi inti sudah tidak sinkron atau bertabrakan dengan source of truth.

## Baseline Project Facts (wajib konsisten)

- Product name: OprexDuit
- Frontend: https://finance-analyzer-roan.vercel.app
- Backend: https://oprexduit.onrender.com
- Frontend stack: Next.js 16 + Tailwind
- Auth: Supabase Auth + JWT guard FastAPI
- Implemented: Telegram bot, Affiliate, Admin Console, AI Chat, OCR pipeline
- Latest implementation batch: rollout lanjutan Oprex Redesign ke halaman Transaksi, Laporan, dan Budget (kontrol/filter, KPI strip, hero visual, showtime surface consistency)

## Status Matrix (01-17)

| File | Status | Catatan | Next Action |
|---|---|---|---|
| `01_product_overview.md` | RAPI | Sudah mencerminkan fitur utama terbaru | Maintain |
| `02_authentication_design.md` | PERLU UPDATE RINGAN | Ada URL backend lama dan detail path auth lama | Sinkronkan URL/path dan setup notes |
| `03_architecture.md` | RAPI | Arsitektur terbaru sudah tergambar | Maintain |
| `04_financial_feature_design.md` | RAPI | Core flow + OCR/AI/room sudah masuk | Maintain |
| `05_data_modeling.md` | PERLU UPDATE BESAR | Ada mismatch signifikan dengan schema SQL aktual | Selaraskan definisi tabel dengan schema/migrations terbaru |
| `06_resource_optimization.md` | PERLU UPDATE BESAR | Masih referensi asumsi lama (mis. SQLAlchemy pooling) | Tulis ulang sesuai arsitektur aktual |
| `07_roadmap.md` | RAPI | Fase utama sudah sinkron dengan master tracking | Maintain |
| `08_admin_console.md` | RAPI | Status v2 dan endpoint utama sudah jelas | Maintain |
| `09_prompt_agent_planner.md` | PERLU UPDATE BESAR | Konteks planner belum mencakup baseline terbaru penuh | Update master prompt sesuai state terkini |
| `10_tier_system.md` | PERLU UPDATE BESAR | Banyak status implementasi sudah berubah | Re-baseline tabel fitur per tier |
| `11_payment_gateway.md` | PERLU UPDATE RINGAN | Masih valid sebagai plan, tapi detail tier/harga perlu sinkron | Koreksi detail pricing/dependency |
| `12_database_alternatives.md` | RAPI | Masih relevan sebagai panduan skala | Maintain |
| `13_feature_ideas.md` | PERLU UPDATE BESAR | Banyak ide sudah implemented tapi belum dipisah | Pindahkan fitur selesai ke section implemented |
| `14_redesign_plan.md` | PERLU UPDATE BESAR | Masih status planning lama, bertabrakan dengan UI sekarang | Ubah jadi redesign history + next UI plan |
| `15_mobile_apps_plan.md` | PERLU UPDATE RINGAN | Rencana masih usable, perlu sinkron branding dan dependency terbaru | Update metadata dan integrasi terkini |
| `16_ai_cost_analysis.md` | PERLU UPDATE BESAR | Nama produk/state implementasi AI sudah berubah jauh | Rework jadi cost ops + provider strategy terkini |
| `17_master_tracking.md` | RAPI | Source of truth paling lengkap | Keep as primary reference |

## Summary Status

- RAPI: 7/17
- PERLU UPDATE RINGAN: 3/17
- PERLU UPDATE BESAR: 7/17

## Prioritized Cleanup Queue

1. P0: `05_data_modeling.md`
2. P0: `10_tier_system.md`
3. P0: `16_ai_cost_analysis.md`
4. P0: `14_redesign_plan.md`
5. P0: `13_feature_ideas.md`
6. P0: `09_prompt_agent_planner.md`
7. P0: `06_resource_optimization.md`
8. P1: `02_authentication_design.md`
9. P1: `11_payment_gateway.md`
10. P1: `15_mobile_apps_plan.md`

## Definition of Done for Documentation Gate

- [ ] Semua file artefak berstatus `RAPI`
- [ ] Tidak ada URL production lama yang tersisa
- [ ] Tidak ada kontradiksi status fitur terhadap `17_master_tracking.md`
- [ ] Semua dokumen punya `Last updated` dan `rev` yang valid

## Update Log

- 2026-04-26 (rev 5): implementasi opsi 1 selesai: redesign dilanjutkan ke page `transaksi`, `laporan`, `budget` + upgrade `PageHero` agar mendukung mode Showtime secara native + CSS `showtime-surface` untuk konsistensi komponen lintas halaman.
- 2026-04-26 (rev 4): sinkron checkpoint setelah embed referensi `oprex-redesign` ke web utama: global showtime shell mesh aura, nav desktop/mobile dark-glass, dashboard card tilt + sparkline + ticker, dan custom cursor khusus showtime.
- 2026-04-26 (rev 3): update checkpoint setelah implementasi Prototype V1 visual mode (Ringkas/Showtime), reduced-motion global guard, serta polish motion dashboard + belanja.
- 2026-04-26 (rev 2): sinkron checkpoint setelah rilis commit `1a3214b`, update metadata artefak, dan align source of truth di `17_master_tracking.md`.
- 2026-04-25 (rev 1): checkpoint dibuat, baseline status 17 dokumen dicatat.
