"""
app/pipeline.py — Main orchestrator untuk Personal Finance Analyzer.

Entry point tunggal: `run_pipeline(file)`.
Mengorkestrasi semua layer secara berurutan dan mengembalikan
structured result yang siap dikonsumsi oleh UI maupun unit test.
"""

from __future__ import annotations

import io
from pathlib import Path
from typing import Any, Union

import pandas as pd

from app.utils import (
    ensure_datetime,
    load_file,
    normalize_columns,
    parse_amount_columns,
)
from app.categorizer import categorize_transactions
from app.insights import (
    compute_summary,
    income_sources,
    monthly_trend,
    spending_by_category,
    top_merchants,
)
from app.forecasting import forecast_cashflow, prepare_timeseries
from app.health_score import compute_health_score
from app.subscription import detect_subscriptions, total_monthly_subscription
from app.story import generate_monthly_stories, generate_overall_story
from app.simulator import build_category_baseline


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def run_pipeline(
    file: Union[str, Path, io.BytesIO, io.StringIO],
    forecast_periods: int = 30,
    forecast_method: str = "linear_regression",
) -> dict[str, Any]:
    """
    Jalankan full pipeline dari raw file ke structured result.

    Returns
    -------
    dict dengan keys:
        df, summary, by_category, monthly, top_merchants, income_src,
        timeseries, forecast,
        subscriptions, sub_total_monthly,
        health_report, monthly_stories, overall_story,
        category_baseline,
        errors
    """
    errors: list[str] = []

    # ── Step 1: Load ────────────────────────────────────────────────────────
    try:
        raw_df = load_file(file)
    except Exception as exc:
        return _empty_result(errors=[f"Gagal membaca file: {exc}"])

    if raw_df.empty:
        return _empty_result(errors=["File kosong atau tidak bisa diparsing."])

    # ── Step 2: Normalize & Clean ───────────────────────────────────────────
    df = normalize_columns(raw_df)
    df = parse_amount_columns(df)
    df = ensure_datetime(df)

    if df.empty:
        return _empty_result(errors=["Tidak ada baris valid setelah pembersihan data."])

    # ── Step 3: Categorize ──────────────────────────────────────────────────
    df = categorize_transactions(df)

    # ── Step 4: Core Insights ────────────────────────────────────────────────
    summary = compute_summary(df)
    by_category = spending_by_category(df)
    monthly = monthly_trend(df)
    merchants = top_merchants(df, n=10)
    income_src = income_sources(df, n=5)

    # ── Step 5: Forecasting ─────────────────────────────────────────────────
    ts = prepare_timeseries(df)
    if len(ts) < 7:
        errors.append("Data terlalu sedikit untuk prediksi akurat (< 7 hari). Forecast dilewati.")
        forecast_df = pd.DataFrame()
    else:
        try:
            forecast_df = forecast_cashflow(ts, periods=forecast_periods, method=forecast_method)
        except Exception as exc:
            errors.append(f"Forecasting gagal: {exc}")
            forecast_df = pd.DataFrame()

    # ── Step 6: Subscription Detection ──────────────────────────────────────
    subscriptions = detect_subscriptions(df)
    sub_total_monthly = total_monthly_subscription(subscriptions)

    # ── Step 7: Health Score ─────────────────────────────────────────────────
    health_report = compute_health_score(
        summary=summary,
        monthly=monthly,
        by_category=by_category,
        subscription_total=sub_total_monthly,
    )

    # ── Step 8: Storytelling ─────────────────────────────────────────────────
    monthly_stories = generate_monthly_stories(df, monthly, by_category)
    overall_story = generate_overall_story(summary, monthly, by_category, subscriptions)

    # ── Step 9: Simulator baseline ───────────────────────────────────────────
    category_baseline = build_category_baseline(by_category, monthly)

    return {
        "df": df,
        "summary": summary,
        "by_category": by_category,
        "monthly": monthly,
        "top_merchants": merchants,
        "income_src": income_src,
        "timeseries": ts,
        "forecast": forecast_df,
        "subscriptions": subscriptions,
        "sub_total_monthly": sub_total_monthly,
        "health_report": health_report,
        "monthly_stories": monthly_stories,
        "overall_story": overall_story,
        "category_baseline": category_baseline,
        "errors": errors,
    }


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _empty_result(errors: list[str]) -> dict[str, Any]:
    """Return kosong yang aman ketika pipeline gagal."""
    return {
        "df": pd.DataFrame(),
        "summary": {},
        "by_category": pd.DataFrame(),
        "monthly": pd.DataFrame(),
        "top_merchants": pd.DataFrame(),
        "income_src": pd.DataFrame(),
        "timeseries": pd.DataFrame(),
        "forecast": pd.DataFrame(),
        "subscriptions": pd.DataFrame(),
        "sub_total_monthly": 0.0,
        "health_report": None,
        "monthly_stories": [],
        "overall_story": {"headline": "", "paragraphs": [], "highlights": []},
        "category_baseline": {},
        "errors": errors,
    }
