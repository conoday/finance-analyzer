# Admin Console

> Last updated: 2026-04-17 (rev 3)
> Status: ✅ DONE — deployed di repo terpisah `conoday/oprex-admin-console` (commit 342a5cb)

## Implementasi Aktual

Admin console dibangun sebagai **Next.js 14 App Router** di repo terpisah:
- Repo: `github.com/conoday/oprex-admin-console`
- Stack: Next.js 14, TypeScript, Tailwind CSS
- Auth: Bearer token di localStorage (`NEXT_PUBLIC_ADMIN_TOKEN`)
- API: connect ke `https://oprexduit.onrender.com`

### Halaman yang sudah ada
```
/                → Dashboard: stat cards (produk aktif, laporan pending)
/affiliate       → CRUD tabel affiliate_products (create/edit/delete/toggle is_active)
/reports         → List link_reports + dismiss (delete)
/settings        → Config API URL + Bearer token (localStorage)
```

### File Kunci
```
app/page.tsx             → Dashboard stat cards
app/affiliate/page.tsx   → CRUD affiliate products + modal form
app/reports/page.tsx     → List reports + dismiss
app/settings/page.tsx    → API config via localStorage
components/Sidebar.tsx   → Nav sidebar dengan active link highlight
lib/api.ts               → apiFetch<T>(), formatRupiah(), formatDate()
```

### Cara Akses
1. Set API URL di /settings: `https://oprexduit.onrender.com`
2. Set Admin Token di /settings: Bearer token dari Supabase service role
3. Semua request ke backend pakai header `Authorization: Bearer <token>`

---

## Rencana Awal (Referensi)

Catatan: rencana di bawah adalah desain awal. Implementasi aktual fokus pada affiliate & link_reports management, bukan user management umum.

### User Management (Planned, belum implement)
- View all users (email, provider, tier, tanggal daftar)
- View detail + transaksi milik 1 user
- Change role dan tier manual

### Transaction Monitoring (Planned, belum implement)
- View all transactions lintas user
- Filter by user, date range, category

## Access Control (Backend)

```python
# api/main.py — semua /affiliate/* dan /affiliate/reports pakai require_auth
# Tidak ada role=admin enforcement khusus saat ini
# Token admin = Supabase service_role key di localStorage settings
```

## API Endpoints yang Dipakai Admin Console

| Method | Path | Deskripsi |
|---|---|---|
| GET | /affiliate/products | List semua produk |
| POST | /affiliate/products | Tambah produk baru |
| PUT | /affiliate/products/{id} | Edit produk |
| DELETE | /affiliate/products/{id} | Hapus produk |
| GET | /affiliate/reports | List laporan link rusak |
| DELETE | /affiliate/reports/{id} | Dismiss laporan |
