# Admin Console

## Purpose
Interface internal untuk monitoring user, transaksi, dan debugging.
Diakses via /admin dengan role=admin — tidak tampil di UI user biasa.

## Features

### User Management
- View all users (email, provider, tier, tanggal daftar)
- View detail + transaksi milik 1 user
- Change role dan tier manual
- (Optional) Disable user

### Transaction Monitoring
- View all transactions lintas user
- Filter by user, date range, category
- Edit manual (koreksi OCR yang salah)
- Delete (soft delete)

## Access Control

```sql
role VARCHAR(20) DEFAULT 'user'  -- 'user' | 'admin'
```

```python
async def require_admin(current_user = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return current_user
```

## UI Structure

```
/admin                   ← Dashboard: stats ringkasan
/admin/users             ← Table semua user
/admin/users/[id]        ← Detail user + transaksinya
/admin/transactions      ← Table semua transaksi
```

## API Endpoints (Admin)

| Method | Path | Deskripsi |
|---|---|---|
| GET | /admin/users | List semua user |
| GET | /admin/users/{id} | Detail user |
| PUT | /admin/users/{id}/role | Ubah role |
| PUT | /admin/users/{id}/tier | Ubah tier manual |
| GET | /admin/transactions | List semua transaksi |
| PUT | /admin/transactions/{id} | Edit transaksi |
| DELETE | /admin/transactions/{id} | Hapus transaksi |
| GET | /admin/stats | Total user, total transaksi, dll |
