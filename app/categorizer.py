"""
app/categorizer.py — Kategorisasi transaksi dengan rule keyword + fallback AI.

Tujuan utama:
- Menurunkan porsi kategori "Lainnya"
- Menjaga kategori akhir konsisten dengan kategori frontend
- Tetap cepat: rule-based lebih dulu, AI hanya untuk kasus ambigu
"""

from __future__ import annotations

import re

import pandas as pd

# ---------------------------------------------------------------------------
# Canonical categories expected by frontend
# ---------------------------------------------------------------------------
CANONICAL_CATEGORIES: list[str] = [
    "Makan",
    "Transport",
    "Belanja",
    "Tagihan",
    "Hiburan",
    "Kesehatan",
    "Transfer",
    "Pendapatan",
    "Investasi",
    "Lainnya",
]

DEFAULT_CATEGORY = "Lainnya"
DEFAULT_TYPE_EXPENSE = "expense"
DEFAULT_TYPE_INCOME = "income"


# ---------------------------------------------------------------------------
# Keyword mapping  →  (pattern, kategori, tipe)
# Urutan penting: rule pertama yang match yang dipakai
# ---------------------------------------------------------------------------
KEYWORD_RULES: list[tuple[str, str, str]] = [
    # ── Pendapatan / Inflow
    (
        r"gaji|salary|payroll|thr|bonus|insentif|komisi|fee proyek|invoice|"
        r"freelance|dibayar|upah|pendapatan|cashback|refund|bunga|bagi hasil",
        "Pendapatan",
        "income",
    ),

    # ── Transfer (debit/kredit final type will be corrected by amount)
    (
        r"transfer|\btf\b|trf|kirim|setor|tarik tunai|ambil uang cash|atm|"
        r"biaya admin|admin fee|funds fee|provisi|qris|flip|jago|jenius|"
        r"gopay|ovo|dana|shopeepay|seabank|bca|mandiri|bri|bni",
        "Transfer",
        "expense",
    ),

    # ── Makan & minum
    (
        r"makan|sarapan|lunch|dinner|kuliner|food|gofood|grabfood|shopeefood|"
        r"resto|restoran|warung|warteg|bakso|mie|soto|seblak|martabak|"
        r"ayam|solaria|fore|kopi|coffee|matcha|durian|snack|jajan|minum",
        "Makan",
        "expense",
    ),

    # ── Transport + kendaraan
    (
        r"grab|gojek|goride|grabcar|gocar|maxim|indriver|ojol|ojek|"
        r"bensin|bbm|pertalite|pertamax|spbu|parkir|tol|toll|"
        r"oli|servis|service|bengkel|vario|motor|mobil|ban",
        "Transport",
        "expense",
    ),

    # ── Tagihan & utilitas
    (
        r"listrik|pln|token listrik|pdam|air bersih|internet|wifi|indihome|"
        r"telkom|paket data|pulsa|langganan|cicilan|angsuran|kpr|"
        r"bpjs|asuransi|premi",
        "Tagihan",
        "expense",
    ),

    # ── Kesehatan
    (
        r"obat|apotek|apotik|dokter|klinik|rumah sakit|\brs\b|"
        r"halodoc|alodokter|kimia farma|guardian|century|medical|medis",
        "Kesehatan",
        "expense",
    ),

    # ── Belanja
    (
        r"belanja|shopee|tokopedia|lazada|bukalapak|blibli|zalora|sociolla|"
        r"indomaret|alfamart|minimarket|supermarket|hypermart|carrefour|"
        r"fotokopi|korek|aksesoris|alat rumah|laundry|baju|sepatu|tas|"
        r"elektronik|gadget|barang",
        "Belanja",
        "expense",
    ),

    # ── Hiburan
    (
        r"hiburan|netflix|spotify|youtube premium|disney|hbo|steam|game|"
        r"gaming|bioskop|nonton|film|fotobooth|rekreasi|travel|wisata",
        "Hiburan",
        "expense",
    ),

    # ── Investasi
    (
        r"investasi|saham|reksa dana|reksadana|bibit|stockbit|bareksa|"
        r"crypto|bitcoin|emas|deposito|tabungan",
        "Investasi",
        "expense",
    ),
]

COMPILED_RULES: list[tuple[re.Pattern, str, str]] = [
    (re.compile(pattern, re.IGNORECASE), category, tx_type)
    for pattern, category, tx_type in KEYWORD_RULES
]


