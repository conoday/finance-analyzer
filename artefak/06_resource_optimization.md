# Resource Optimization

## Free Tier Limits

| Service | Batasan Kritis |
|---|---|
| Render (free) | Sleep 15 menit idle, 512 MB RAM |
| Vercel (free) | 100 GB bandwidth/bulan, function timeout 10s |
| Supabase (free) | 500 MB DB, paused setelah 1 minggu tidak aktif |

## Strategies

### 1. Minimize API Calls
- Frontend caching dengan SWR / React Query
- Debounce input form 300ms sebelum hit API
- Jangan re-fetch hasil /analyze tiap render

### 2. Backend Efficiency
- Selalu gunakan async def di endpoint FastAPI
- Connection pooling SQLAlchemy (pool_size=5)
- GZipMiddleware untuk kompresi response

```python
from fastapi.middleware.gzip import GZipMiddleware
app.add_middleware(GZipMiddleware, minimum_size=1000)
```

### 3. Image Processing
- Resize gambar sebelum OCR: max 1200px wide
- Proses sync acceptable untuk free tier kecil
- Future: background job dengan ARQ

```python
from PIL import Image
def preprocess(img):
    img = img.convert("L")
    w, h = img.size
    if w > 1200:
        img = img.resize((1200, int(h * 1200 / w)))
    return img
```

### 4. Cold Start (Render Sleep)
- UptimeRobot ping /health setiap 10 menit (gratis)
- Frontend warm-up call saat layout pertama kali load

```typescript
useEffect(() => {
  fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`).catch(() => {});
}, []);
```

### 5. Bundle Size (Vercel)
```typescript
const ForecastChart = dynamic(() => import("@/components/ForecastChart"), { ssr: false });
```

### 6. CORS
- Set ALLOWED_ORIGINS hanya ke domain Vercel (bukan *)

## Monitoring Checklist

- [ ] UptimeRobot ping /health setiap 10 menit
- [ ] Monitor RAM Render < 512 MB
- [ ] Monitor Supabase DB < 500 MB
- [ ] Set Vercel bandwidth alert di 80 GB
