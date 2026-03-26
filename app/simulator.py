"""
app/simulator.py — Future Balance Simulator.

Memungkinkan user menyesuaikan pengeluaran per kategori (via slider)
dan melihat proyeksi saldo ke depan tanpa mengubah data asli.

Semua kalkulasi murni — tidak ada side effect.
"""

from __future__ import annotations

import pandas as pd
import numpy as np


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def build_category_baseline(
    by_category: pd.DataFrame,
    monthly: pd.DataFrame,
) -> dict[str, float]:
    """
    Bangun baseline pengeluaran rata-rata per bulan per kategori.

    Returns
    -------
    dict {kategori: avg_monthly_amount}
    """
    if by_category.empty or monthly.empty:
        return {}

    months = max(len(monthly), 1)
    baseline: dict[str, float] = {}
    for _, row in by_category.iterrows():
        cat = str(row["kategori"])
        total = float(row["total"])
        baseline[cat] = round(total / months, 0)

    return baseline


def simulate_balance(
    summary: dict,
    monthly: pd.DataFrame,
    baseline: dict[str, float],
    adjustments: dict[str, float],
    horizon_months: int = 6,
) -> pd.DataFrame:
    """
    Proyeksikan saldo ke depan berdasarkan baseline + adjustments.

    Parameters
    ----------
    summary         : output dari insights.compute_summary
    monthly         : output dari insights.monthly_trend
    baseline        : dict {kategori: avg_monthly_amount}
    adjustments     : dict {kategori: multiplier}  e.g. {"Food Delivery": 0.5} = kurang 50%
    horizon_months  : jumlah bulan ke depan

    Returns
    -------
    DataFrame dengan kolom: bulan, projected_expense, projected_income,
                            projected_net, projected_cumulative
    """
    months = max(len(monthly), 1)
    avg_income = summary.get("total_income", 0) / months if months > 0 else 0

    # Hitung monthly expense dengan penyesuaian
    adjusted_expense = sum(
        baseline.get(cat, 0) * adjustments.get(cat, 1.0)
        for cat in baseline
    )

    # Ambil saldo terakhir sebagai starting point (opsional: dari summary)
    last_net = summary.get("net_cashflow", 0)
    if not monthly.empty:
        start_cumulative = float(monthly["net"].sum())
    else:
        start_cumulative = float(last_net)

    # Buat proyeksi
    rows: list[dict] = []
    cumulative = start_cumulative

    import calendar
    from datetime import date

    today = pd.Timestamp.today()
    for i in range(1, horizon_months + 1):
        month_offset = today.month + i - 1
        year = today.year + (month_offset // 12)
        month = (month_offset % 12) or 12
        bulan_label = f"{year}-{month:02d}"

        net = avg_income - adjusted_expense
        cumulative += net
        rows.append({
            "bulan": bulan_label,
            "projected_income": round(avg_income, 0),
            "projected_expense": round(adjusted_expense, 0),
            "projected_net": round(net, 0),
            "projected_cumulative": round(cumulative, 0),
        })

    return pd.DataFrame(rows)


def savings_impact(
    baseline: dict[str, float],
    adjustments: dict[str, float],
    horizon_months: int,
) -> dict[str, float]:
    """
    Hitung dampak penghematan dari adjustments.

    Returns dict:
        monthly_saving: selisih expense bulanan sebelum vs sesudah
        total_saving: penghematan kumulatif selama horizon
        pct_reduction: persentase pengurangan expense
    """
    original = sum(baseline.values())
    adjusted = sum(
        baseline.get(cat, 0) * adjustments.get(cat, 1.0)
        for cat in baseline
    )
    monthly_saving = original - adjusted
    total_saving = monthly_saving * horizon_months
    pct_reduction = (monthly_saving / original * 100) if original > 0 else 0.0

    return {
        "monthly_saving": round(monthly_saving, 0),
        "total_saving": round(total_saving, 0),
        "pct_reduction": round(pct_reduction, 1),
    }
