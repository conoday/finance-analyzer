"""
app/ui.py *€” Personal Finance Analyzer *· Product-Grade Streamlit UI.

Features:
  *€¢ Fintech dark dashboard with Plotly interactive charts
  *€¢ Animated spending wheel (Plotly donut)
  *€¢ Budget health score gauge
  *€¢ Monthly spending story cards
  *€¢ Subscription detector
  *€¢ Future balance simulator with sliders

Run:
    streamlit run app/ui.py
"""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Any

import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
import streamlit as st

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.pipeline import run_pipeline
from app.simulator import simulate_balance, savings_impact
from app.forecasting import forecast_cashflow

SAMPLE_PATH = Path(__file__).parent.parent / "data" / "sample" / "sample_mutasi.csv"

# *”€*”€ Brand palette *”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€
CLR = {
    "bg": "#0a0e1a",
    "surface": "#111827",
    "card": "#1a2235",
    "border": "#1e2d45",
    "accent": "#3b82f6",
    "green": "#10b981",
    "red": "#ef4444",
    "yellow": "#f59e0b",
    "purple": "#8b5cf6",
    "cyan": "#06b6d4",
    "orange": "#f97316",
    "pink": "#ec4899",
    "muted": "#6b7280",
    "text": "#f1f5f9",
    "text_dim": "#94a3b8",
}

WHEEL_COLORS = [
    "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
    "#f97316", "#06b6d4", "#ec4899", "#84cc16", "#14b8a6",
    "#a855f7", "#fb923c",
]

PLOTLY_LAYOUT = dict(
    paper_bgcolor="rgba(0,0,0,0)",
    plot_bgcolor="rgba(0,0,0,0)",
    font=dict(family="Inter, sans-serif", color=CLR["text_dim"], size=12),
    margin=dict(l=16, r=16, t=40, b=16),
    legend=dict(bgcolor="rgba(0,0,0,0)", font=dict(size=11)),
)

# *”€*”€ CSS injection *”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€
_CSS = f"""
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

html, body, [class*="css"] {{
    font-family: 'Inter', sans-serif;
    background-color: {CLR["bg"]};
}}
.block-container {{ padding: 1rem 2rem 3rem; max-width: 1400px; }}

/* *”€*”€ Metric cards *”€*”€ */
div[data-testid="metric-container"] {{
    background: {CLR["card"]};
    border: 1px solid {CLR["border"]};
    border-radius: 16px;
    padding: 1.25rem 1.5rem;
    transition: border-color .2s;
}}
div[data-testid="metric-container"]:hover {{ border-color: {CLR["accent"]}55; }}
div[data-testid="metric-container"] label {{
    color: {CLR["text_dim"]} !important;
    font-size: 0.72rem !important;
    text-transform: uppercase;
    letter-spacing: .08em;
    font-weight: 500;
}}
div[data-testid="metric-container"] div[data-testid="stMetricValue"] {{
    font-size: 1.55rem !important;
    font-weight: 700 !important;
    color: {CLR["text"]} !important;
}}
div[data-testid="metric-container"] div[data-testid="stMetricDelta"] svg {{ display: none; }}

/* *”€*”€ Sidebar *”€*”€ */
section[data-testid="stSidebar"] {{
    background: {CLR["surface"]};
    border-right: 1px solid {CLR["border"]};
}}
section[data-testid="stSidebar"] .block-container {{ padding-top: 1.5rem; }}

/* *”€*”€ Tabs *”€*”€ */
div[data-testid="stTabs"] button {{
    font-size: 0.82rem;
    font-weight: 500;
    letter-spacing: .04em;
    padding: .5rem 1rem;
    color: {CLR["text_dim"]};
    border-bottom: 2px solid transparent;
}}
div[data-testid="stTabs"] button[aria-selected="true"] {{
    color: {CLR["accent"]} !important;
    border-bottom-color: {CLR["accent"]} !important;
}}

/* *”€*”€ Story cards *”€*”€ */
.story-card {{
    background: {CLR["card"]};
    border: 1px solid {CLR["border"]};
    border-radius: 16px;
    padding: 1.25rem 1.5rem;
    margin-bottom: 1rem;
}}
.story-card.great {{ border-left: 4px solid {CLR["green"]}; }}
.story-card.good  {{ border-left: 4px solid {CLR["accent"]}; }}
.story-card.warning {{ border-left: 4px solid {CLR["yellow"]}; }}
.story-card.bad   {{ border-left: 4px solid {CLR["red"]}; }}

/* *”€*”€ Score badge *”€*”€ */
.grade-badge {{
    display: inline-block;
    font-size: 2.8rem;
    font-weight: 800;
    line-height: 1;
}}
.highlight-chip {{
    display: inline-block;
    background: {CLR["border"]};
    border-radius: 999px;
    padding: .25rem .75rem;
    font-size: .78rem;
    color: {CLR["text_dim"]};
    margin: .15rem;
}}
.sub-card {{
    background: {CLR["card"]};
    border: 1px solid {CLR["border"]};
    border-radius: 12px;
    padding: 1rem 1.25rem;
    margin-bottom: .6rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
}}
hr {{ border-color: {CLR["border"]}; margin: 1.5rem 0; }}
h1,h2,h3 {{ color: {CLR["text"]}; }}
h4,h5 {{ color: {CLR["text_dim"]}; font-weight: 500; }}

/* *”€*”€ Scrollbar *”€*”€ */
::-webkit-scrollbar {{ width: 6px; background: {CLR["surface"]}; }}
::-webkit-scrollbar-thumb {{ background: {CLR["border"]}; border-radius: 999px; }}

/* *”€*”€ DataFrames *”€*”€ */
div[data-testid="stDataFrame"] {{ border-radius: 12px; overflow: hidden; }}
</style>
"""