CATEGORY_ALIASES: dict[str, str] = {
    "gaji": "Pendapatan",
    "gaji & bonus": "Pendapatan",
    "refund": "Pendapatan",
    "refund & cashback": "Pendapatan",
    "bunga / bagi hasil": "Pendapatan",
    "transfer masuk": "Transfer",
    "transfer keluar": "Transfer",
    "transfer & biaya": "Transfer",
    "e-wallet": "Transfer",
    "transportasi": "Transport",
    "transportasi umum": "Transport",
    "bbm": "Transport",
    "parkir": "Transport",
    "tol": "Transport",
    "fast food": "Makan",
    "kuliner": "Makan",
    "food delivery": "Makan",
    "minimarket": "Belanja",
    "supermarket": "Belanja",
    "pasar tradisional": "Belanja",
    "belanja online": "Belanja",
    "pengiriman": "Belanja",
    "musik": "Hiburan",
    "streaming": "Hiburan",
    "gaming": "Hiburan",
    "pulsa & data": "Tagihan",
    "listrik": "Tagihan",
    "air": "Tagihan",
    "internet": "Tagihan",
    "asuransi": "Tagihan",
    "asuransi & bpjs": "Tagihan",
    "kesehatan digital": "Kesehatan",
    "pendidikan": "Belanja",
    "buku": "Belanja",
    "tabungan": "Investasi",
}


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def categorize_transactions(
    df: pd.DataFrame,
    use_ai_fallback: bool = False,
    max_ai_calls: int = 20,
) -> pd.DataFrame:
    """
    Tambahkan kolom 'kategori' dan 'tipe' ke dataframe.

    Parameters
    ----------
    df : pd.DataFrame
        Harus memiliki kolom 'deskripsi', 'debit', 'kredit'.
    use_ai_fallback : bool
        Jika True, gunakan AI untuk baris yang masih "Lainnya".
    max_ai_calls : int
        Batas maksimum panggilan AI per request supaya tetap efisien.
    """
    df = df.copy()
    df["deskripsi"] = df["deskripsi"].fillna("").astype(str)

    ai_cache: dict[str, tuple[str, str] | None] = {}
    ai_calls_left = max(0, int(max_ai_calls))
    ai_blocked = not use_ai_fallback

    def _apply_cat(row: pd.Series) -> pd.Series:
        nonlocal ai_calls_left, ai_blocked

        desc = str(row.get("deskripsi", "")).strip()
        existing_cat = _normalize_category(str(row.get("kategori", "")).strip(), desc)
        tipe = str(row.get("tipe", "")).strip().lower()

        # Rule-based first
        new_cat, new_type = _classify_single(desc)

        # AI fallback only for unresolved entries
        if new_cat == DEFAULT_CATEGORY and not ai_blocked and ai_calls_left > 0 and len(desc) >= 3:
            cache_key = desc.lower()
            ai_result = ai_cache.get(cache_key)
            if cache_key not in ai_cache:
                ai_calls_left -= 1
                ai_result = _ai_categorize_safe(desc)
                ai_cache[cache_key] = ai_result
                if ai_result is None:
                    ai_blocked = True

            if ai_result is not None:
                new_cat, new_type = ai_result

        # Existing category remains authoritative if it is meaningful
        final_cat = existing_cat if existing_cat != DEFAULT_CATEGORY else new_cat
        final_cat = _normalize_category(final_cat, desc)

        if tipe in {DEFAULT_TYPE_EXPENSE, DEFAULT_TYPE_INCOME}:
            final_type = tipe
        else:
            final_type = new_type

        return pd.Series([final_cat, final_type])

    results = df.apply(_apply_cat, axis=1)
    df[["kategori", "tipe"]] = results

    if "debit" in df.columns and "kredit" in df.columns:
        df["tipe"] = df.apply(_override_type_by_amount, axis=1)

    return df


def get_category_list() -> list[str]:
    """Kembalikan daftar kategori canonical yang dipakai UI."""
    return CANONICAL_CATEGORIES.copy()


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
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.linear_model import LogisticRegression
        from sklearn.pipeline import Pipeline
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
    if not description:
        return DEFAULT_CATEGORY, DEFAULT_TYPE_EXPENSE

    for pattern, category, tx_type in COMPILED_RULES:
        if pattern.search(description):
            return category, tx_type
    return DEFAULT_CATEGORY, DEFAULT_TYPE_EXPENSE


def _normalize_category(category: str, description: str = "") -> str:
    if not category:
        return _infer_from_text(description)

    raw = category.strip()
    lower = raw.lower()

    # Direct canonical
    for cat in CANONICAL_CATEGORIES:
        if lower == cat.lower():
            return cat

    # Exact alias
    if lower in CATEGORY_ALIASES:
        return CATEGORY_ALIASES[lower]

    # Semantic alias
    if any(k in lower for k in ["kuliner", "fast food", "food", "resto", "makan"]):
        return "Makan"
    if any(k in lower for k in ["transport", "bbm", "parkir", "tol"]):
        return "Transport"
    if any(k in lower for k in ["belanja", "market", "toko", "shopping"]):
        return "Belanja"
    if any(k in lower for k in ["tagihan", "listrik", "internet", "pulsa", "utilitas"]):
        return "Tagihan"
    if any(k in lower for k in ["hiburan", "stream", "gaming", "musik"]):
        return "Hiburan"
    if any(k in lower for k in ["kesehatan", "obat", "dokter", "klinik"]):
        return "Kesehatan"
    if any(k in lower for k in ["transfer", "trf", "wallet", "bank"]):
        return "Transfer"
    if any(k in lower for k in ["gaji", "income", "pendapatan", "bonus", "refund"]):
        return "Pendapatan"
    if any(k in lower for k in ["investasi", "saham", "reksa", "crypto", "deposito"]):
        return "Investasi"

    if lower in {"lainnya", "other"}:
        return _infer_from_text(description)

    return raw if raw in CANONICAL_CATEGORIES else _infer_from_text(description)


def _infer_from_text(text: str) -> str:
    inferred, _ = _classify_single(text)
    return inferred


def _ai_categorize_safe(description: str) -> tuple[str, str] | None:
    """
    Panggil AI sekali untuk teks ambigu.
    Return None jika AI tidak tersedia atau terjadi error.
    """
    try:
        from app.ai_service import ai_categorize
    except Exception:
        return None

    try:
        parsed = ai_categorize(description)
    except Exception:
        return None

    ai_cat = _normalize_category(str(parsed.get("kategori", "")), description)
    ai_type = str(parsed.get("tipe", DEFAULT_TYPE_EXPENSE)).strip().lower()
    if ai_type not in {DEFAULT_TYPE_EXPENSE, DEFAULT_TYPE_INCOME}:
        ai_type = DEFAULT_TYPE_EXPENSE

    return ai_cat, ai_type


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
    return row.get("tipe", DEFAULT_TYPE_EXPENSE)
