"""
app/categorizer.py — Kategorisasi transaksi berbasis keyword.

Desain:
- Rule-based baseline: cepat, transparan, extensible
- Optional: ML classifier menggunakan TF-IDF + LogisticRegression
"""

from __future__ import annotations

import re
from typing import Optional

import pandas as pd

# ---------------------------------------------------------------------------
# Keyword mapping  →  (pattern, kategori, tipe)
# Urutan penting: rule pertama yang match yang dipakai
# ---------------------------------------------------------------------------
KEYWORD_RULES: list[tuple[str, str, str]] = [
    # ── Income / Pemasukan ──────────────────────────────────────────────────
    (r"gaji|salary|payroll|thr|bonus", "Gaji & Bonus", "income"),
    (r"transfer masuk|trfmasuk|cr transfer|incoming", "Transfer Masuk", "income"),
    (r"bunga|interest|bagi hasil", "Bunga / Bagi Hasil", "income"),
    (r"cashback|refund|pengembalian", "Refund & Cashback", "income"),

    # ── E-Wallet & Digital Payment ──────────────────────────────────────────
    (r"gopay|ovo|dana|link\s*aja|shopeepay|jenius|flip|sakuku", "E-Wallet", "expense"),

    # ── Transport ──────────────────────────────────────────────────────────
    (r"grab|gojek|goride|grabcar|gocar|maxim|indriver|ojol|ojek", "Transportasi", "expense"),
    (r"krl|mrt|lrt|transjakarta|busway|kereta|commuter|kai\s*access", "Transportasi Umum", "expense"),
    (r"bbm|bensin|spbu|pertamina|pertalite|pertamax|shell", "BBM", "expense"),
    (r"parkir|park", "Parkir", "expense"),
    (r"toll|tol|e-toll|etoll|brizzi", "Tol", "expense"),

    # ── Food & Beverage ────────────────────────────────────────────────────
    (r"mcd|mcdonalds|kfc|burger king|wendys|pizza hut|domino|subway", "Fast Food", "expense"),
    (r"starbucks|kenangan|janji jiwa|kopi|coffee|bakso|warung|warteg|mie ayam", "Kuliner", "expense"),
    (r"gofood|grabfood|shopeefood|foodpanda|traveloka eats", "Food Delivery", "expense"),

    # ── Groceries / Belanja Harian ─────────────────────────────────────────
    (r"indomaret|alfamart|lawson|circle\s*k|711|seven\s*eleven|minimart", "Minimarket", "expense"),
    (r"hypermart|carrefour|giant|lottemart|superindo|hero|transmart|ranch market", "Supermarket", "expense"),
    (r"pasar|traditional market|toko sembako", "Pasar Tradisional", "expense"),

    # ── Subscription & Entertainment ───────────────────────────────────────
    (r"spotify|apple\s*music|joox|youtube\s*premium|deezer|tidal", "Musik", "expense"),
    (r"netflix|disney\+|vidio|viu|wetv|prime\s*video|hbo|mola", "Streaming", "expense"),
    (r"steam|epic\s*games|playstation|xbox|nintendo|mobile\s*legend|pubg|freefire", "Gaming", "expense"),

    # ── Utilities / Tagihan ────────────────────────────────────────────────
    (r"pln|listrik|electricity|token\s*listrik", "Listrik", "expense"),
    (r"pdam|air\s*bersih|water", "Air", "expense"),
    (r"telkom|indihome|firstmedia|xlhome|wifi|internet|broadband", "Internet", "expense"),
    (r"telkomsel|xl|indosat|tri\s*|axis\s*|smartfren|pulsa|paket\s*data|top\s*up\s*pulsa", "Pulsa & Data", "expense"),
    (r"bpjs|asuransi|insurance|premi", "Asuransi & BPJS", "expense"),

    # ── Kesehatan ──────────────────────────────────────────────────────────
    (r"apotik|apotek|kimia\s*farma|century|guardian|rumah\s*sakit|klinik|dokter|rs\s+", "Kesehatan", "expense"),
    (r"halodoc|alodokter|good\s*doctor|getwell|sehat", "Kesehatan Digital", "expense"),

    # ── Pendidikan ─────────────────────────────────────────────────────────
    (r"spp|ukt|uang\s*sekolah|kursus|les|bimbel|udemy|coursera|skillshare|ruangguru", "Pendidikan", "expense"),
    (r"buku|toko\s*buku|gramedia|periplus", "Buku", "expense"),

    # ── Belanja Online ─────────────────────────────────────────────────────
    (r"tokopedia|shopee|lazada|bukalapak|blibli|jd\.id|zalora|sociolla", "Belanja Online", "expense"),
    (r"jne|jnt|j&t|sicepat|anteraja|pos\s*indonesia|gosend|grab\s*express", "Pengiriman", "expense"),

    # ── Properti & Kos ─────────────────────────────────────────────────────
    (r"kos|kontrakan|sewa|rent|cicilan\s*rumah|kpr|dp\s*rumah", "Sewa & Properti", "expense"),

    # ── Investasi & Tabungan ───────────────────────────────────────────────
    (r"bibit|stockbit|bareksa|ipot|idx|saham|reksa\s*dana|emas|logam\s*mulia", "Investasi", "expense"),
    (r"tabungan|deposito|saving", "Tabungan", "expense"),

    # ── Transfer Keluar ────────────────────────────────────────────────────
    (r"transfer|trf|trfkeluar|biaya\s*admin|admin\s*fee|provisi", "Transfer & Biaya", "expense"),
]

