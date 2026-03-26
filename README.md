# Personal Finance Analyzer

> Full-stack personal finance intelligence platform — Python FastAPI backend + Next.js frontend.

---

## Fitur Utama

- Upload CSV/XLSX mutasi rekening bank
- Auto kategorisasi transaksi (rule-based + optional ML)
- Financial Health Score (grade A+...F, 5 dimensi)
- Deteksi langganan berulang (Spotify, Netflix, dll)
- Spending story otomatis per bulan (LLM-ready)
- Simulasi saldo masa depan dengan category sliders
- Forecast cashflow (moving average / linear regression)
- Dashboard dark theme dengan glassmorphism + Framer Motion

---

## Stack Teknologi

| Layer     | Teknologi                                          |
|-----------|---------------------------------------------------|
| Backend   | Python 3.10, FastAPI, Uvicorn, pandas, scikit-learn |
| Frontend  | Next.js 14, TypeScript, Tailwind CSS, Recharts     |
| Animation | Framer Motion                                      |
| Icons     | Lucide React                                       |
| API       | REST JSON, multipart file upload                  |

---

## Cara Menjalankan

### 1. Setup Python environment

```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
# Linux/macOS
source .venv/bin/activate

pip install -r requirements.txt
```

### 2. Jalankan FastAPI backend

```bash
uvicorn api.main:app --reload --port 8000
```

API tersedia di `http://localhost:8000`  
Docs Swagger: `http://localhost:8000/docs`

### 3. Jalankan Next.js frontend

```bash
cd frontend
npm install
npm run dev
```

Buka `http://localhost:3000`

### 4. (Opsional) Streamlit fallback

```bash
streamlit run app/ui.py
```

---

## Format Data Input

File CSV atau XLSX dengan minimal kolom berikut:

| Kolom      | Keterangan                          |
|------------|-------------------------------------|
| `tanggal`  | Tanggal transaksi (format bebas)    |
| `deskripsi`| Keterangan / merchant / narasi      |
| `debit`    | Jumlah keluar (angka, tanpa simbol) |
| `kredit`   | Jumlah masuk (angka, tanpa simbol)  |
| `saldo`    | Saldo akhir (opsional)              |

> Nama kolom tidak case-sensitive. Kolom dengan nama serupa akan dinormalisasi otomatis.

Contoh file sample tersedia di `data/sample/sample_mutasi.csv`.

---

## Struktur Project

```
finance-analyzer/
│
├── app/
│   ├── ui.py           # Streamlit UI
│   ├── pipeline.py     # Orchestrator utama
│   ├── categorizer.py  # Kategorisasi transaksi
│   ├── insights.py     # Analytics & summary
│   ├── forecasting.py  # Prediksi cashflow
│   └── utils.py        # Cleaning & helper
│
├── data/
│   ├── sample/         # Contoh file mutasi
│   └── processed/      # Output pipeline
│
├── models/             # ML model artifacts
│
├── docs/
│   ├── checkpoint.md
│   ├── arsitektur.md
│   └── roadmap.md
│
├── README.md
├── requirements.txt
└── run.py
```

---

## Contoh Use Case

- Tracking pengeluaran bulanan
- Budgeting & financial discipline
- Financial storytelling untuk presentasi
- Portfolio project Data / ML / GenAI Engineer

---

## Tech Stack

| Komponen     | Library              |
|--------------|----------------------|
| Data wrangling | pandas, numpy      |
| ML classifier  | scikit-learn       |
| Visualisasi    | matplotlib         |
| UI             | Streamlit          |
| File parsing   | openpyxl           |

---

## Roadmap

Lihat `docs/roadmap.md` untuk rencana pengembangan jangka pendek, menengah, dan panjang (GenAI-ready).
