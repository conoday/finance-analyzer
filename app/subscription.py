"""
app/subscription.py — Subscription & recurring charge detector.

Algoritma:
1. Filter transaksi expense.
2. Bersihkan deskripsi (buang angka/kode unik) untuk canonical merchant name.
3. Group by canonical merchant.
4. Deteksi recurring: transaksi yang muncul minimal 2× dengan interval ≈30 hari
   atau jumlah amount yang sama.
5. Kembalikan DataFrame subscriptions dengan estimasi biaya bulanan.
"""

from __future__ import annotations

import re
from typing import Any

import numpy as np
import pandas as pd


# ---------------------------------------------------------------------------
# Known subscription keywords (untuk boost confidence)
# ---------------------------------------------------------------------------
SUBSCRIPTION_KEYWORDS = re.compile(
    r"spotify|netflix|disney|youtube\s*premium|prime\s*video|vidio|viu|wetv|hbo|mola"
    r"|apple\s*music|joox|deezer|tidal"
    r"|steam|xbox\s*game|playstation\s*plus|nintendo"
    r"|indihome|firstmedia|xlhome|biznet"
    r"|icloud|google\s*one|dropbox|canva\s*pro"
    r"|notion|zoom|slack|adobe"
    r"|coursera|udemy|skillshare|masterclass|ruangguru",
    re.IGNORECASE,
)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def detect_subscriptions(df: pd.DataFrame) -> pd.DataFrame:
    """
    Deteksi transaksi berulang / langganan dari dataframe transaksi.

    Parameters
    ----------
    df : DataFrame dengan kolom tanggal, deskripsi, debit, tipe

    Returns
    -------
    DataFrame dengan kolom:
        merchant, kategori, amount_tipikal, frekuensi, interval_hari,
        estimated_monthly, confidence, is_known_sub
    """
    if df.empty or "debit" not in df.columns:
        return _empty_df()

    expense = df[df["tipe"] == "expense"].copy()
    expense = expense[expense["debit"] > 0]
    if expense.empty:
        return _empty_df()

    expense["canonical"] = expense["deskripsi"].apply(_canonicalize)

    groups = expense.groupby("canonical")
    results: list[dict[str, Any]] = []

    for merchant, grp in groups:
        if len(grp) < 2:
            continue

        grp = grp.sort_values("tanggal")
        intervals = grp["tanggal"].diff().dt.days.dropna().values

        if len(intervals) == 0:
            continue

        median_interval = float(np.median(intervals))
        amount_std = grp["debit"].std()
        amount_mean = grp["debit"].mean()

        # Recurring jika interval 20–40 hari (monthly) atau 6–10 hari (weekly)
        is_monthly = 20 <= median_interval <= 40
        is_weekly = 6 <= median_interval <= 10
        # Atau amount sangat konsisten (std < 5% dari mean)
        is_consistent_amount = amount_std < (amount_mean * 0.05) if amount_mean > 0 else False
        is_known = bool(SUBSCRIPTION_KEYWORDS.search(str(merchant)))

        if not (is_monthly or is_weekly or (is_consistent_amount and len(grp) >= 2)):
            continue

        confidence = _confidence(is_monthly, is_weekly, is_consistent_amount, is_known, len(grp))
        if confidence < 0.3:
            continue

        if is_weekly:
            estimated_monthly = amount_mean * 4.33
        else:
            estimated_monthly = amount_mean

        results.append({
            "merchant": str(merchant),
            "kategori": grp["kategori"].mode().iloc[0] if "kategori" in grp.columns else "Lainnya",
            "amount_tipikal": round(amount_mean, 0),
            "frekuensi": len(grp),
            "interval_hari": round(median_interval, 0),
            "estimated_monthly": round(estimated_monthly, 0),
            "confidence": round(confidence, 2),
            "is_known_sub": is_known,
        })

    if not results:
        return _empty_df()

    result_df = (
        pd.DataFrame(results)
        .sort_values("estimated_monthly", ascending=False)
        .reset_index(drop=True)
    )
    return result_df


def total_monthly_subscription(subscriptions: pd.DataFrame) -> float:
    """Estimasi total biaya langganan per bulan."""
    if subscriptions.empty or "estimated_monthly" not in subscriptions.columns:
        return 0.0
    return float(subscriptions["estimated_monthly"].sum())


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _canonicalize(text: str) -> str:
    """
    Bersihkan deskripsi: buang angka acak, kode referensi, dan whitespace berlebih.
    Sisakan nama merchant yang bisa di-group.
    """
    text = str(text).upper().strip()
    # Buang kode referensi umum (angka panjang, UUID, dsb.)
    text = re.sub(r"\b\d{6,}\b", "", text)
    # Buang tanggal
    text = re.sub(r"\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b", "", text)
    # Buang karakter khusus kecuali huruf dan spasi
    text = re.sub(r"[^A-Z\s]", "", text)
    # Ambil 3 kata pertama (nama merchant biasanya di awal)
    words = text.split()[:3]
    return " ".join(words).strip()


def _confidence(is_monthly: bool, is_weekly: bool, is_consistent: bool, is_known: bool, count: int) -> float:
    score = 0.0
    if is_monthly:
        score += 0.40
    if is_weekly:
        score += 0.25
    if is_consistent:
        score += 0.20
    if is_known:
        score += 0.30
    # Lebih banyak kemunculan → lebih yakin
    score += min(0.20, count * 0.04)
    return min(score, 1.0)


def _empty_df() -> pd.DataFrame:
    return pd.DataFrame(columns=[
        "merchant", "kategori", "amount_tipikal", "frekuensi",
        "interval_hari", "estimated_monthly", "confidence", "is_known_sub",
    ])
