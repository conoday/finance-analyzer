"""
app/utils.py — Ingestion & cleaning utilities for Personal Finance Analyzer.

Semua logic pembersihan data dipusatkan di sini agar mudah di-test & di-reuse.
"""

from __future__ import annotations

import io
import re
from pathlib import Path
from typing import Union

import numpy as np
import pandas as pd

# ---------------------------------------------------------------------------
# Column name aliases — map variasi nama kolom ke nama standar
# ---------------------------------------------------------------------------
COLUMN_ALIASES: dict[str, list[str]] = {
    "tanggal": [
        "tanggal", "date", "tgl", "transaction_date", "trans_date",
        "posting_date", "waktu", "timestamp",
    ],
    "deskripsi": [
        "deskripsi", "description", "keterangan", "narasi", "ket",
        "remark", "remarks", "merchant", "transaction_description",
        "uraian",
    ],
    "debit": [
        "debit", "db", "pengeluaran", "keluar", "withdrawal",
        "debet", "dr",
    ],
    "kredit": [
        "kredit", "cr", "pemasukan", "masuk", "deposit",
        "credit",
    ],
    "saldo": [
        "saldo", "balance", "saldo_akhir", "running_balance",
        "ending_balance",
    ],
}


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def load_file(path_or_buffer: Union[str, Path, io.BytesIO, io.StringIO]) -> pd.DataFrame:
    """
    Load CSV atau XLSX dari file path atau buffer (misal Streamlit UploadedFile).

    Returns
    -------
    pd.DataFrame  — raw dataframe belum dinormalisasi
    """
    if isinstance(path_or_buffer, (str, Path)):
        path_or_buffer = Path(path_or_buffer)
        suffix = path_or_buffer.suffix.lower()
    elif hasattr(path_or_buffer, "name"):  # Streamlit UploadedFile
        suffix = Path(path_or_buffer.name).suffix.lower()
    else:
        # Try CSV as default fallback
        suffix = ".csv"

    if suffix in {".xlsx", ".xls"}:
        df = pd.read_excel(path_or_buffer, dtype=str)
    else:
        # Try beberapa separator umum
        if isinstance(path_or_buffer, (str, Path)):
            raw = Path(path_or_buffer).read_text(encoding="utf-8", errors="replace")
        else:
            path_or_buffer.seek(0)
            raw = path_or_buffer.read()
            if isinstance(raw, bytes):
                raw = raw.decode("utf-8", errors="replace")
            path_or_buffer.seek(0)

        sep = ";" if raw.count(";") > raw.count(",") else ","
        if isinstance(path_or_buffer, (str, Path)):
            df = pd.read_csv(path_or_buffer, sep=sep, dtype=str, encoding="utf-8")
        else:
            df = pd.read_csv(path_or_buffer, sep=sep, dtype=str, encoding="utf-8")

    # Strip whitespace dari nama kolom
    df.columns = [str(c).strip() for c in df.columns]
    return df


def normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    """
    Rename kolom ke nama standar berdasarkan COLUMN_ALIASES.

    Kolom yang tidak dikenali dibiarkan apa adanya.
    Menjamin kolom wajib (tanggal, deskripsi, debit, kredit) ada — jika tidak
    ditemukan, akan dibuat kosong agar pipeline tidak crash.
    """
    df = df.copy()
    lower_map = {c.lower(): c for c in df.columns}

    rename_map: dict[str, str] = {}
    for standard, aliases in COLUMN_ALIASES.items():
        for alias in aliases:
            if alias in lower_map and standard not in rename_map.values():
                rename_map[lower_map[alias]] = standard
                break

    df = df.rename(columns=rename_map)

    # Pastikan kolom wajib ada
    for required in ("tanggal", "deskripsi", "debit", "kredit"):
        if required not in df.columns:
            df[required] = np.nan

    return df


