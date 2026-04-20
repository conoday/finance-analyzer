# Admin Console

> Last updated: 2026-04-20 (rev 5)
> Status: ✅ v2 DONE — repo `conoday/oprex-admin-console`

## Implementasi Aktual

Admin console dibangun sebagai **Next.js 14 App Router** di repo terpisah:
- Repo: `github.com/conoday/oprex-admin-console`
- Stack: Next.js 14, TypeScript, Tailwind CSS
- Auth: Bearer token di localStorage (`NEXT_PUBLIC_ADMIN_TOKEN`)
- API: connect ke `https://oprexduit.onrender.com`

### Halaman yang Ada (v2)

```
/                → Dashboard: user stats, sparkline 7d, source breakdown, OCR count
/users           → List semua users (name, email, telegram status)
/transactions    → List transaksi + user name + copyable IDs + search + filter
/logs            → Log Explorer: level/source filter, auto-refresh, expandable details
/ocr-metadata    → Bank OCR Metadata: detected fields per bank/e-wallet
/affiliate       → CRUD tabel affiliate_products (create/edit/delete/toggle is_active)
/reports         → List link_reports + dismiss (delete)
/api-keys        → AI API Key management (CRUD, priority, rotation)
/ai-logs         → In-memory AI error/rate-limit logs
/settings        → Config API URL + Bearer token (localStorage)
```

### Dashboard Metrics (v2)

| Metrik | Deskripsi |
|---|---|
| Total Users | Semua user terdaftar |
| Telegram Users | User yang terdaftar via Telegram |
| Transaksi Hari Ini | Dicatat hari ini (WIB) |
| Transaksi Bulan Ini | Total bulan berjalan |
| Sparkline 7 Hari | Bar chart tx per hari |
| Source Breakdown | web / telegram / telegram_ocr / telegram_shopping |
| Active Rooms | Shared budget rooms |
| AI Keys Active | Kunci API AI aktif |
| OCR Scans | Scan gambar bulan ini |
| Affiliate Products | Produk terdaftar |

### File Kunci (v2)

```
app/page.tsx             → Dashboard: sparkline, source chart, admin metrics
app/users/page.tsx       → User list
app/transactions/page.tsx→ Transactions + user name + copyable IDs + search
app/logs/page.tsx        → Log Explorer (live mode, level/source filter)
app/ocr-metadata/page.tsx→ Bank OCR Metadata (detected fields per bank)
app/affiliate/page.tsx   → CRUD affiliate products + modal form
app/reports/page.tsx     → List reports + dismiss
app/api-keys/page.tsx    → AI API key management (CRUD + priority)
app/ai-logs/page.tsx     → AI error/rate-limit logs
app/settings/page.tsx    → API config via localStorage
components/Sidebar.tsx   → Nav sidebar (updated: Logs, OCR Metadata)
lib/api.ts               → apiFetch<T>(), formatRupiah(), formatDate()
```

### Cara Akses
1. Set API URL di /settings: `https://oprexduit.onrender.com`
2. Set Admin Token di /settings: Bearer token dari environment
3. Semua request ke backend pakai header `Authorization: Bearer <token>`

---

## API Endpoints yang Dipakai Admin Console

| Method | Path | Deskripsi |
|---|---|---|
| GET | /admin/stats | Dashboard metrics (users, tx, sparkline, source) |
| GET | /admin/users | List users + search |
| GET | /admin/transactions | List tx + user name + search + filter |
| GET | /admin/logs | System logs (level, source filter) |
| GET | /admin/ocr-metadata | Bank OCR metadata |
| GET | /admin/ai-logs | In-memory AI error logs |
| GET | /affiliate/products | List produk |
| POST | /affiliate/products | Tambah produk baru |
| PUT | /affiliate/products/{id} | Edit produk |
| DELETE | /affiliate/products/{id} | Hapus produk |
| GET | /affiliate/reports | List laporan link rusak |
| DELETE | /affiliate/reports/{id} | Dismiss laporan |
| GET | /admin/api-keys | List AI API keys |
| POST | /admin/api-keys | Tambah key baru |
| PUT | /admin/api-keys/{id} | Update key |
| DELETE | /admin/api-keys/{id} | Hapus key |

---

## Yang Sudah Dihapus dari Dashboard

- ❌ Pemasukan Bulan Ini (tidak relevan untuk admin multi-user)
- ❌ Pengeluaran Bulan Ini
- ❌ Net (Surplus/Defisit)