# *”€*”€ Page config *”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€

def _setup() -> None:
    st.set_page_config(
        page_title="Finance Analyzer",
        page_icon="ðŸ’Ž",
        layout="wide",
        initial_sidebar_state="expanded",
    )
    st.markdown(_CSS, unsafe_allow_html=True)


# *”€*”€ Sidebar *”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€

def _sidebar() -> dict:
    with st.sidebar:
        st.markdown(
            f"<div style='font-size:1.4rem;font-weight:700;color:{CLR['text']};margin-bottom:.25rem'>"
            "ðŸ’Ž Finance Analyzer</div>"
            f"<div style='font-size:.75rem;color:{CLR['muted']}'>Personal *· Local *· No API</div>",
            unsafe_allow_html=True,
        )
        st.markdown("---")

        st.markdown(f"<p style='font-size:.78rem;font-weight:600;color:{CLR['muted']};text-transform:uppercase;letter-spacing:.1em'>Data Source</p>", unsafe_allow_html=True)
        uploaded = st.file_uploader("Upload mutasi rekening", type=["csv", "xlsx"], label_visibility="collapsed")
        use_sample = st.checkbox("Pakai sample data", value=uploaded is None)

        st.markdown("---")
        st.markdown(f"<p style='font-size:.78rem;font-weight:600;color:{CLR['muted']};text-transform:uppercase;letter-spacing:.1em'>Forecast</p>", unsafe_allow_html=True)
        forecast_days = st.slider("Horizon (hari)", 7, 90, 30, step=7)
        forecast_method = st.radio(
            "Model",
            ["linear_regression", "moving_average"],
            format_func=lambda x: "Linear Regression" if x == "linear_regression" else "Moving Average",
            horizontal=True,
        )

        st.markdown("---")
        st.markdown(
            f"<div style='font-size:.72rem;color:{CLR['muted']};line-height:1.7'>"
            "Stack: Python *· pandas *· scikit-learn<br>"
            "Plotly *· Streamlit *· No LLM (yet)"
            "</div>",
            unsafe_allow_html=True,
        )

    return {
        "uploaded": uploaded,
        "use_sample": use_sample,
        "forecast_days": forecast_days,
        "forecast_method": forecast_method,
    }


# *•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•
# TAB 1 *€” Dashboard
# *•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•

