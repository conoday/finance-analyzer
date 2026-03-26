"""
app/insights.py — Analytics & insight generator untuk Personal Finance Analyzer.

Semua fungsi menerima dataframe yang sudah dikategorisasi
dan mengembalikan dataframe / dict siap visualisasi.
"""

from __future__ import annotations

from typing import Any

import pandas as pd


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def compute_summary(df: pd.DataFrame) -> dict[str, Any]:
    """
    Hitung KPI utama dari dataframe transaksi.

    Returns
    -------
    dict dengan keys:
        total_income, total_expense, net_cashflow,
        tx_count, income_count, expense_count,
        avg_expense, avg_income, date_range
    """
    _validate(df)

    income_df = df[df["tipe"] == "income"]
    expense_df = df[df["tipe"] == "expense"]

    total_income = income_df["kredit"].sum() if "kredit" in df.columns else 0.0
    total_expense = expense_df["debit"].sum() if "debit" in df.columns else 0.0

    return {
        "total_income": float(total_income),
        "total_expense": float(total_expense),
        "net_cashflow": float(total_income - total_expense),
        "tx_count": len(df),
        "income_count": len(income_df),
        "expense_count": len(expense_df),
        "avg_expense": float(expense_df["debit"].mean()) if len(expense_df) > 0 and "debit" in df.columns else 0.0,
        "avg_income": float(income_df["kredit"].mean()) if len(income_df) > 0 and "kredit" in df.columns else 0.0,
        "date_range": _date_range(df),
    }


def spending_by_category(df: pd.DataFrame) -> pd.DataFrame:
    """
    Hitung total pengeluaran per kategori.

    Returns
    -------
    DataFrame dengan kolom: kategori, total, pct
    Diurutkan dari terbesar ke terkecil.
    """
    _validate(df)

    expense_df = df[df["tipe"] == "expense"].copy()
    if expense_df.empty or "debit" not in expense_df.columns:
        return pd.DataFrame(columns=["kategori", "total", "pct"])

    grouped = (
        expense_df.groupby("kategori", as_index=False)["debit"]
        .sum()
        .rename(columns={"debit": "total"})
        .sort_values("total", ascending=False)
        .reset_index(drop=True)
    )
    grand_total = grouped["total"].sum()
    grouped["pct"] = (grouped["total"] / grand_total * 100).round(1) if grand_total > 0 else 0.0
    return grouped


def monthly_trend(df: pd.DataFrame) -> pd.DataFrame:
    """
    Hitung income dan expense per bulan.

    Returns
    -------
    DataFrame dengan kolom: periode (YYYY-MM), income, expense, net
    """
    _validate(df)

    df = df.copy()
    df["periode"] = df["tanggal"].dt.to_period("M").astype(str)

    income = (
        df[df["tipe"] == "income"]
        .groupby("periode")["kredit"]
        .sum()
        .rename("income")
    ) if "kredit" in df.columns else pd.Series(dtype=float, name="income")

    expense = (
        df[df["tipe"] == "expense"]
        .groupby("periode")["debit"]
        .sum()
        .rename("expense")
    ) if "debit" in df.columns else pd.Series(dtype=float, name="expense")

    trend = pd.concat([income, expense], axis=1).fillna(0).reset_index()
    trend.columns = ["periode", "income", "expense"]
    trend["net"] = trend["income"] - trend["expense"]
    trend = trend.sort_values("periode").reset_index(drop=True)
    return trend


def top_merchants(df: pd.DataFrame, n: int = 10) -> pd.DataFrame:
    """
    Merchant / narasi dengan pengeluaran terbesar.

    Returns
    -------
    DataFrame dengan kolom: deskripsi, jumlah_transaksi, total_debit
    """
    _validate(df)

    expense_df = df[df["tipe"] == "expense"].copy()
    if expense_df.empty or "debit" not in expense_df.columns:
        return pd.DataFrame(columns=["deskripsi", "jumlah_transaksi", "total_debit"])

    result = (
        expense_df.groupby("deskripsi")
        .agg(
            jumlah_transaksi=("deskripsi", "count"),
            total_debit=("debit", "sum"),
        )
        .sort_values("total_debit", ascending=False)
        .head(n)
        .reset_index()
    )
    return result


def income_sources(df: pd.DataFrame, n: int = 5) -> pd.DataFrame:
    """
    Sumber income terbesar.

    Returns
    -------
    DataFrame dengan kolom: deskripsi, jumlah_transaksi, total_kredit
    """
    _validate(df)

    income_df = df[df["tipe"] == "income"].copy()
    if income_df.empty or "kredit" not in income_df.columns:
        return pd.DataFrame(columns=["deskripsi", "jumlah_transaksi", "total_kredit"])

    result = (
        income_df.groupby("deskripsi")
        .agg(
            jumlah_transaksi=("deskripsi", "count"),
            total_kredit=("kredit", "sum"),
        )
        .sort_values("total_kredit", ascending=False)
        .head(n)
        .reset_index()
    )
    return result


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _validate(df: pd.DataFrame) -> None:
    required = {"tanggal", "tipe"}
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"DataFrame kurang kolom: {missing}. Pastikan pipeline sudah dijalankan.")


def _date_range(df: pd.DataFrame) -> str:
    if "tanggal" not in df.columns or df["tanggal"].isna().all():
        return "N/A"
    start = df["tanggal"].min().strftime("%d %b %Y")
    end = df["tanggal"].max().strftime("%d %b %Y")
    return f"{start} – {end}"
