# Tier System & Feature Gating

> Last updated: 2026-04-12 (rev 3)
> Source of truth untuk tier: `profiles.plan_type` (bukan `users.tier`)

## Tier Overview (Updated 2026-04-12)

| Fitur | Free | Pro (Rp 29K/bln) | AI (Rp 59K/bln) | Business (Rp 149K/bln) | Impl Status |
|---|---|---|---|---|---|
| Login Google | ✅ | ✅ | ✅ | ✅ | ✅ Done |
| Input manual transaksi (SmartInput) | ✅ | ✅ | ✅ | ✅ | ✅ Done |
| QuickTracker dashboard | ✅ | ✅ | ✅ | ✅ | ✅ Done |
| Kategori otomatis (rule-based) | ✅ | ✅ | ✅ | ✅ | ✅ Done |
| Metode bayar (cash/bank/ewallet) | ✅ | ✅ | ✅ | ✅ | ✅ Done |
| Dashboard KPI + Charts | ✅ | ✅ | ✅ | ✅ | ✅ Done |
| SpendingHeatmap | ✅ | ✅ | ✅ | ✅ | ✅ Done |
| Upload mutasi bank CSV | ✅ Max 5/bln | ✅ Unlimited | ✅ | ✅ | ✅ Done (enforcement 🔲) |
| History transaksi | ✅ Max 3 bln | ✅ Unlimited | ✅ | ✅ | 🔲 enforcement Phase 3 |
| Jumlah akun | ✅ Max 3 | ✅ Unlimited | ✅ | ✅ | 🔲 enforcement Phase 3 |
| Export CSV | ✅ | ✅ | ✅ | ✅ | ✅ Done |
| Export PDF | ❌ | ✅ | ✅ | ✅ | 🔲 Phase 3 |
| Custom kategori | ❌ | ✅ | ✅ | ✅ | 🔲 Phase 3 |
| Tag transaksi | ❌ | ✅ | ✅ | ✅ | 🔲 Phase 3 |
| Budget per kategori + alert | ❌ | ✅ | ✅ | ✅ | 🔲 Phase 3 |
| Laporan bulanan email | ❌ | ✅ | ✅ | ✅ | 🔲 Phase 3 |
| OCR foto struk | ❌ | ✅ | ✅ | ✅ | 🔲 Phase 4 |
| AI Insight ("boros makan +30%") | ❌ | ❌ | ✅ | ✅ | 🔲 Phase AI |
| Smart suggestion engine | ❌ | ❌ | ✅ | ✅ | 🔲 Phase AI |
| Financial persona detection | ❌ | ❌ | ✅ | ✅ | 🔲 Phase AI |
| Prediksi cashflow akhir bulan | ❌ | ❌ | ✅ | ✅ | 🔲 Phase AI |
| Personal AI agent (memory) | ❌ | ❌ | ✅ | ✅ | 🔲 Phase AI+ |
| Multi-user / team wallet | ❌ | ❌ | ❌ | ✅ | 🔲 Far future |
| API akses | ❌ | ❌ | ❌ | ✅ | 🔲 Far future |

## Quota Enforcement (Backend)

> Source of truth: `profiles.plan_type` (bukan `users.tier`)

### Cek Kuota File Upload

```python
# api/main.py
from datetime import datetime

async def check_file_quota(user_id: str, plan_type: str, db):
    if plan_type != "free":
        return  # Pro/AI/Business tidak terbatas
    
    current_period = datetime.now().strftime("%Y-%m")
    # Query import_batches (bukan file_imports)
    count = await db.execute(
        "SELECT COUNT(*) FROM import_batches WHERE user_id=$1 AND period=$2",
        user_id, current_period
    )
    if count >= 5:
        raise HTTPException(
            status_code=429,
            detail="Batas upload file bulanan tercapai (5/bulan). Upgrade ke Pro untuk unlimited."
        )
```

### Cek Akses Fitur Pro+

```python
async def require_pro(current_user = Depends(require_auth)):
    plan = current_user.get("plan_type", "free")
    if plan == "free":
        raise HTTPException(
            status_code=403,
            detail="Fitur ini hanya tersedia untuk pengguna Pro. Upgrade sekarang."
        )
    return current_user

async def require_ai_tier(current_user = Depends(require_auth)):
    plan = current_user.get("plan_type", "free")
    if plan not in ("ai", "business"):
        raise HTTPException(status_code=403, detail="Upgrade ke AI tier untuk fitur ini.")
    return current_user
```

## Frontend Feature Gating

```typescript
// hooks/useTier.ts
import { useAuth } from './useAuth';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export function useTier() {
  const { user } = useAuth();
  const [planType, setPlanType] = useState<string>('free');

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase
      .from('profiles')
      .select('plan_type')
      .eq('id', user.id)
      .single()
      .then(({ data }) => setPlanType(data?.plan_type ?? 'free'));
  }, [user]);

  return {
    planType,
    isPro: ['pro', 'ai', 'business'].includes(planType),
    isAI: ['ai', 'business'].includes(planType),
    isBusiness: planType === 'business',
    isFree: planType === 'free',
  };
}

// Di komponen
const { isPro, isFree } = useTier();

{isFree && importCount >= 5 && (
  <Banner>Kuota 5 file/bulan habis. <UpgradeButton /></Banner>
)}

{!isPro && (
  <LockedFeature label="OCR Image Extraction" />
)}
```

## Upgrade Flow

```
User klik "Upgrade ke Pro" (di dashboard atau locked feature)
        ↓
Frontend POST /subscribe { tier: "pro" }
        ↓
Backend buat invoice Midtrans Snap
        ↓
Frontend redirect ke halaman pembayaran Midtrans
        ↓
User bayar (QRIS / VA Bank / GoPay / OVO / Kartu)
        ↓
Midtrans POST /payment/callback (webhook)
        ↓
Backend verifikasi HMAC-SHA512 signature
        ↓
Backend: UPDATE profiles SET plan_type='pro', expires_at=NOW()+30d
        ↓
✅ User langsung dapat akses fitur Pro
```

## Downgrade Logic

- `expires_at` lewat → cron job set `plan_type = 'free'`
- Data tidak dihapus saat downgrade — hanya akses dibatasi
- User tetap bisa lihat data lama (UI blur/locked)