COMPILED_RULES: list[tuple[re.Pattern, str, str]] = [
    (re.compile(pattern, re.IGNORECASE), category, tx_type)
    for pattern, category, tx_type in KEYWORD_RULES
]

DEFAULT_CATEGORY = "Lainnya"
DEFAULT_TYPE_EXPENSE = "expense"
DEFAULT_TYPE_INCOME = "income"


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def categorize_transactions(df: pd.DataFrame) -> pd.DataFrame:
    """
    Tambahkan kolom 'kategori' dan 'tipe' ke dataframe.

    Parameters
    ----------
    df : pd.DataFrame
        Harus memiliki kolom 'deskripsi', 'debit', 'kredit'.

    Returns
    -------
    pd.DataFrame dengan kolom tambahan: kategori, tipe
    """
    df = df.copy()
    df["deskripsi"] = df["deskripsi"].fillna("").astype(str)

    def _apply_cat(row):
        existing_cat = str(row.get("kategori", "")).strip()
        tipe = str(row.get("tipe", "")).strip()
        desc = str(row.get("deskripsi", ""))
        
        # Determine new category & type
        new_cat, new_type = _classify_single(desc)
        
        # Override only if missing or "Lainnya"
        final_cat = existing_cat if existing_cat and existing_cat.lower() != "lainnya" else new_cat
        final_type = tipe if tipe else new_type
        
        return pd.Series([final_cat, final_type])

    # df["kategori"] has been aliased to "category_raw" previously
    # Apply category logic row by row
    results = df.apply(_apply_cat, axis=1)
    df[["kategori", "tipe"]] = results

    # Override tipe berdasarkan nilai debit/kredit jika tersedia
    if "debit" in df.columns and "kredit" in df.columns:
        df["tipe"] = df.apply(_override_type_by_amount, axis=1)

    return df


def get_category_list() -> list[str]:
    """Kembalikan daftar kategori yang tersedia."""
    seen: list[str] = []
    for _, cat, _ in KEYWORD_RULES:
        if cat not in seen:
            seen.append(cat)
    seen.append(DEFAULT_CATEGORY)
    return seen


# ---------------------------------------------------------------------------
# Optional: simple ML classifier
# ---------------------------------------------------------------------------

def train_simple_classifier(df: pd.DataFrame):
    """
    Latih TF-IDF + LogisticRegression dari dataframe yang sudah dikategorisasi.

    Returns
    -------
    sklearn Pipeline (atau None jika data tidak cukup)
    """
    try:
        from sklearn.linear_model import LogisticRegression
        from sklearn.pipeline import Pipeline
        from sklearn.feature_extraction.text import TfidfVectorizer
    except ImportError:
        return None

    df = df.dropna(subset=["deskripsi", "kategori"])
    if len(df) < 20:
        return None

    X = df["deskripsi"].astype(str)
    y = df["kategori"]

    clf = Pipeline([
        ("tfidf", TfidfVectorizer(analyzer="word", ngram_range=(1, 2), min_df=1)),
        ("clf", LogisticRegression(max_iter=500, C=1.0)),
    ])
    clf.fit(X, y)
    return clf


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _classify_single(description: str) -> tuple[str, str]:
    """Klasifikasikan satu deskripsi. Return (kategori, tipe)."""
    for pattern, category, tx_type in COMPILED_RULES:
        if pattern.search(description):
            return category, tx_type
    return DEFAULT_CATEGORY, DEFAULT_TYPE_EXPENSE


def _override_type_by_amount(row: pd.Series) -> str:
    """
    Gunakan nilai debit/kredit untuk memverifikasi tipe transaksi.
    Jika kredit > 0 dan debit == 0 → income; sebaliknya → expense.
    """
    debit = float(row.get("debit", 0) or 0)
    kredit = float(row.get("kredit", 0) or 0)
    if kredit > 0 and debit == 0:
        return DEFAULT_TYPE_INCOME
    if debit > 0:
        return DEFAULT_TYPE_EXPENSE
    # Pertahankan hasil rule-based
    return row.get("tipe", DEFAULT_TYPE_EXPENSE)
