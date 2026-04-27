# Payment Gateway Plan (Indonesia)

> Status: RAPI (Planning)
> Last updated: 2026-04-26 (rev 3)
> Current implementation: belum live di backend

## Goal

Mengaktifkan upgrade berbayar yang mengubah `profiles.plan_type` secara aman dan auditable.

## Recommended Provider

### Primary: Midtrans

Alasan:

1. Maturity tinggi untuk pasar Indonesia.
2. Metode pembayaran lengkap (QRIS, VA, e-wallet, kartu).
3. Dokumentasi dan webhook flow jelas untuk backend FastAPI.
4. Cocok untuk initial recurring-manual model.

### Secondary Option: Xendit

Dipertimbangkan jika butuh fallback provider atau negosiasi biaya operasional yang lebih baik.

## Integration Scope (Minimal Viable)

1. Endpoint create checkout
   - `POST /billing/checkout`
2. Endpoint webhook callback
   - `POST /billing/callback`
3. Persist subscription history
   - table `subscriptions` (atau `billing_events` + update `profiles.plan_type`)
4. Graceful downgrade logic
   - tier kembali `free` saat langganan expired/cancelled

## Security Requirements

1. Wajib verifikasi signature callback payment gateway.
2. Idempotency untuk callback (jangan upgrade plan dua kali untuk event sama).
3. Jangan pernah mempercayai status pembayaran dari frontend.
4. Semua perubahan tier harus ditulis dari backend setelah callback tervalidasi.

## Data Contract (Suggested)

### Checkout request

```json
{
  "target_plan": "pro"
}
```

### Callback effect

- update `profiles.plan_type`
- simpan event ke tabel billing
- audit trail timestamp + order_id + payment_status

## Dependencies Sebelum Implementasi

1. Tier enforcement backend minimal harus siap agar value upgrade jelas.
2. Struktur tabel billing harus disetujui (`subscriptions`/`billing_events`).
3. Halaman frontend upgrade + status billing harus disiapkan.

## Rollout Plan

1. Sprint 1
   - schema billing + create checkout + callback verify
2. Sprint 2
   - UI upgrade flow + subscription status page
3. Sprint 3
   - reminders, downgrade automation, retry failed webhook

## Done Criteria

- [ ] User bisa checkout dari UI
- [ ] Callback tervalidasi dan mengubah `profiles.plan_type`
- [ ] Event billing tercatat dengan idempotency
- [ ] Upgrade/downgrade dapat diuji end-to-end di sandbox