def _tab_dashboard(r: dict) -> None:
    summary = r["summary"]
    income = summary.get("total_income", 0)
    expense = summary.get("total_expense", 0)
    net = summary.get("net_cashflow", 0)
    tx = summary.get("tx_count", 0)

    # *”€*”€ KPI row *”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€
    c1, c2, c3, c4 = st.columns(4)
    _metric(c1, "ðŸ’° Total Income",   _fmt(income),   None, CLR["green"])
    _metric(c2, "ðŸ’¸ Total Expense",  _fmt(expense),  None, CLR["red"])
    _metric(c3, "ðŸ“Š Net Cashflow",   _fmt(net),      "Surplus" if net >= 0 else "Defisit", CLR["accent"])
    _metric(c4, "ðŸ”¢ Transaksi",      f"{tx:,}",      summary.get("date_range", ""), CLR["yellow"])

    st.markdown("<div style='height:1.5rem'></div>", unsafe_allow_html=True)

    # *”€*”€ Health score + Spending wheel *”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€
    col_health, col_wheel = st.columns([1, 1.6])

    with col_health:
        _render_health_gauge(r["health_report"])

    with col_wheel:
        _render_spending_wheel(r["by_category"])

    st.markdown("<div style='height:.5rem'></div>", unsafe_allow_html=True)

    # *”€*”€ Monthly trend *”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€
    _render_monthly_bar(r["monthly"])

    # *”€*”€ Forecast *”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€
    _render_forecast_section(r["timeseries"], r["forecast"])

    # *”€*”€ Top merchants *”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€
    col_merch, col_cat = st.columns(2)
    with col_merch:
        _render_top_merchants(r["top_merchants"])
    with col_cat:
        _render_category_table(r["by_category"])


# *•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•
# TAB 2 *€” Spending Story
# *•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•

def _tab_story(r: dict) -> None:
    overall = r.get("overall_story", {})
    stories = r.get("monthly_stories", [])

    # *”€*”€ Overall narrative *”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€
    st.markdown(
        f"<div style='font-size:1.5rem;font-weight:700;color:{CLR['text']};margin-bottom:.5rem'>"
        f"{overall.get('headline', '')}</div>",
        unsafe_allow_html=True,
    )

    for para in overall.get("paragraphs", []):
        st.markdown(para)

    highlights = overall.get("highlights", [])
    if highlights:
        chips_html = "".join(f"<span class='highlight-chip'>{h}</span>" for h in highlights)
        st.markdown(f"<div style='margin:1rem 0'>{chips_html}</div>", unsafe_allow_html=True)

    st.markdown("---")

    # *”€*”€ Monthly story cards *”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€
    if not stories:
        st.info("Belum cukup data untuk story bulanan.")
        return

    st.markdown(f"<h3 style='margin-bottom:1rem'>ðŸ“… Monthly Breakdown</h3>", unsafe_allow_html=True)

    MOOD_EMOJI = {"great": "ðŸš€", "good": "ðŸ‘", "warning": "*š ï¸", "bad": "ðŸ”´"}

    for s in stories:
        mood = s.get("mood", "good")
        emoji = MOOD_EMOJI.get(mood, "*€¢")
        income_s = _fmt(s["income"])
        expense_s = _fmt(s["expense"])
        net_s = _fmt(s["net"])
        net_color = CLR["green"] if s["net"] >= 0 else CLR["red"]

        st.markdown(
            f"""
            <div class="story-card {mood}">
              <div style="display:flex;justify-content:space-between;align-items:flex-start">
                <div>
                  <div style="font-size:.72rem;color:{CLR['muted']};text-transform:uppercase;letter-spacing:.08em">{s['periode']}</div>
                  <div style="font-size:1.1rem;font-weight:700;color:{CLR['text']};margin:.25rem 0">{emoji} {s['headline']}</div>
                  <div style="font-size:.88rem;color:{CLR['text_dim']};line-height:1.6">{s['body']}</div>
                </div>
                <div style="text-align:right;min-width:110px;margin-left:1rem">
                  <div style="font-size:.7rem;color:{CLR['muted']}">Income</div>
                  <div style="font-size:.95rem;font-weight:600;color:{CLR['green']}">{income_s}</div>
                  <div style="font-size:.7rem;color:{CLR['muted']};margin-top:.4rem">Expense</div>
                  <div style="font-size:.95rem;font-weight:600;color:{CLR['red']}">{expense_s}</div>
                  <div style="font-size:.7rem;color:{CLR['muted']};margin-top:.4rem">Net</div>
                  <div style="font-size:1rem;font-weight:700;color:{net_color}">{net_s}</div>
                </div>
              </div>
            </div>
            """,
            unsafe_allow_html=True,
        )


# *•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•
# TAB 3 *€” Subscriptions
# *•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•

