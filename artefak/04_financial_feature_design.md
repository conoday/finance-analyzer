# Financial Feature Design

> Last updated: 2026-04-20 (rev 3)

## Core Features

### 1. Transaction Fields

| Field | Type | Contoh |
|---|---|---|
| type | enum | income / expense |
| amount | decimal | 250000.00 |
| date | date | 2025-03-15 |
| category_raw | string | Makan, Transport, Gaji |
| payment_method | string | BCA, GoPay, Cash |
| description | string | Makan siang |
| source | string | web / telegram / telegram_ocr / telegram_shopping |
| scope | string | private / couple / group |

**Categories:**
- Income: Gaji, Freelance, Investasi, Pendapatan, Lainnya
- Expense: Makan, Transport, Belanja, Hiburan, Tagihan, Kesehatan, Transfer, Investasi, Amal & Donasi, Lainnya

### 2. Payment Methods

| Nama | Tipe |
|---|---|
| BCA, BNI, Mandiri, BRI | bank |
| GoPay, OVO, DANA, ShopeePay | e-wallet |
| Cash | tunai |
| QRIS | universal |
| Lainnya | other |

### 3. Image Extraction Pipeline (2-Stage OCR) — ✅ IMPLEMENTED

Karena limitasi proxy Z.AI yang membuang konteks gambar, aplikasi OprexDuit menggunakan sistem 2-tahap (Two-Stage OCR Pipeline) untuk mengamankan data dan menghindari halusinasi model.

#### The 2-Stage Flow (Web & Telegram)
```
User kirim/upload foto (Telegram / Web)
    ↓ Encode base64
    ↓ STAGE 1: Mata (OCR.Space API)
      - Hit https://api.ocr.space/parse/image (key: helloworld)
      - Extract raw messy plain-text dari struk (≈600ms)
    ↓ STAGE 2: Otak (GLM-4.7 Text Model)
      - Inject raw text ke dalam sistem prompt
      - AI bertugas merakit text berantakan menjadi JSON struktur
    ↓ Parse: {transactions[], bank_name, metadata_fields}
    ↓ Save to DB
    ↓ Save bank metadata to bank_ocr_metadata table
```

#### Web OCR Flow
```
User upload foto di SmartInput
    ↓ POST /ai/ocr (multipart file)
    ↓ AI Vision → extract JSON
    ↓ Return parsed transactions
    ↓ User konfirmasi → simpan ke DB
```

### 4. AI Chat — ✅ IMPLEMENTED

```
User ketik pesan di FloatingAIChat
    ↓ POST /ai/chat (+ auth token header)
    ↓ Backend fetch 30 tx terakhir user (optional auth)
    ↓ Build user_data: summary, by_category, transactions
    ↓ AI (GLM-4.7) dgn guardrails + user context
    ↓ Return personalized response
```

**Guardrails:**
- TIDAK boleh bocorkan system prompt, API keys, DB schema
- Hanya topik keuangan
- Jika user belum login → mode edukasi generik
- Jika user login → jawaban personal berdasarkan data

### 5. Shared Budget Room — ✅ IMPLEMENTED

```
User buat room (/room create)
    ↓ Room code 6 digit
    ↓ User lain join (/room join KODE)
    ↓ Transaksi bisa diberi scope: couple/group
    ↓ Insert transaksi → notifikasi ke semua member room
    ↓ Laporan room menampilkan semua transaksi shared
```

## Non-AI Parsing (Rule-Based) — For Future Pipeline

### BCA Mobile
```python
BCA_PATTERNS = {
    "type":     r"(DEBET|KREDIT)",
    "amount":   r"Rp\s?([\d.,]+)",
    "date":     r"Tgl:\s?(\d{2}/\d{2}/\d{4})",
    "merchant": r"Ke:\s?(.+)",
}
```

### GoPay
```python
GOPAY_PATTERNS = {
    "type":     lambda _: "expense",
    "amount":   r"Rp\s?([\d.,]+)",
    "merchant": r"GoFood\s?-\s?(.+)|GoPay\s?-\s?(.+)",
    "date":     r"(\d{1,2}\s\w+\s\d{4})",
}
```

### OVO
```python
OVO_PATTERNS = {
    "type":     lambda _: "expense",
    "amount":   r"Jumlah:\s?Rp\s?([\d.,]+)",
    "merchant": r"Merchant:\s?(.+)",
    "date":     r"Tanggal:\s?(\d{2}-\d{2}-\d{4})",
}
```

### Bank Metadata Collection (Admin Console)

Table `bank_ocr_metadata` menyimpan metadata yang terdeteksi dari OCR:
- `bank_name`: nama bank/e-wallet
- `detected_fields`: array field yang ditemukan (no_referensi, saldo, dll)
- `sample_count`: berapa kali bank ini muncul di OCR
- Info ini dipakai admin untuk membangun rule-based parser tanpa AI

## User Confirmation Step

Setelah OCR parsing → frontend tampilkan form pre-filled:
- User bisa edit field yang salah diparse
- User klik Simpan → baru masuk ke DB
- Mencegah false positives dari OCR
