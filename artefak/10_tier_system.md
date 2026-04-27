# Tier System and Feature Gating

> Status: RAPI
> Last updated: 2026-04-26 (rev 4)

## Source of Truth

- Billing/user tier: `profiles.plan_type` (`free|pro|ai|business`)
- Shared room plan: `rooms.plan_type` (`solo|couple|family|team`) and is separate from billing tier

## Current State Summary

Skema tier sudah siap di database, tetapi enforcement fitur belum merata.

| Area | Kondisi Saat Ini |
|---|---|
| `profiles.plan_type` column | Sudah ada dan aktif |
| Middleware auth | Sudah aktif untuk route protected |
| Tier-specific dependency backend (`require_pro`, dll) | Belum jadi standar global |
| Kuota free (upload/history/account) | Belum enforced penuh |
| Payment gateway untuk upgrade tier | Belum diimplementasi |

## Capability Matrix (Aktual Implementasi)

| Fitur | Free | Pro | AI | Business | Implementasi |
|---|---|---|---|---|---|
| Login/register/auth session | Ya | Ya | Ya | Ya | Done |
| Input transaksi + dashboard analytics | Ya | Ya | Ya | Ya | Done |
| Shared room budget | Ya | Ya | Ya | Ya | Done (plan room terpisah) |
| Affiliate belanja flow | Ya | Ya | Ya | Ya | Done |
| AI chat/insight/categorize | Ya (currently open) | Ya | Ya | Ya | Done, belum tier-locked |
| OCR image parsing | Ya (currently open) | Ya | Ya | Ya | Done, belum tier-locked |
| Budget limits (`/budgets`) | Ya (currently open) | Ya | Ya | Ya | Done, belum tier-locked |
| PDF report export | Belum | Belum | Belum | Belum | Pending |
| Subscription billing | Belum | Belum | Belum | Belum | Pending |

## Enforcement Gap (Yang Masih Pending)

1. Free upload quota bulanan belum ada enforcement endpoint-level yang konsisten.
2. History cap 3 bulan untuk free tier belum diterapkan.
3. Max account count untuk free tier belum relevan karena model akun belum finalized.
4. Endpoint AI/OCR belum dibatasi berdasarkan tier.
5. UI gating masih minim (belum ada hook tier terpusat di frontend).

## Recommended Enforcement Order

1. Backend centralized plan resolver
   - helper: `resolve_user_plan(user_id)`
   - helper: `enforce_plan(min_plan)`
2. Enforce low-risk first
   - AI/OCR call quota
   - history range limit for free
3. Frontend mirrored gating
   - banner/lock state konsisten dengan backend response
4. Payment-driven upgrade
   - callback update `profiles.plan_type`

## Backend Pattern (Target)

```python
PLAN_WEIGHT = {"free": 0, "pro": 1, "ai": 2, "business": 3}

def require_plan(user_plan: str, min_plan: str) -> None:
    if PLAN_WEIGHT.get(user_plan, 0) < PLAN_WEIGHT[min_plan]:
        raise HTTPException(status_code=403, detail="Upgrade plan diperlukan")
```

## Frontend Pattern (Target)

```typescript
// Hook tunggal untuk baca plan user dari profiles
// Dipakai untuk menampilkan lock state, bukan sebagai security utama
export function canUseFeature(planType: string, minPlan: "free" | "pro" | "ai" | "business") {
  const weight = { free: 0, pro: 1, ai: 2, business: 3 };
  return weight[planType as keyof typeof weight] >= weight[minPlan];
}
```

## Operational Rule

- Semua enforcement wajib tetap dilakukan di backend.
- Gating frontend hanya untuk UX/visibility, bukan otorisasi final.