def _tab_subscriptions(r: dict) -> None:
    subs = r.get("subscriptions", pd.DataFrame())
    sub_total = r.get("sub_total_monthly", 0.0)

    col_a, col_b, col_c = st.columns(3)
    _metric(col_a, "ðŸ”„ Total Langganan", f"{len(subs)}", None, CLR["purple"])
    _metric(col_b, "ðŸ’¸ Est. /Bulan", _fmt(sub_total), None, CLR["red"])
    income = r["summary"].get("total_income", 0)
    months = max(len(r["monthly"]), 1)
    avg_income = income / months
    burden_pct = sub_total / avg_income * 100 if avg_income > 0 else 0
    _metric(col_c, "ðŸ“Š % dari Income", f"{burden_pct:.1f}%", "dari income bulanan", CLR["yellow"])

    st.markdown("<div style='height:1rem'></div>", unsafe_allow_html=True)

    if subs.empty:
        st.info("Tidak ada langganan berulang yang terdeteksi dalam data ini.")
        return

    # Split: known vs detected
    known = subs[subs["is_known_sub"] == True]
    detected = subs[subs["is_known_sub"] == False]

    if not known.empty:
        st.markdown(f"<h4>*œ… Langganan Dikenal ({len(known)})</h4>", unsafe_allow_html=True)
        _render_sub_list(known)

    if not detected.empty:
        st.markdown(f"<h4 style='margin-top:1.5rem'>ðŸ” Transaksi Berulang Terdeteksi ({len(detected)})</h4>", unsafe_allow_html=True)
        st.caption("Terdeteksi berdasarkan pola interval dan jumlah yang konsisten.")
        _render_sub_list(detected)

    # Subscription pie
    if len(subs) >= 2:
        st.markdown("---")
        fig = px.pie(
            subs,
            values="estimated_monthly",
            names="merchant",
            color_discrete_sequence=WHEEL_COLORS,
            hole=0.55,
            title="Distribusi Biaya Langganan",
        )
        fig.update_layout(**PLOTLY_LAYOUT, height=350)
        fig.update_traces(textposition="outside", textfont_size=11, textinfo="percent+label")
        st.plotly_chart(fig, use_container_width=True)


def _render_sub_list(subs: pd.DataFrame) -> None:
    for _, row in subs.iterrows():
        conf_color = CLR["green"] if row["confidence"] >= 0.7 else (CLR["yellow"] if row["confidence"] >= 0.4 else CLR["muted"])
        st.markdown(
            f"""
            <div class="sub-card">
              <div>
                <div style="font-weight:600;color:{CLR['text']};font-size:.95rem">{row['merchant']}</div>
                <div style="font-size:.78rem;color:{CLR['muted']};margin-top:.2rem">
                  {row['kategori']} *· {int(row['frekuensi'])}Ã— *· setiap ~{int(row['interval_hari'])} hari
                </div>
              </div>
              <div style="text-align:right">
                <div style="font-weight:700;font-size:1rem;color:{CLR['text']}">{_fmt(row['estimated_monthly'])}<span style="font-size:.72rem;color:{CLR['muted']}">/bln</span></div>
                <div style="font-size:.72rem;margin-top:.2rem;color:{conf_color}">confidence {int(row['confidence']*100)}%</div>
              </div>
            </div>
            """,
            unsafe_allow_html=True,
        )


# *•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•
# TAB 4 *€” Simulator
# *•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•

