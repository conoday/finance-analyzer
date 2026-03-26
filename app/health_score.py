"""
app/health_score.py — Budget Health Score engine.

Menghitung skor keuangan 0–100 dari beberapa dimensi:
  1. Savings Rate        — net / income
  2. Expense Ratio       — expense / income
  3. Subscription Burden — subscription spend / income
  4. Cashflow Trend      — apakah net cashflow bulanan membaik?
  5. Diversity Penalty   — terlalu banyak kategori lainnya = kurang terkontrol

Setiap dimensi dikembalikan sehingga UI bisa menampilkan breakdown.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

import numpy as np
import pandas as pd


# ---------------------------------------------------------------------------
# Data model
# ---------------------------------------------------------------------------

@dataclass
class HealthDimension:
    name: str
    score: float          # 0–100
    weight: float         # bobot relatif
    label: str            # label singkat untuk UI
    description: str      # penjelasan satu kalimat
    icon: str = "●"


@dataclass
class HealthReport:
    overall: float                            # 0–100 composite
    grade: str                                # A+ … F
    headline: str                             # 1-line summary
    dimensions: list[HealthDimension] = field(default_factory=list)
    tips: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "overall": self.overall,
            "grade": self.grade,
            "headline": self.headline,
            "dimensions": [
                {
                    "name": d.name,
                    "score": d.score,
                    "weight": d.weight,
                    "label": d.label,
                    "description": d.description,
                    "icon": d.icon,
                }
                for d in self.dimensions
            ],
            "tips": self.tips,
        }


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def compute_health_score(
    summary: dict[str, Any],
    monthly: pd.DataFrame,
    by_category: pd.DataFrame,
    subscription_total: float = 0.0,
) -> HealthReport:
    """
    Hitung budget health score dari output pipeline.

    Parameters
    ----------
    summary            : dict dari insights.compute_summary
    monthly            : DataFrame dari insights.monthly_trend
    by_category        : DataFrame dari insights.spending_by_category
    subscription_total : total bulanan langganan berulang

    Returns
    -------
    HealthReport dataclass
    """
    income = summary.get("total_income", 0) or 0
    expense = summary.get("total_expense", 0) or 0
    net = summary.get("net_cashflow", 0) or 0

    dimensions: list[HealthDimension] = []
    tips: list[str] = []

    # ── 1. Savings Rate ──────────────────────────────────────────────────────
    savings_rate = net / income if income > 0 else 0.0
    sr_score = _clamp(_linear_scale(savings_rate, bad=0.0, good=0.30) * 100)
    dimensions.append(HealthDimension(
        name="Savings Rate",
        score=sr_score,
        weight=0.35,
        label=f"{savings_rate * 100:.1f}%",
        description="Persentase income yang berhasil ditabung / tersisa.",
        icon="💰",
    ))
    if savings_rate < 0.10:
        tips.append("Targetkan menabung minimal 10–20% dari income setiap bulan.")

    # ── 2. Expense Ratio ─────────────────────────────────────────────────────
    expense_ratio = expense / income if income > 0 else 1.0
    er_score = _clamp(_linear_scale(1 - expense_ratio, bad=0.0, good=0.30) * 100)
    dimensions.append(HealthDimension(
        name="Expense Ratio",
        score=er_score,
        weight=0.25,
        label=f"{expense_ratio * 100:.1f}%",
        description="Berapa persen income yang habis untuk pengeluaran.",
        icon="📊",
    ))
    if expense_ratio > 0.90:
        tips.append("Pengeluaran hampir menghabiskan seluruh income — cek kategori terbesar.")

    # ── 3. Subscription Burden ───────────────────────────────────────────────
    months = max(len(monthly), 1) if not monthly.empty else 1
    avg_monthly_income = income / months if income > 0 else 1.0
    sub_ratio = subscription_total / avg_monthly_income if avg_monthly_income > 0 else 0.0
    sub_score = _clamp(_linear_scale(1 - sub_ratio, bad=0.5, good=0.95) * 100)
    dimensions.append(HealthDimension(
        name="Subscription Burden",
        score=sub_score,
        weight=0.15,
        label=f"{sub_ratio * 100:.1f}%",
        description="Beban langganan bulanan relatif terhadap income.",
        icon="🔄",
    ))
    if sub_ratio > 0.10:
        tips.append("Subscription melebihi 10% income — audit langganan yang jarang dipakai.")

    # ── 4. Cashflow Trend ────────────────────────────────────────────────────
    trend_score = _compute_trend_score(monthly)
    dimensions.append(HealthDimension(
        name="Cashflow Trend",
        score=trend_score,
        weight=0.15,
        label="Membaik" if trend_score >= 60 else ("Stabil" if trend_score >= 40 else "Memburuk"),
        description="Apakah net cashflow bulanan menunjukkan tren positif?",
        icon="📈",
    ))
    if trend_score < 40:
        tips.append("Tren cashflow negatif — pantau pola pengeluaran bulan ke bulan.")

    # ── 5. Category Discipline ───────────────────────────────────────────────
    disc_score = _compute_discipline_score(by_category)
    dimensions.append(HealthDimension(
        name="Category Discipline",
        score=disc_score,
        weight=0.10,
        label="Terkontrol" if disc_score >= 60 else "Tersebar",
        description="Seberapa terkontrol distribusi pengeluaran per kategori.",
        icon="🎯",
    ))
    if disc_score < 50:
        tips.append("Banyak pengeluaran di 'Lainnya' — kategorisasi lebih detail agar mudah dipantau.")

    # ── Composite score ───────────────────────────────────────────────────────
    overall = sum(d.score * d.weight for d in dimensions)
    overall = _clamp(overall)

    grade = _grade(overall)
    headline = _headline(overall, savings_rate, expense_ratio)

    if not tips:
        tips.append("Keuangan kamu dalam kondisi baik! Pertahankan pola ini.")

    return HealthReport(
        overall=round(overall, 1),
        grade=grade,
        headline=headline,
        dimensions=dimensions,
        tips=tips,
    )


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _linear_scale(value: float, bad: float, good: float) -> float:
    """Scale value ke 0–1: bad → 0, good → 1, linear."""
    if good == bad:
        return 0.5
    return (value - bad) / (good - bad)


def _clamp(value: float, lo: float = 0.0, hi: float = 100.0) -> float:
    return max(lo, min(hi, value))


def _compute_trend_score(monthly: pd.DataFrame) -> float:
    if monthly.empty or len(monthly) < 2:
        return 50.0
    nets = monthly["net"].values.astype(float)
    # Linear regression slope sebagai proxy tren
    x = np.arange(len(nets))
    slope = np.polyfit(x, nets, 1)[0]
    std = np.std(nets) if np.std(nets) > 0 else 1
    normalized = slope / std  # z-score of slope
    return _clamp(50 + normalized * 20)


def _compute_discipline_score(by_category: pd.DataFrame) -> float:
    if by_category.empty:
        return 50.0
    total = by_category["total"].sum()
    if total == 0:
        return 50.0
    # Penalti jika "Lainnya" > 20%
    lainnya_pct = 0.0
    lainnya_rows = by_category[by_category["kategori"] == "Lainnya"]
    if not lainnya_rows.empty:
        lainnya_pct = lainnya_rows["total"].sum() / total
    # Penalti jika 1 kategori dominasi > 60%
    top_pct = by_category["total"].max() / total if not by_category.empty else 0
    score = 80.0
    score -= lainnya_pct * 100  # max -100
    score -= max(0, (top_pct - 0.60) * 100)
    return _clamp(score)


def _grade(score: float) -> str:
    if score >= 85:
        return "A+"
    if score >= 75:
        return "A"
    if score >= 65:
        return "B+"
    if score >= 55:
        return "B"
    if score >= 45:
        return "C"
    if score >= 35:
        return "D"
    return "F"


def _headline(score: float, savings_rate: float, expense_ratio: float) -> str:
    if score >= 80:
        return "Keuangan kamu sangat sehat! Keep it up 🚀"
    if score >= 65:
        return "Keuangan cukup baik, masih ada ruang untuk dioptimalkan."
    if score >= 50:
        return "Perlu perhatian — beberapa area keuangan bisa diperbaiki."
    if score >= 35:
        return "Waspada — pengeluaran mendekati atau melebihi income."
    return "Darurat keuangan — segera evaluasi pengeluaran rutin!"
