# Tier System & Feature Gating

## Tier Overview (Updated 2026-04-10)

| Fitur | Free | Pro (Rp 29K/bln) | AI Personal (Rp 59K/bln) |
|---|---|---|---|
| Login & akun | ✅ | ✅ | ✅ |
| Input manual transaksi | ✅ | ✅ | ✅ |
| Kategori otomatis | ✅ | ✅ | ✅ |
| Metode bayar (cash/bank/ewallet) | ✅ | ✅ | ✅ |
| Dashboard (saldo, income, expense) | ✅ | ✅ | ✅ |
| Chart pengeluaran per kategori | ✅ | ✅ | ✅ |
| History transaksi | ✅ Max 3 bulan | ✅ Unlimited | ✅ Unlimited |
| Jumlah akun | ✅ Max 3 | ✅ Unlimited | ✅ Unlimited |
| Custom kategori | ❌ | ✅ | ✅ |
| Tag transaksi | ❌ | ✅ | ✅ |
| Export CSV / PDF | ❌ | ✅ | ✅ |
| Laporan bulanan otomatis | ❌ | ✅ | ✅ |
| Budget per kategori + notifikasi | ❌ | ✅ | ✅ |
| AI Insight ("boros makan +30%") | ❌ | ❌ | ✅ |
| Smart suggestion engine | ❌ | ❌ | ✅ |
| Financial persona detection | ❌ | ❌ | ✅ |
| Prediksi cashflow akhir bulan | ❌ | ❌ | ✅ |
| Personal AI agent (memory) | ❌ | ❌ | ✅ |
| OCR foto struk | ❌ | ✅ | ✅ |

## Quota Enforcement (Backend)

### Cek Kuota File Upload

```python
# api/main.py
from datetime import datetime

async def check_file_quota(user, db):
    if user.tier != "free":
        return  # Pro/Business tidak terbatas
    
    current_period = datetime.now().strftime("%Y-%m")
    count = await db.execute(
        select(func.count(FileImport.id))
        .where(FileImport.user_id == user.id)
        .where(FileImport.period == current_period)
    )
    if count.scalar() >= 5:
        raise HTTPException(
            status_code=429,
            detail="Batas upload file bulanan tercapai (5/bulan). Upgrade ke Pro untuk unlimited."
        )
```

### Cek Akses Fitur OCR

```python
async def require_pro(current_user = Depends(get_current_user)):
    if current_user.tier == "free":
        raise HTTPException(
            status_code=403,
            detail="Fitur ini hanya tersedia untuk pengguna Pro. Upgrade sekarang."
        )
    return current_user
```

## Frontend Feature Gating

```typescript
// hooks/useTier.ts
export function useTier() {
  const { data: session } = useSession();
  const tier = session?.user?.tier ?? "free";
  return {
    tier,
    isPro: tier === "pro" || tier === "business",
    isBusiness: tier === "business",
    isFree: tier === "free",
  };
}

// Di komponen
const { isPro, isFree } = useTier();

{isFree && fileImportCount >= 5 && (
  <Banner>Kuota 5 file/bulan habis. <UpgradeButton /></Banner>
)}

{!isPro && (
  <LockedFeature label="OCR Image Extraction" />
)}
```

## Upgrade Flow

```
User klik "Upgrade ke Pro"
        ↓
Frontend POST /subscribe { tier: "pro" }
        ↓
Backend buat invoice di Midtrans / Xendit
        ↓
Frontend redirect ke halaman pembayaran
        ↓
User bayar (transfer / QRIS / kartu)
        ↓
Midtrans / Xendit kirim webhook ke /payment/callback
        ↓
Backend verifikasi signature webhook
        ↓
Backend update users.tier = "pro"
        ↓
User dapat akses fitur Pro
```

## Downgrade Logic

- Tidak ada downgrade otomatis (manual oleh admin)
- Saat subscription expires_at terlewat → tier dikembalikan ke "free" via cron job
- Data tidak dihapus saat downgrade, hanya dibatasi aksesnya
