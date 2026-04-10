# Feature Ideas — Brainstorm

> Last updated: 2026-04-10
> Status: Brainstorm — belum di-prioritize ke roadmap

---

## Referensi Aplikasi Serupa

| Aplikasi | Platform | Kelebihan yang bisa ditiru |
|---|---|---|
| **Money Manager** | iOS/Android | UI simpel, entry cepat, pie chart intuitif |
| **Wallet by BudgetBakers** | iOS/Android/Web | Multi akun, auto-sync bank (paid), desain bersih |
| **Toshl Finance** | iOS/Android/Web | Gamifikasi, ilustrasi lucu, UX menyenangkan |
| **YNAB (You Need A Budget)** | Web/iOS/Android | Zero-based budgeting, edukasi user |
| **Spendee** | iOS/Android | Warna cerah, shared wallets, beautiful charts |
| **Notion + template** | Web | Minimalis, customizable, banyak user Indonesia |
| **Finansialku** | Web/Android | Lokal Indonesia, fitur goals & perencanaan |

**Insight:** Kebanyakan app lokal Indonesia desainnya ketinggalan zaman atau UX-nya berat.
Peluang: desain modern + feel lokal + harga terjangkau.

---

## Feature Ideas (dikelompokkan)

### Kategori 1 — Core UX Improvements

| ID | Fitur | Deskripsi | Tier |
|---|---|---|---|
| F01 | Quick Add Transaction | Bottom sheet / floating button — input transaksi < 5 detik | Free |
| F02 | Swipe to Categorize | Gesture swipe kiri/kanan untuk kategorisasi cepat seperti Tinder | Free |
| F03 | Voice Input | "Pengeluaran lima puluh ribu makan siang" → auto-parse | Pro |
| F04 | Recurring Transaction | Tandai transaksi berulang (gaji, cicilan, langganan) → auto-entry | Pro |
| F05 | Notes & Foto Receipt | Lampirkan foto struk ke transaksi | Pro |
| F06 | Smart Search | Cari transaksi by merchant, amount, kategori, tanggal | Free |

### Kategori 2 — Analytics & Insights

| ID | Fitur | Deskripsi | Tier |
|---|---|---|---|
| A01 | Spending Heatmap Kalender | Visual seperti GitHub contribution graph — warna intensitas pengeluaran per hari | Free |
| A02 | Merchant Leaderboard | "Top 5 tempat yang paling banyak nguras kantong bulan ini" | Free |
| A03 | Day-of-Week Pattern | "Kamu paling boros hari Jumat" | Pro |
| A04 | Unusual Spending Alert | Deteksi pengeluaran anomali (rule-based, bukan ML) | Pro |
| A05 | Net Worth Tracker | Total aset - total pengeluaran kumulatif | Pro |
| A06 | Savings Rate | % income yang berhasil ditabung per bulan | Free |
| A07 | Category Trend | Chart naik/turun pengeluaran per kategori 6 bulan terakhir | Pro |
| A08 | Year-in-Review | Ringkasan tahunan — total income, total expense, best month, worst month | Pro |

### Kategori 3 — Budgeting & Goals

| ID | Fitur | Deskripsi | Tier |
|---|---|---|---|
| B01 | Budget per Kategori | Set batas pengeluaran per kategori per bulan | Pro |
| B02 | Budget Alert | Notifikasi saat 80% budget terpakai | Pro |
| B03 | Savings Goal | Target menabung (misal: Rp 5 juta untuk liburan) + progress bar | Pro |
| B04 | Emergency Fund Tracker | Berapa bulan dana darurat yang sudah terkumpul | Pro |
| B05 | Debt Tracker | Catat hutang / piutang + reminder | Pro |
| B06 | Zero-Based Budget Mode | Setiap rupiah income dialokasikan ke kategori | Business |

### Kategori 4 — Social & Collaborative

| ID | Fitur | Deskripsi | Tier |
|---|---|---|---|
| S01 | Shared Wallet | Dompet bersama untuk pasangan / keluarga / trip | Business |
| S02 | Split Bill | Input nota → hitung split otomatis | Pro |
| S03 | Financial Report PDF | Export laporan bulanan / tahunan sebagai PDF | Pro |
| S04 | Referral System | Invite teman → keduanya dapat 1 bulan Pro gratis | Free |

### Kategori 5 — Automation & AI (Future)

| ID | Fitur | Deskripsi | Tier |
|---|---|---|---|
| AI01 | Smart Categorization | ML model untuk auto-kategorisasi dari deskripsi transaksi | Pro |
| AI02 | Spending Prediction | Prediksi pengeluaran bulan depan berdasarkan historis | Pro |
| AI03 | Financial Coach Chatbot | Chat tanya-jawab "bulan ini boros di mana?" | Business |
| AI04 | Bank Statement Parser (AI) | Parse PDF mutasi bank dengan LLM — lebih akurat dari regex | Pro |

---

## Priority Matrix (Impact vs Effort)

```
HIGH IMPACT
    │
    │  A01 (heatmap)  B01 (budget)    AI01 (smart cat)
    │  F01 (quick add) A02 (merchant)
    │
    │  F04 (recurring) B03 (goals)   S01 (shared wallet)
    │
LOW ├──────────────────────────────────────────── HIGH EFFORT
    │
    │  A06 (savings%)  F06 (search)
    │  A08 (year review)
    │
LOW IMPACT
```

**Quick wins (High Impact, Low Effort):**
1. F01 — Quick Add Transaction (floating button)
2. A01 — Spending Heatmap Kalender
3. A06 — Savings Rate %
4. A02 — Merchant Leaderboard

---

## Feature Parking Lot (Ditunda, Bukan Dibatalkan)

- Open Banking API (terlalu complex, regulasi OJK ketat)
- Crypto portfolio tracking (risiko regulasi)
- Investasi reksa dana integration (butuh lisensi)
- Multi-currency (scope terlalu lebar untuk MVP)