def _tab_simulator(r: dict) -> None:
    baseline = r.get("category_baseline", {})
    summary = r["summary"]
    monthly = r["monthly"]

    if not baseline:
        st.info("Tidak ada baseline kategori. Upload data lebih lengkap.")
        return

    st.markdown(
        f"<p style='color:{CLR['text_dim']};margin-bottom:1.5rem'>"
        "Sesuaikan pengeluaran per kategori dengan slider, lalu lihat dampaknya pada proyeksi saldo.</p>",
        unsafe_allow_html=True,
    )

    col_sliders, col_impact = st.columns([1.3, 1])

    adjustments: dict[str, float] = {}

    with col_sliders:
        st.markdown(f"<h4>*š™ï¸ Sesuaikan Pengeluaran</h4>", unsafe_allow_html=True)
        # Sort by amount descending, show top 10
        top_cats = sorted(baseline.items(), key=lambda x: x[1], reverse=True)[:10]
        for cat, amt in top_cats:
            if amt <= 0:
                continue
            key = f"sim_{cat}"
            val = st.slider(
                f"{cat}  ({_fmt(amt)}/bln)",
                min_value=0,
                max_value=200,
                value=100,
                step=5,
                format="%d%%",
                key=key,
            )
            adjustments[cat] = val / 100.0

    horizon = st.slider("Horizon proyeksi (bulan)", 1, 12, 6, key="sim_horizon")

    # Run simulation
    proj = simulate_balance(summary, monthly, baseline, adjustments, horizon_months=horizon)
    impact = savings_impact(baseline, adjustments, horizon)

    with col_impact:
        st.markdown(f"<h4>ðŸ“Š Dampak Penyesuaian</h4>", unsafe_allow_html=True)
        _metric_raw(
            "ðŸ’° Hemat /Bulan",
            _fmt(impact["monthly_saving"]),
            f"{impact['pct_reduction']:.1f}% pengurangan expense",
            CLR["green"] if impact["monthly_saving"] > 0 else CLR["red"],
        )
        st.markdown("<div style='height:.5rem'></div>", unsafe_allow_html=True)
        _metric_raw(
            f"ðŸŽ¯ Total Hemat {horizon} Bulan",
            _fmt(impact["total_saving"]),
            None,
            CLR["accent"],
        )

    if proj.empty:
        return

    # Projected balance chart
    st.markdown("---")
    fig = go.Figure()

    # Bars: income vs expense
    fig.add_trace(go.Bar(
        x=proj["bulan"], y=proj["projected_income"],
        name="Projected Income", marker_color=CLR["green"], opacity=0.75,
    ))
    fig.add_trace(go.Bar(
        x=proj["bulan"], y=proj["projected_expense"],
        name="Projected Expense", marker_color=CLR["red"], opacity=0.75,
    ))
    # Line: cumulative
    fig.add_trace(go.Scatter(
        x=proj["bulan"], y=proj["projected_cumulative"],
        name="Kumulatif", mode="lines+markers",
        line=dict(color=CLR["accent"], width=2.5),
        marker=dict(size=7),
        yaxis="y2",
    ))

    fig.update_layout(
        **PLOTLY_LAYOUT,
        barmode="group",
        height=380,
        title="Proyeksi Keuangan dengan Penyesuaian",
        xaxis_title="Bulan",
        yaxis=dict(title="Amount (Rp)", tickformat=",.0f", gridcolor=CLR["border"], linecolor=CLR["border"]),
        yaxis2=dict(
            title="Kumulatif (Rp)", overlaying="y", side="right",
            tickformat=",.0f", gridcolor="rgba(0,0,0,0)",
        ),
    )
    st.plotly_chart(fig, use_container_width=True)


# *•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•
# Chart helpers
# *•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•

def _render_health_gauge(health_report) -> None:
    if health_report is None:
        return

    score = health_report.overall
    grade = health_report.grade
    headline = health_report.headline

    # Score color
    if score >= 75:
        color = CLR["green"]
    elif score >= 55:
        color = CLR["accent"]
    elif score >= 40:
        color = CLR["yellow"]
    else:
        color = CLR["red"]

    # Gauge chart
    fig = go.Figure(go.Indicator(
        mode="gauge+number",
        value=score,
        number={"suffix": "", "font": {"size": 42, "color": color, "family": "Inter"}},
        gauge=dict(
            axis=dict(range=[0, 100], tickfont=dict(size=10, color=CLR["muted"]), tickcolor=CLR["border"]),
            bar=dict(color=color, thickness=0.3),
            bgcolor="rgba(0,0,0,0)",
            borderwidth=0,
            steps=[
                dict(range=[0, 35], color="#ef444422"),
                dict(range=[35, 55], color="#f59e0b22"),
                dict(range=[55, 75], color="#3b82f622"),
                dict(range=[75, 100], color="#10b98122"),
            ],
            threshold=dict(line=dict(color=color, width=3), thickness=0.8, value=score),
        ),
        title=dict(
            text=f"<b>HEALTH SCORE</b><br><span style='font-size:1.2em;color:{color}'>{grade}</span>",
            font=dict(size=13, color=CLR["text_dim"]),
        ),
    ))
    fig.update_layout(**PLOTLY_LAYOUT, height=280)
    st.plotly_chart(fig, use_container_width=True)

    # Headline
    st.markdown(
        f"<p style='font-size:.85rem;color:{CLR['text_dim']};text-align:center;margin-top:-.5rem'>{headline}</p>",
        unsafe_allow_html=True,
    )

    # Dimension breakdown
    with st.expander("Detail dimensi skor", expanded=False):
        for dim in health_report.dimensions:
            d_score = dim.score
            d_color = CLR["green"] if d_score >= 70 else (CLR["yellow"] if d_score >= 45 else CLR["red"])
            pct = int(d_score)
            bar_html = (
                f"<div style='background:{CLR['border']};border-radius:999px;height:6px;width:100%;margin-top:4px'>"
                f"<div style='background:{d_color};width:{pct}%;height:6px;border-radius:999px'></div></div>"
            )
            st.markdown(
                f"<div style='margin-bottom:.75rem'>"
                f"<div style='display:flex;justify-content:space-between'>"
                f"<span style='font-size:.82rem;color:{CLR['text_dim']}'>{dim.icon} {dim.name}</span>"
                f"<span style='font-size:.82rem;font-weight:600;color:{d_color}'>{dim.label}</span>"
                f"</div>{bar_html}</div>",
                unsafe_allow_html=True,
            )

    # Tips
    if health_report.tips:
        for tip in health_report.tips:
            st.markdown(
                f"<div style='font-size:.82rem;color:{CLR['yellow']};background:{CLR['card']};"
                f"border:1px solid {CLR['border']};border-radius:8px;padding:.5rem .75rem;margin:.35rem 0'>"
                f"ðŸ’¡ {tip}</div>",
                unsafe_allow_html=True,
            )


