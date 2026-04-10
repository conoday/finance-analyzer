# Financial Feature Design

## Core Features

### 1. Transaction Fields

| Field | Type | Contoh |
|---|---|---|
| type | enum | income / expense |
| amount | decimal | 250000.00 |
| date | date | 2025-03-15 |
| category | string | Makan, Transport, Gaji |
| payment_method | FK | BCA, GoPay |
| description | string | Makan siang |

**Categories:**
- Income: Gaji, Freelance, Investasi, Lainnya
- Expense: Makan, Transport, Belanja, Hiburan, Tagihan, Kesehatan, Pendidikan, Lainnya

### 2. Payment Methods

| Nama | Tipe |
|---|---|
| BCA, BNI, Mandiri, BRI | bank |
| GoPay, OVO, DANA, ShopeePay | e-wallet |

### 3. Image Extraction Pipeline

```
Gambar (PNG/JPG)
    ↓ Preprocessing (resize, grayscale)
    ↓ OCR — Tesseract (pytesseract)
    ↓ Regex Parser (per-bank template)
    ↓ Structured fields
    ↓ User konfirmasi (edit jika salah)
    ↓ Simpan ke DB
```

## Non-AI Parsing (Rule-Based)

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

## User Confirmation Step

Setelah OCR parsing → frontend tampilkan form pre-filled:
- User bisa edit field yang salah diparse
- User klik Simpan → baru masuk ke DB
- Mencegah false positives dari OCR
