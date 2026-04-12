# Payment Gateway — Indonesia

> Status: 🔲 Phase 6 (belum diimplementasi)
> Last updated: 2026-04-12 (rev 2)
> Dependencies: Phase 3 (DB + Tier) harus selesai dulu

## Perbandingan Payment Gateway (per April 2026)

| Provider | MDR Kartu | QRIS | VA Transfer | Biaya Setup | Rekomendasi |
|---|---|---|---|---|---|
| **Midtrans** | 2% | 0.7% | Rp 4.000/tx | Gratis | ⭐ Terbaik untuk mulai |
| **Xendit** | 2% | 0.7% | Rp 4.000/tx | Gratis | ⭐ Alternatif Midtrans |
| **Doku** | 2.5% | 0.7% | Rp 3.500/tx | Gratis | OK |
| **Ipaymu** | 2.5% | 0.7% | Rp 3.500/tx | Gratis | Kurang populer |
| **Faspay** | 2.5% | 0.8% | Rp 4.000/tx | Gratis | Enterprise-focused |

**Catatan MDR = Merchant Discount Rate (% dari nilai transaksi)**

## Rekomendasi: Midtrans (by Gojek)

**Kenapa Midtrans:**
- Paling populer di Indonesia, dokumentasi lengkap
- Sandbox gratis untuk testing
- Support: QRIS, VA semua bank, GoPay, OVO, ShopeePay, kartu kredit
- SDK Python tersedia
- Integrasi mudah dengan FastAPI
- Tidak ada biaya bulanan — bayar per transaksi saja

**Biaya nyata untuk subscription Rp 29.000:**
- Via QRIS: Rp 29.000 × 0.7% = Rp 203 fee
- Via VA Bank: Rp 4.000 flat fee
- Kamu terima: ±Rp 24.800 - Rp 25.000 per subscriber

## Alternatif #2: Xendit

Hampir identik dengan Midtrans dari sisi biaya, tapi:
- UI dashboard lebih modern
- API lebih developer-friendly
- Support multi-currency (berguna jika mau ekspansi)

## Implementasi Midtrans (FastAPI)

```python
# requirements.txt tambahan:
# midtransclient

import midtransclient

snap = midtransclient.Snap(
    is_production=False,  # ganti True di production
    server_key=os.environ["MIDTRANS_SERVER_KEY"]
)

@app.post("/subscribe")
async def create_subscription(
    body: SubscribeRequest,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    tier_prices = {"pro": 29000, "business": 99000}
    amount = tier_prices[body.tier]

    transaction_details = {
        "order_id": f"sub-{current_user.id}-{int(time.time())}",
        "gross_amount": amount
    }
    customer_details = {
        "first_name": current_user.name,
        "email": current_user.email
    }
    transaction = snap.create_transaction({
        "transaction_details": transaction_details,
        "customer_details": customer_details
    })
    # return Snap payment URL ke frontend
    return {"payment_url": transaction["redirect_url"]}


@app.post("/payment/callback")
async def payment_callback(request: Request, db: AsyncSession = Depends(get_db)):
    body = await request.json()
    
    # Verifikasi signature Midtrans
    expected = hashlib.sha512(
        f"{body['order_id']}{body['status_code']}{body['gross_amount']}"
        f"{os.environ['MIDTRANS_SERVER_KEY']}".encode()
    ).hexdigest()
    if body.get("signature_key") != expected:
        raise HTTPException(status_code=403, detail="Invalid signature")
    
    if body["transaction_status"] == "settlement":
        # Extract user_id dari order_id: "sub-{user_id}-{timestamp}"
        user_id = body["order_id"].split("-")[1]
        tier = "pro"  # atau parse dari metadata
        # Update profiles.plan_type (bukan users.tier)
        await db.execute(
            "UPDATE profiles SET plan_type=$1, updated_at=NOW() WHERE id=$2",
            tier, user_id
        )
        await db.commit()
    
    return {"status": "ok"}
```

## Environment Variables (Render)

```
MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxx   (sandbox)
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxx   (sandbox)
```

## Setup Steps

1. Daftar akun di https://dashboard.midtrans.com
2. Aktifkan Sandbox mode
3. Dapatkan Server Key & Client Key
4. Set env vars di Render
5. Test dengan kartu sandbox: 4811111111111114

## Notes

- Subscription di sini adalah **recurring manual** (user bayar lagi setiap bulan)
- Auto-recurring (charge otomatis) butuh fitur Recurring Midtrans atau Xendit (lebih complex)
- Untuk fase awal: cukup manual renewal dengan reminder email
