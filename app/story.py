"""
app/story.py — Spending Story & Narrative Generator.

Mengubah angka keuangan menjadi cerita yang mudah dipahami.
Tidak menggunakan LLM — semua berbasis template + rule engine.
Dirancang sebagai drop-in replacement ketika LLM tersedia di masa depan.
"""

from __future__ import annotations

from typing import Any

import pandas as pd


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def generate_monthly_stories(
    df: pd.DataFrame,
    monthly: pd.DataFrame,
    by_category: pd.DataFrame,
) -> list[dict[str, Any]]:
    """
    Buat satu story card per bulan.

    Returns
    -------
    list of dict:
        periode, income, expense, net, top_category, top_amount,
        headline, body, mood (great/good/warning/bad)
    """
    if monthly.empty:
        return []

    stories: list[dict[str, Any]] = []

    for _, row in monthly.iterrows():
        periode = str(row["periode"])
        income = float(row.get("income", 0))
        expense = float(row.get("expense", 0))
        net = float(row.get("net", 0))

        # Cari top category bulan ini
        month_df = df[df["tanggal"].dt.to_period("M").astype(str) == periode]
        top_cat, top_amt = _top_expense_category(month_df)

        headline, body, mood = _compose_story(income, expense, net, top_cat, top_amt, periode)

        stories.append({
            "periode": periode,
            "income": income,
            "expense": expense,
            "net": net,
            "top_category": top_cat,
            "top_amount": top_amt,
            "headline": headline,
            "body": body,
            "mood": mood,
        })

    return stories


def generate_overall_story(
    summary: dict[str, Any],
    monthly: pd.DataFrame,
    by_category: pd.DataFrame,
    subscriptions: pd.DataFrame,
) -> dict[str, Any]:
    """
    Buat satu ringkasan narasi keseluruhan periode.

    Returns
    -------
    dict: headline, paragraphs (list[str]), highlights (list[str])
    """
    income = summary.get("total_income", 0)
    expense = summary.get("total_expense", 0)
    net = summary.get("net_cashflow", 0)
    tx_count = summary.get("tx_count", 0)
    date_range = summary.get("date_range", "periode analisis")

    paragraphs: list[str] = []
    highlights: list[str] = []

    # Pembuka
    savings_rate = net / income * 100 if income > 0 else 0
    if savings_rate > 20:
        opener = (
            f"Selama {date_range}, kamu berhasil menabung **{savings_rate:.1f}%** dari total income — "
            "angka yang solid dan mencerminkan disiplin keuangan yang baik."
        )
    elif savings_rate > 0:
        opener = (
            f"Selama {date_range}, kamu menyisakan **{savings_rate:.1f}%** dari income. "
            "Ada ruang untuk ditingkatkan, tapi arahnya sudah benar."
        )
    else:
        opener = (
            f"Selama {date_range}, pengeluaran melebihi income. "
            "Ini momen tepat untuk mengevaluasi prioritas keuangan."
        )
    paragraphs.append(opener)

    # Kategori dominan
    if not by_category.empty:
        top = by_category.iloc[0]
        pct = float(top.get("pct", 0))
        paragraphs.append(
            f"Pengeluaran terbesar adalah **{top['kategori']}** sebesar "
            f"**{_fmt(top['total'])}** ({pct:.1f}% dari total pengeluaran). "
            + _category_comment(top["kategori"], pct)
        )

    # Monthly highlights
    if not monthly.empty and len(monthly) > 1:
        best = monthly.loc[monthly["net"].idxmax()]
        worst = monthly.loc[monthly["net"].idxmin()]
        paragraphs.append(
            f"Bulan terbaik adalah **{best['periode']}** dengan net cashflow "
            f"**{_fmt(best['net'])}**, sementara bulan paling berat adalah "
            f"**{worst['periode']}** dengan net **{_fmt(worst['net'])}**."
        )
        highlights.append(f"🏆 Bulan terbaik: {best['periode']} ({_fmt(best['net'])})")
        highlights.append(f"⚡ Bulan terberat: {worst['periode']} ({_fmt(worst['net'])})")

    # Subscription note
    if not subscriptions.empty:
        sub_total = subscriptions["estimated_monthly"].sum()
        sub_count = len(subscriptions)
        paragraphs.append(
            f"Terdeteksi **{sub_count} langganan berulang** dengan estimasi total "
            f"**{_fmt(sub_total)}/bulan**. Pastikan semua masih aktif digunakan."
        )
        highlights.append(f"🔄 {sub_count} langganan aktif — total Rp {sub_total:,.0f}/bulan")

    # Transaction count
    highlights.append(f"📋 {tx_count:,} transaksi dianalisis")
    highlights.append(f"💸 Total keluar: {_fmt(expense)}")
    highlights.append(f"💰 Total masuk: {_fmt(income)}")

    headline = _overall_headline(savings_rate, income, expense)

    return {
        "headline": headline,
        "paragraphs": paragraphs,
        "highlights": highlights,
    }


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _top_expense_category(month_df: pd.DataFrame) -> tuple[str, float]:
    if month_df.empty or "debit" not in month_df.columns:
        return "N/A", 0.0
    exp = month_df[month_df["tipe"] == "expense"]
    if exp.empty:
        return "N/A", 0.0
    grouped = exp.groupby("kategori")["debit"].sum()
    top = grouped.idxmax()
    return str(top), float(grouped.max())