def parse_amount_columns(df: pd.DataFrame) -> pd.DataFrame:
    """
    Konversi kolom debit, kredit, dan saldo ke float.

    Menangani:
    - Pemisah ribuan (. atau ,)
    - Simbol mata uang (Rp, IDR, $, dll.)
    - Nilai kosong → 0.0
    """
    df = df.copy()
    amount_cols = [c for c in ("debit", "kredit", "saldo") if c in df.columns]

    for col in amount_cols:
        df[col] = df[col].apply(_clean_amount)

    return df


def ensure_datetime(df: pd.DataFrame) -> pd.DataFrame:
    """
    Parse kolom 'tanggal' ke datetime64.

    Mencoba inferensi format otomatis dengan fallback ke dayfirst=True
    (format Indonesia DD/MM/YYYY).
    """
    df = df.copy()
    if "tanggal" not in df.columns:
        return df

        # Suppress UserWarning by using format="mixed" for modern Pandas
    import warnings
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        df["tanggal"] = pd.to_datetime(
            df["tanggal"],
            dayfirst=True,
            errors="coerce",
        )
    # Hapus baris dengan tanggal tidak valid
    invalid = df["tanggal"].isna().sum()
    if invalid > 0:
        df = df.dropna(subset=["tanggal"])

    df = df.sort_values("tanggal").reset_index(drop=True)
    return df


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _clean_amount(value: object) -> float:
    """Bersihkan satu nilai amount ke float.

    Menangani format Indonesia:
    - 1.234.567     → 1234567   (titik = ribuan, tanpa desimal)
    - 1.234.567,89  → 1234567.89 (titik ribuan, koma desimal)
    - 1,234,567     → 1234567   (koma = ribuan, US style)
    - 1,234,567.89  → 1234567.89 (koma ribuan, titik desimal)
    - 50.000        → 50000     (titik = ribuan tanpa desimal)
    - 50,5 / 50.5   → 50.5      (koma/titik desimal, 1-2 digit)
    """
    if pd.isna(value) or value == "" or value is None:
        return 0.0
    text = str(value).strip()

    # ── Hapus simbol mata uang (Rp, IDR, $, €, £) dan spasi ──
    text = re.sub(r"\bRp\.?\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\bIDR\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"[$€£\s]", "", text)

    if not text or text in {"-", "+"}:
        return 0.0

    # Tangani tanda negatif di depan atau belakang
    negative = text.startswith("-") or text.endswith("-")
    text = text.strip("-+")

    # ── Deteksi format angka ──

    dot_count   = text.count(".")
    comma_count = text.count(",")

    if dot_count >= 2:
        # "1.234.567" atau "1.234.567,89" → titik adalah pemisah ribuan
        if comma_count == 1:
            # "1.234.567,89"
            text = text.replace(".", "").replace(",", ".")
        else:
            # "1.234.567"
            text = text.replace(".", "")

    elif comma_count >= 2:
        # "1,234,567" atau "1,234,567.89" → koma adalah pemisah ribuan
        text = text.replace(",", "")

    elif dot_count == 1 and comma_count == 1:
        # Kedua ada — tentukan mana ribuan vs desimal dari posisi
        dot_pos   = text.index(".")
        comma_pos = text.index(",")
        if dot_pos < comma_pos:
            # "1.234,56" → titik ribuan, koma desimal (Indonesia)
            text = text.replace(".", "").replace(",", ".")
        else:
            # "1,234.56" → koma ribuan, titik desimal (US)
            text = text.replace(",", "")

    elif dot_count == 1 and comma_count == 0:
        # "50.000" atau "50.5"?
        after_dot = text.split(".")[-1]
        if len(after_dot) == 3 and after_dot.isdigit() and text.replace(".", "").isdigit():
            # "50.000" → ribuan (bukan desimal)
            text = text.replace(".", "")
        # else "50.5" → biarkan, float() akan handle

    elif comma_count == 1 and dot_count == 0:
        # "50,000" atau "50,5"?
        after_comma = text.split(",")[-1]
        if len(after_comma) == 3 and after_comma.isdigit():
            # "50,000" → ribuan
            text = text.replace(",", "")
        else:
            # "50,5" → desimal
            text = text.replace(",", ".")

    try:
        result = float(text)
        return -result if negative else result
    except ValueError:
        return 0.0
