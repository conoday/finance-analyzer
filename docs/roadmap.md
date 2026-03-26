# Roadmap — Personal Finance Analyzer

## Phase 1 — Core Pipeline (Done)

- [x] Rule-based categorization (keyword mapping)
- [x] CSV & XLSX ingestion with auto column normalization
- [x] Simple forecasting (moving average / linear regression)
- [x] Sample data generator (91 synthetic transactions)
- [x] Streamlit dashboard (dark theme, 5 tabs)

## Phase 2 — Product-Grade Intelligence (Done)

- [x] Financial Health Score engine (5 dimensions, grade A+...F)
- [x] Subscription / recurring payment detector (+confidence scoring)
- [x] Monthly spending story generator (LLM-ready templates)
- [x] Balance simulator (category-adjustable savings projection)
- [x] Pipeline orchestrator with 9 steps, 14-key output contract

## Phase 3 — Full-Stack (Done)

- [x] FastAPI REST backend (`api/main.py`) with 4 endpoints
- [x] Next.js 14 frontend with App Router + TypeScript
- [x] Dark theme + glassmorphism + gradient mesh background
- [x] Framer Motion animations throughout
- [x] Recharts interactive dashboards (Area, Pie, Composed)
- [x] Simulator panel with per-category sliders
- [x] Custom React hooks (`useAnalysis`, `useSimulator`)
- [x] TypeScript types aligned to pipeline data contract

## Mid Term

- [ ] ML transaction classifier (TF-IDF + LogisticRegression, trainable per user)
- [ ] Anomaly detection (IsolationForest pada distribusi pengeluaran)
- [ ] Budget recommendation (rule-engine berbasis rata-rata bulanan)
- [ ] Multi-bank format support (BCA, Mandiri, BRI, BNI auto-detect)
- [ ] SQLite/PostgreSQL persistence (simpan riwayat analisis)
- [ ] Export laporan PDF / Excel
- [ ] Docker Compose production stack

## Long Term — GenAI Ready

- [ ] **Ask Your Finance** -- chat with your data menggunakan local LLM (Ollama + LangChain)
- [ ] **Auto Financial Advisor** -- generate rekomendasi tabungan & investasi
- [ ] **Semantic Merchant Clustering** -- embedding narasi transaksi + UMAP clustering
- [ ] **Smart Saving Recommendation** -- analisis pola untuk suggestion otomatis
- [ ] **Auto Narrative (LLM)** -- replace template story dengan GPT / Ollama generation
- [ ] **Multi-user mode** -- login sederhana + isolated data per user

---

> Roadmap ini dirancang agar setiap phase bisa di-demo secara independen sebagai portfolio project.