def _render_spending_wheel(by_category: pd.DataFrame) -> None:
    if by_category.empty:
        return

    top = by_category.head(11).copy()
    others_sum = by_category.iloc[11:]["total"].sum()
    if others_sum > 0:
        top = pd.concat([top, pd.DataFrame([{"kategori": "Lainnya", "total": others_sum, "pct": 0}])], ignore_index=True)

    fig = go.Figure(go.Pie(
        labels=top["kategori"],
        values=top["total"],
        hole=0.60,
        marker_colors=WHEEL_COLORS[: len(top)],
        textposition="outside",
        textfont_size=11,
        textinfo="percent",
        hovertemplate="<b>%{label}</b><br>%{value:,.0f}<br>%{percent}<extra></extra>",
        pull=[0.04 if i == 0 else 0 for i in range(len(top))],
        sort=True,
        direction="clockwise",
    ))

    total_expense = float(top["total"].sum())
    fig.add_annotation(
        text=f"<b>{_fmt(total_expense, short=True)}</b><br><span style='font-size:11px'>Total Expense</span>",
        x=0.5, y=0.5, showarrow=False,
        font=dict(size=16, color=CLR["text"]),
        xanchor="center",
    )
    fig.update_layout(
        **PLOTLY_LAYOUT,
        height=340,
        title="Spending Wheel",
        showlegend=True,
        legend=dict(
            orientation="v",
            x=1.02, y=0.5,
            font=dict(size=10),
        ),
    )
    st.plotly_chart(fig, use_container_width=True)


def _render_monthly_bar(monthly: pd.DataFrame) -> None:
    if monthly.empty:
        return

    fig = go.Figure()
    fig.add_trace(go.Bar(
        x=monthly["periode"], y=monthly["income"],
        name="Income", marker_color=CLR["green"], opacity=0.85,
        hovertemplate="%{x}<br>Income: %{y:,.0f}<extra></extra>",
    ))
    fig.add_trace(go.Bar(
        x=monthly["periode"], y=monthly["expense"],
        name="Expense", marker_color=CLR["red"], opacity=0.85,
        hovertemplate="%{x}<br>Expense: %{y:,.0f}<extra></extra>",
    ))
    fig.add_trace(go.Scatter(
        x=monthly["periode"], y=monthly["net"],
        name="Net", mode="lines+markers",
        line=dict(color=CLR["accent"], width=2),
        marker=dict(size=8, symbol="circle"),
        hovertemplate="%{x}<br>Net: %{y:,.0f}<extra></extra>",
    ))
    fig.update_layout(
        **PLOTLY_LAYOUT,
        barmode="group",
        height=320,
        title="Monthly Income vs Expense",
        xaxis=dict(gridcolor=CLR["border"], linecolor=CLR["border"]),
        yaxis=dict(gridcolor=CLR["border"], linecolor=CLR["border"], tickformat=",.0f"),
    )
    st.plotly_chart(fig, use_container_width=True)


