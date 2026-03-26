# Arsitektur — Personal Finance Analyzer

## High Level Flow

```
Browser (Next.js)
    → Upload CSV/XLSX
    → FastAPI (api/main.py)          ← REST API layer
        → Pipeline Orchestrator      (app/pipeline.py)
            → Ingestion Layer        (app/utils.py)
            → Categorization Engine  (app/categorizer.py)
            → Analytics Layer        (app/insights.py)
            → Forecasting Engine     (app/forecasting.py)
            → Health Score Engine    (app/health_score.py)
            → Subscription Detector  (app/subscription.py)
            → Story Generator        (app/story.py)
            → Balance Simulator      (app/simulator.py)
        → JSON response
    → React Dashboard (src/app/page.tsx)
        → KPI Cards, Charts, Health Gauge, Stories, Simulator

[Optional] Streamlit fallback (app/ui.py) — masih tersedia
```

---

## Komponen Utama

### 1. Ingestion Layer (`app/utils.py`)
- Baca CSV / XLSX dari file upload atau path lokal
- Standardisasi nama kolom (tanggal, deskripsi, debit, kredit, saldo)
- Handle missing value dan tipe data tidak konsisten
- Parse amount kolom → numeric
- Parse tanggal → datetime

### 2. Categorization Engine (`app/categorizer.py`)
- **Rule-based baseline**: keyword mapping per merchant/narasi
- Kategori utama: e-wallet, groceries, transport, food, subscription,
  utilities, health, education, salary, transfer, lainnya
- Extensible: tambah keyword tanpa ubah logika inti
- Optional: `train_simple_classifier(df)` menggunakan TF-IDF + LogisticRegression

### 3. Analytics Layer (`app/insights.py`)
- Total income vs expense
- Spending by category (aggregasi dan persentase)
- Monthly trend (income/expense per bulan)
- Top merchants berdasarkan frekuensi & nominal
- Anomaly detection (future): deteksi transaksi di luar pola normal

### 4. Forecasting Engine (`app/forecasting.py`)
- Prepare time series harian dari data transaksi
- Model: moving average (baseline) atau linear regression (scikit-learn)
- Output: prediksi saldo / net cashflow N hari ke depan

### 5. Presentation Layer (`app/ui.py`)
- Streamlit single-page app
- File uploader (CSV/XLSX)
- KPI cards: total income, total expense, net cashflow
- Interactive charts: pie kategori, bar bulanan, line forecast
- Raw data table viewer

### 6. Pipeline Orchestrator (`app/pipeline.py`)
- `run_pipeline(file)` sebagai entry point tunggal
- Mengorkestrasi semua layer secara berurutan
- Return 14-key structured dict untuk dikonsumsi API atau UI

### 7. Health Score Engine (`app/health_score.py`)
- `compute_health_score(summary, by_category, monthly)` → `HealthReport`
- 5 dimensi: rasio tabungan, konsistensi income, diversifikasi, pengeluaran diskresi, trend cashflow
- Grade A+…F dengan weighted scoring
- Auto-generate actionable tips

### 8. Subscription Detector (`app/subscription.py`)
- `detect_subscriptions(df)` → DataFrame merchant berulang
- Analisis interval transaksi (7/14/30 hari)
- Known keyword list (Netflix, Spotify, dll)
- Confidence scoring per merchant

### 9. Story Generator (`app/story.py`)
- `generate_monthly_stories(monthly, by_category)` → list narasi bulanan
- `generate_overall_story(summary, stories)` → ringkasan keseluruhan
- Template-based; siap disambung ke LLM (GPT/Ollama)
- Mood label per bulan: great/good/neutral/warning/critical

### 10. Balance Simulator (`app/simulator.py`)
- `build_category_baseline(by_category, monthly)` → baseline spending per kategori
- `simulate_balance(summary, monthly, baseline, adjustments, horizon_months)` → projected DataFrame
- `savings_impact(baseline, adjustments, horizon)` → estimasi penghematan total

### 11. REST API Layer (`api/main.py`)
- **FastAPI** server, CORS enabled untuk `http://localhost:3000`
- `GET  /health` — health check
- `GET  /analyze/sample` — analisis data sampel bawaan
- `POST /analyze` — upload CSV/XLSX, response JSON penuh
- `POST /simulate` — proyeksi saldo dengan penyesuaian kategori
- Serialisasi otomatis DataFrame → JSON-safe list[dict]

### 12. Next.js Frontend (`frontend/`)
- **Stack**: Next.js 14 App Router + TypeScript + Tailwind CSS
- **UI**: Framer Motion animations, glassmorphism cards, gradient mesh background
- **Charts**: Recharts (SSR-compatible) — AreaChart, PieChart, ComposedChart
- **State**: Custom hooks `useAnalysis` + `useSimulator`
- **Pages/Tabs**: Overview, Spending, Forecast, Health, Simulator
- **Components**: KPICards, MonthlyChart, SpendingWheel, ForecastChart, HealthGauge, TopMerchants, SubscriptionList, StoryCards, SimulatorPanel

---

## Design Principles

| Prinsip       | Implementasi                                              |
|---------------|-----------------------------------------------------------|
| Modular       | Setiap layer di file terpisah, fungsi kecil & single-responsibility |
| Explainable   | Kategorisasi berbasis keyword transparan, mudah di-audit  |
| Extensible    | Tambah kategori / model tanpa mengubah interface publik   |
| Low dependency| Hanya standar library + pandas, sklearn, streamlit, matplotlib |
| LLM-ready     | Pipeline output berupa dict/dataframe, siap disambung ke LLM prompt |

---

## Data Flow Detail

```
File (CSV/XLSX)
    │
    ▼
load_file()             → raw DataFrame
    │
normalize_columns()     → kolom standar: tanggal, deskripsi, debit, kredit
    │
parse_amount_columns()  → debit/kredit bertipe float
    │
ensure_datetime()       → tanggal bertipe datetime64
    │
categorize_transactions() → tambah kolom: kategori, tipe (expense/income)
    │
    ├── compute_summary()      → dict KPI
    ├── spending_by_category() → DataFrame pivot
    ├── monthly_trend()        → DataFrame monthly aggregation
    └── top_merchants()        → DataFrame top N
    │
prepare_timeseries()    → daily net cashflow series
    │
forecast_cashflow()     → DataFrame prediksi (tanggal + nilai)
    │
    ▼
Streamlit Dashboard
```

---

## Future: GenAI Extension Points

- **Merchant clustering**: sentence-transformers untuk embedding narasi transaksi
- **Anomaly detection**: IsolationForest atau LOF pada distribusi spending
- **LLM insight**: inject summary dict ke prompt → generate narasi keuangan otomatis
- **Budget advisor**: RL atau rule-engine berbasis insight bulanan
