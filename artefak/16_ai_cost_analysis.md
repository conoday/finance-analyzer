# AI API Cost Analysis — Finance Analyzer

> Last updated: 2026-04-10
> Tujuan: memilih AI provider paling cost-efficient untuk fitur AI di app

---

## Konteks Kebutuhan

Finance Analyzer akan menggunakan AI untuk:
1. **Smart Categorization** (A01) — auto-kategorisasi nama merchant dari deskripsi transaksi
2. **Spending Prediction** (A02) — prediksi pengeluaran bulan depan
3. **Financial Coach Chatbot** (AI03) — tanya-jawab tentang keuangan user
4. **Bank Statement Parser AI** (AI04) — parse PDF mutasi bank (lebih akurat dari regex)
5. **AI Insight** — ringkasan otomatis per bulan (seperti catetin.ai)

---

## Perbandingan Provider AI (per April 2026)

### Tier 1 — Tercheap (Recommended untuk MVP)

| Provider | Model | Input ($/1M token) | Output ($/1M token) | Context | Notes |
|---|---|---|---|---|---|
| **DeepSeek** | deepseek-v3 | $0.27 (cache miss) / $0.07 (cache hit) | $1.10 | 64K | 🏆 Terbaik untuk harga/kualitas |
| **DeepSeek** | deepseek-r1 | $0.55 / $0.14 | $2.19 | 64K | Reasoning kuat, untuk analisis kompleks |
| **Google Gemini** | gemini-2.0-flash | $0.10 | $0.40 | 1M | Free tier 1.5K req/hari |
| **Groq** | llama-3.3-70b | ~$0.59 | ~$0.79 | 128K | Sangat cepat, ada free tier |
| **Together AI** | llama-4-scout | $0.18 | $0.18 | 512K | Open source, murah |

### Tier 2 — Mid-range

| Provider | Model | Input ($/1M token) | Output ($/1M token) | Notes |
|---|---|---|---|---|
| **OpenAI** | gpt-4o-mini | $0.15 | $0.60 | Reliable, ecosystem besar |
| **Anthropic** | claude-haiku-3.5 | $0.80 | $4.00 | Kualitas tinggi, mahal |
| **Kimi (Moonshot)** | moonshot-v1 | ~$0.14 | ~$0.55 | Bisa nego enterprise, bagus Bahasa Indonesia |

### Tier 3 — Premium (Skip untuk MVP)

| Provider | Model | Notes |
|---|---|---|
| OpenAI | gpt-4o | Mahal, overkill untuk finance categorization |
| Anthropic | claude-opus | Terlalu mahal |

---

## Analisis Kimi (Moonshot AI)

**Bisa nego harga?** Ya, untuk enterprise/high volume:
- Contact: business@moonshot.ai atau via WeChat enterprise
- Umumnya diskon 30-50% untuk komitmen >$1000/bulan
- Bagus untuk **Bahasa Indonesia** (training data lebih banyak)
- Tersedia di: https://platform.moonshot.cn

**Catatan:** Platform utama di China, perlu verifikasi KTP/bisnis Cina untuk akun enterprise. Untuk MVP Indonesia, lebih mudah mulai dengan DeepSeek atau Gemini.

---

## Rekomendasi Strategy: Hybrid Routing

```
Request masuk
     │
     ├── Kategorisasi transaksi (simple)
     │        └── DeepSeek-V3 (cache hit: $0.07/1M) ← CHEAPEST
     │
     ├── Ringkasan bulanan (medium)
     │        └── Gemini Flash 2.0 ($0.10/1M, ada free tier)
     │
     ├── Financial Coach Chat (medium)
     │        └── DeepSeek-V3 atau Groq llama-3.3
     │
     └── PDF Bank Statement Parse (heavy)
              └── DeepSeek-R1 atau Gemini Flash (large context)
```

### Estimasi Biaya per User per Bulan