def _render_forecast_section(ts: pd.DataFrame, forecast: pd.DataFrame) -> None:
    if ts.empty:
        return

    st.markdown(f"<h3>ðŸ”® Cashflow Forecast</h3>", unsafe_allow_html=True)

    fig = go.Figure()

    # Actual
    fig.add_trace(go.Scatter(
        x=ts.index, y=ts["kumulatif"],
        name="Aktual", mode="lines",
        line=dict(color=CLR["accent"], width=2),
        hovertemplate="%{x|%d %b %Y}<br>Kumulatif: %{y:,.0f}<extra></extra>",
    ))

    if not forecast.empty:
        fig.add_trace(go.Scatter(
            x=forecast["tanggal"], y=forecast["predicted_kumulatif"],
            name="Prediksi", mode="lines",
            line=dict(color=CLR["yellow"], width=2, dash="dot"),
            hovertemplate="%{x|%d %b %Y}<br>Prediksi: %{y:,.0f}<extra></extra>",
        ))
        fig.add_trace(go.Scatter(
            x=pd.concat([forecast["tanggal"], forecast["tanggal"][::-1]]),
            y=pd.concat([forecast["upper"], forecast["lower"][::-1]]),
            fill="toself", fillcolor=f"{CLR['yellow']}22",
            line=dict(color="rgba(0,0,0,0)"),
            name="Confidence Band", hoverinfo="skip",
        ))
        # Divider line
        last_actual = ts.index[-1]
        fig.add_vline(
            x=str(last_actual),
            line=dict(color=CLR["muted"], width=1, dash="dash"),
            annotation_text="Hari ini",
            annotation_font_color=CLR["muted"],
        )

    fig.update_layout(
        **PLOTLY_LAYOUT,
        height=320,
        xaxis=dict(gridcolor=CLR["border"], linecolor=CLR["border"]),
        yaxis=dict(gridcolor=CLR["border"], linecolor=CLR["border"], tickformat=",.0f"),
    )
    st.plotly_chart(fig, use_container_width=True)


def _render_top_merchants(top_merchants: pd.DataFrame) -> None:
    if top_merchants.empty:
        return
    st.markdown(f"<h4>ðŸª Top Merchants</h4>", unsafe_allow_html=True)
    data = top_merchants.head(8).copy()
    data["label"] = data["deskripsi"].str[:28]

    fig = go.Figure(go.Bar(
        y=data["label"],
        x=data["total_debit"],
        orientation="h",
        marker_color=CLR["purple"],
        opacity=0.85,
        text=data["total_debit"].apply(_fmt),
        textposition="outside",
        textfont=dict(size=10, color=CLR["text_dim"]),
        hovertemplate="%{y}<br>%{x:,.0f}<extra></extra>",
    ))
    fig.update_layout(
        **PLOTLY_LAYOUT,
        height=320,
        xaxis=dict(gridcolor=CLR["border"], tickformat=",.0f"),
        yaxis=dict(autorange="reversed"),
    )
    st.plotly_chart(fig, use_container_width=True)


def _render_category_table(by_category: pd.DataFrame) -> None:
    if by_category.empty:
        return
    st.markdown(f"<h4>ðŸ—‚ï¸ Kategori Pengeluaran</h4>", unsafe_allow_html=True)
    disp = by_category.copy()
    disp["total"] = disp["total"].apply(_fmt)
    disp["pct"] = disp["pct"].apply(lambda x: f"{x:.1f}%")
    disp.columns = ["Kategori", "Total", "%"]
    st.dataframe(disp, use_container_width=True, hide_index=True, height=320)


# *•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•
# Empty / loading states
# *•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•