def _compose_story(
    income: float, expense: float, net: float,
    top_cat: str, top_amt: float, periode: str,
) -> tuple[str, str, str]:
    """Return (headline, body, mood)."""
    ratio = expense / income if income > 0 else 1.0

    if net > 0 and ratio < 0.70:
        mood = "great"
        headline = f"Bulan yang sangat sehat 🚀"
        body = (
            f"Kamu menyisakan **{_fmt(net)}** bulan ini — "
            f"savings rate {(1-ratio)*100:.0f}%. "
            f"Pengeluaran terbesar: **{top_cat}** ({_fmt(top_amt)})."
        )
    elif net > 0 and ratio < 0.90:
        mood = "good"
        headline = "Bulan yang positif 👍"
        body = (
            f"Net positif **{_fmt(net)}** dengan pengeluaran terkontrol ({ratio*100:.0f}% income). "
            f"Dominasi kategori: **{top_cat}**."
        )
    elif net >= 0:
        mood = "warning"
        headline = "Hampir impas ⚠️"
        body = (
            f"Net hanya **{_fmt(net)}** — {ratio*100:.0f}% income habis untuk pengeluaran. "
            f"Perhatikan **{top_cat}** yang menyedot {_fmt(top_amt)}."
        )
    else:
        mood = "bad"
        headline = "Defisit bulan ini 🔴"
        body = (
            f"Pengeluaran **{_fmt(abs(net))}** melebihi income. "
            f"Kategori terbesar: **{top_cat}** ({_fmt(top_amt)}). "
            "Evaluasi pengeluaran tidak essensial."
        )

    return headline, body, mood


def _category_comment(category: str, pct: float) -> str:
    essential = {"Minimarket", "Supermarket", "Listrik", "Air", "Internet", "Transportasi Umum", "BPJS & Asuransi"}
    lifestyle = {"Fast Food", "Kuliner", "Food Delivery", "Streaming", "Gaming", "Musik", "Belanja Online"}
    if category in essential:
        return "Ini kebutuhan pokok yang wajar."
    if category in lifestyle:
        if pct > 30:
            return f"Sebesar {pct:.0f}% cukup signifikan — pertimbangkan untuk dikurangi."
        return "Lifestyle spending dalam batas wajar."
    return ""


def _overall_headline(savings_rate: float, income: float, expense: float) -> str:
    if savings_rate > 25:
        return "Financial Superstar — tabungan kamu di atas rata-rata! 🌟"
    if savings_rate > 10:
        return "On Track — keuangan sehat dengan ruang untuk tumbuh 📈"
    if savings_rate > 0:
        return "Almost There — sedikit lagi menuju keuangan ideal 💪"
    return "Red Zone — pengeluaran melebihi income, perlu aksi segera 🚨"


def _fmt(value: float) -> str:
    """Format angka ke Rupiah singkat."""
    v = float(value)
    if abs(v) >= 1_000_000:
        return f"Rp {v/1_000_000:.1f}jt"
    if abs(v) >= 1_000:
        return f"Rp {v/1_000:.0f}rb"
    return f"Rp {v:.0f}"