```
Asumsi: user average 200 transaksi/bulan, 5 AI insights, 10 chat messages

Kategorisasi (200 tx × 50 tokens avg):   10,000 tokens → $0.001
Monthly insight (5 × 500 tokens):          2,500 tokens → $0.00025
Chat (10 × 300 tokens avg):               3,000 tokens → $0.0003

TOTAL per user: ~$0.002/bulan (0.2 sen USD)
per 1000 users: ~$2/bulan 🎉
per 10,000 users: ~$20/bulan
```

**Kesimpulan: AI cost SANGAT murah untuk scale. Tidak perlu khawatir sampai ratusan ribu user.**

---

## Cara Mulai — DeepSeek (Recommended)

1. Daftar: https://platform.deepseek.com
2. Top up saldo (minimal $5)
3. Copy API key
4. Install: `pip install openai` (DeepSeek compatible dengan OpenAI SDK!)

```python
# backend/services/ai.py
from openai import OpenAI

client = OpenAI(
    api_key=os.getenv("DEEPSEEK_API_KEY"),
    base_url="https://api.deepseek.com"
)

def categorize_transaction(description: str) -> str:
    response = client.chat.completions.create(
        model="deepseek-chat",  # deepseek-v3
        messages=[
            {
                "role": "system",
                "content": "Kamu adalah asisten kategorisasi transaksi keuangan Indonesia. "
                           "Kategorikan transaksi ke salah satu: Makan, Transport, Belanja, "
                           "Hiburan, Kesehatan, Pendidikan, Tagihan, Transfer, Lainnya. "
                           "Jawab HANYA nama kategori, tidak ada penjelasan."
            },
            {"role": "user", "content": f"Transaksi: {description}"}
        ],
        max_tokens=20,
        temperature=0
    )
    return response.choices[0].message.content.strip()
```

---

## Cara Mulai — Gemini Flash (Alternatif dengan Free Tier)

1. Daftar: https://aistudio.google.com
2. Generate API key (gratis)
3. Install: `pip install google-generativeai`

```python
import google.generativeai as genai

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-2.0-flash")

def generate_monthly_insight(summary: dict) -> str:
    prompt = f"""Buat ringkasan keuangan singkat (2-3 kalimat, Bahasa Indonesia):
    - Pemasukan: Rp {summary['total_income']:,}
    - Pengeluaran: Rp {summary['total_expense']:,}  
    - Kategori terbesar: {summary['top_category']}
    - Savings rate: {summary['savings_rate']}%
    Nada: supportif, tidak menghakimi."""
    
    response = model.generate_content(prompt)
    return response.text
```

---

## Decision Matrix

| Kriteria | DeepSeek | Gemini Flash | Kimi | Groq |
|---|---|---|---|---|
| Harga | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Kualitas Bahasa Indonesia | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Reliability/Uptime | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| Free Tier | ❌ | ✅ 1.5K req/hari | ❌ | ✅ terbatas |
| Kemudahan Setup | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| Bisa Nego Harga | ✅ | ❌ (fixed) | ✅ enterprise | ❌ |

**Rekomendasi Final:**
- **Phase 1 (MVP AI):** DeepSeek-V3 untuk semua task → paling murah, compatible OpenAI SDK
- **Phase 2 (Scale):** Hybrid DeepSeek + Gemini Flash (simple tasks ke Gemini free tier)
- **Phase 3 (Enterprise):** Nego dengan Kimi/Moonshot untuk volume tinggi

---

## Status Implementasi

- [ ] Setup DeepSeek API key di Render env
- [ ] Buat `backend/services/ai.py` service layer
- [ ] Endpoint `POST /ai/categorize` — auto-kategorisasi batch
- [ ] Endpoint `POST /ai/insight` — ringkasan bulanan
- [ ] Frontend: tampilkan AI insight di tab Overview
- [ ] Rate limiting per user (Free: 20 AI calls/bulan, Pro: unlimited)
