"""
app/forecasting.py — Forecasting cashflow untuk Personal Finance Analyzer.

Model yang tersedia:
1. Moving Average  — baseline, interpretable
2. Linear Regression — scikit-learn, sedikit lebih adaptif

Kedua model bisa diganti atau dikombinasikan tanpa mengubah interface.
"""

from __future__ import annotations

from typing import Literal

import numpy as np
import pandas as pd


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def prepare_timeseries(df: pd.DataFrame) -> pd.DataFrame:
    """
    Buat daily net cashflow series dari dataframe transaksi.

    Returns
    -------
    DataFrame dengan kolom: tanggal (index), net_harian, kumulatif
    """
    if df.empty:
        return pd.DataFrame(columns=["net_harian", "kumulatif"])

    df = df.copy()
    df["amount"] = 0.0

    if "kredit" in df.columns:
        df.loc[df["tipe"] == "income", "amount"] = df.loc[df["tipe"] == "income", "kredit"].fillna(0)
    if "debit" in df.columns:
        df.loc[df["tipe"] == "expense", "amount"] -= df.loc[df["tipe"] == "expense", "debit"].fillna(0)

    daily = (
        df.groupby("tanggal")["amount"]
        .sum()
        .rename("net_harian")
        .sort_index()
    )

    # Isi tanggal yang tidak ada transaksi
    date_range = pd.date_range(daily.index.min(), daily.index.max(), freq="D")
    daily = daily.reindex(date_range, fill_value=0.0)
    daily.index.name = "tanggal"

    ts = daily.to_frame()
    ts["kumulatif"] = ts["net_harian"].cumsum()
    return ts


def forecast_cashflow(
    df: pd.DataFrame,
    periods: int = 30,
    method: Literal["moving_average", "linear_regression"] = "linear_regression",
) -> pd.DataFrame:
    """
    Prediksi net cashflow harian untuk N hari ke depan.

    Parameters
    ----------
    df       : DataFrame hasil `prepare_timeseries`
    periods  : Jumlah hari ke depan yang diprediksi
    method   : 'moving_average' atau 'linear_regression'

    Returns
    -------
    DataFrame dengan kolom: tanggal, predicted_net, predicted_kumulatif
    Dilengkapi confidence band: lower, upper (±1 std atau interval prediksi)
    """
    if df.empty or len(df) < 7:
        return pd.DataFrame(columns=["tanggal", "predicted_net", "predicted_kumulatif", "lower", "upper"])

    if method == "moving_average":
        return _forecast_moving_average(df, periods)
    return _forecast_linear_regression(df, periods)


# ---------------------------------------------------------------------------
# Internal: Moving Average
# ---------------------------------------------------------------------------

def _forecast_moving_average(ts: pd.DataFrame, periods: int) -> pd.DataFrame:
    """Prediksi menggunakan rolling mean 7 hari sebagai proxy nilai mendatang."""
    window = min(7, len(ts))
    recent_mean = ts["net_harian"].iloc[-window:].mean()
    recent_std = ts["net_harian"].iloc[-window:].std()
    if np.isnan(recent_std):
        recent_std = 0.0

    last_date = ts.index.max()
    future_dates = pd.date_range(last_date + pd.Timedelta(days=1), periods=periods, freq="D")
    last_kumulatif = ts["kumulatif"].iloc[-1]

    rows = []
    cumulative = last_kumulatif
    for date in future_dates:
        cumulative += recent_mean
        rows.append({
            "tanggal": date,
            "predicted_net": recent_mean,
            "predicted_kumulatif": cumulative,
            "lower": cumulative - recent_std * periods ** 0.5,
            "upper": cumulative + recent_std * periods ** 0.5,
        })
    return pd.DataFrame(rows)


# ---------------------------------------------------------------------------
# Internal: Linear Regression
# ---------------------------------------------------------------------------

def _forecast_linear_regression(ts: pd.DataFrame, periods: int) -> pd.DataFrame:
    """Prediksi menggunakan LinearRegression dari scikit-learn."""
    try:
        from sklearn.linear_model import LinearRegression
    except ImportError:
        return _forecast_moving_average(ts, periods)

    X = np.arange(len(ts)).reshape(-1, 1)
    y_net = ts["net_harian"].values
    y_cum = ts["kumulatif"].values

    model_net = LinearRegression().fit(X, y_net)
    model_cum = LinearRegression().fit(X, y_cum)

    # Residual std sebagai proxy interval
    residuals = y_net - model_net.predict(X)
    std_err = residuals.std()

    last_date = ts.index.max()
    future_dates = pd.date_range(last_date + pd.Timedelta(days=1), periods=periods, freq="D")
    future_idx = np.arange(len(ts), len(ts) + periods).reshape(-1, 1)

    pred_net = model_net.predict(future_idx)
    pred_cum = model_cum.predict(future_idx)

    rows = [
        {
            "tanggal": date,
            "predicted_net": float(pn),
            "predicted_kumulatif": float(pc),
            "lower": float(pc - std_err * (i + 1) ** 0.5),
            "upper": float(pc + std_err * (i + 1) ** 0.5),
        }
        for i, (date, pn, pc) in enumerate(zip(future_dates, pred_net, pred_cum))
    ]
    return pd.DataFrame(rows)