def _landing() -> None:
    st.markdown(
        f"""
        <div style='text-align:center;padding:5rem 2rem;'>
          <div style='font-size:4rem;margin-bottom:1rem'>ðŸ’Ž</div>
          <div style='font-size:2rem;font-weight:700;color:{CLR["text"]};margin-bottom:.5rem'>
            Personal Finance Analyzer
          </div>
          <div style='font-size:1rem;color:{CLR["text_dim"]};max-width:480px;margin:0 auto 2rem'>
            Upload mutasi rekening CSV/XLSX dan dapatkan insight keuangan
            otomatis *€” kategorisasi, health score, story, subscription detector, dan simulator.
          </div>
          <div style='font-size:.85rem;color:{CLR["muted"]};padding:1rem 1.5rem;background:{CLR["card"]};border:1px solid {CLR["border"]};border-radius:12px;display:inline-block;text-align:left'>
            <b style='color:{CLR["text_dim"]}'>Format kolom minimal:</b><br>
            <code style='color:{CLR["accent"]}'>tanggal</code> &nbsp;
            <code style='color:{CLR["accent"]}'>deskripsi</code> &nbsp;
            <code style='color:{CLR["accent"]}'>debit</code> &nbsp;
            <code style='color:{CLR["accent"]}'>kredit</code>
          </div>
        </div>
        """,
        unsafe_allow_html=True,
    )


# *•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•
# Main
# *•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•

def main() -> None:
    _setup()
    opts = _sidebar()

    # *”€*”€ Determine input *”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€
    file_input = None
    if opts["uploaded"] is not None:
        file_input = opts["uploaded"]
        st.success(f"File: **{opts['uploaded'].name}**")
    elif opts["use_sample"] and SAMPLE_PATH.exists():
        file_input = SAMPLE_PATH
        st.info("Menggunakan **sample data** \u2014 aktifkan upload untuk data sendiri.")

    if file_input is None:
        _landing()
        return

    # *”€*”€ Run pipeline *”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€
    with st.spinner("Menganalisis data..."):
        result = run_pipeline(
            file_input,
            forecast_periods=opts["forecast_days"],
            forecast_method=opts["forecast_method"],
        )

    for err in result.get("errors", []):
        st.warning(err)

    if result["df"].empty:
        st.error("Pipeline gagal — tidak ada data valid.")
        return

    # *”€*”€ Navigation tabs *”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€*”€
    tab1, tab2, tab3, tab4, tab5 = st.tabs([
        "ðŸ“Š  Dashboard",
        "ðŸ“–  Spending Story",
        "ðŸ”„  Subscriptions",
        "ðŸŽ®  Simulator",
        "ðŸ“„  Raw Data",
    ])

    with tab1:
        _tab_dashboard(result)

    with tab2:
        _tab_story(result)

    with tab3:
        _tab_subscriptions(result)

    with tab4:
        _tab_simulator(result)

    with tab5:
        df_disp = result["df"].copy()
        if "tanggal" in df_disp.columns:
            df_disp["tanggal"] = df_disp["tanggal"].dt.strftime("%d %b %Y")
        st.dataframe(df_disp, use_container_width=True, hide_index=True)
        st.caption(f"{len(df_disp):,} transaksi *· {result['summary'].get('date_range', '')}")


# *•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•
# UI primitives
# *•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•*•

def _metric(col, label: str, value: str, delta: str | None, color: str) -> None:
    with col:
        delta_str = delta if delta else ""
        st.metric(label, value, delta=delta_str if delta else None)


def _metric_raw(label: str, value: str, delta: str | None, color: str) -> None:
    muted = CLR["muted"]
    card = CLR["card"]
    border = CLR["border"]
    delta_html = "" if not delta else f"<div style='font-size:.8rem;color:{muted}'>{delta}</div>"
    st.markdown(
        f"""
        <div style='background:{card};border:1px solid {border};border-radius:12px;
                    padding:1rem 1.25rem;margin-bottom:.5rem'>
          <div style='font-size:.72rem;color:{muted};text-transform:uppercase;letter-spacing:.08em'>{label}</div>
          <div style='font-size:1.5rem;font-weight:700;color:{color};margin:.25rem 0'>{value}</div>
          {delta_html}
        </div>
        """,
        unsafe_allow_html=True,
    )


def _fmt(value: float, short: bool = False) -> str:
    try:
        v = float(value)
    except (TypeError, ValueError):
        return "Rp 0"
    sign = "-" if v < 0 else ""
    av = abs(v)
    if short:
        if av >= 1_000_000:
            return f"{sign}Rp {av/1_000_000:.1f}jt"
        if av >= 1_000:
            return f"{sign}Rp {av/1_000:.0f}rb"
        return f"{sign}Rp {av:.0f}"
    return f"{sign}Rp {av:,.0f}".replace(",", ".")


if __name__ == "__main__":
    main()
