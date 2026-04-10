"""
api/main.py -- FastAPI backend for Personal Finance Analyzer.

Endpoints:
  GET  /health                -- server health
  GET  /analyze/sample        -- analyze built-in sample data
  POST /analyze               -- analyze uploaded CSV/XLSX (multipart/form-data)
  POST /simulate              -- run future balance simulation

Run:
  uvicorn api.main:app --reload --port 8000
"""

from __future__ import annotations

import io
import os
import sys
from pathlib import Path
from typing import Any

import pandas as pd
from fastapi import Depends, FastAPI, File, HTTPException, Query, UploadFile
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


class _NamedBuffer(io.BytesIO):
    """`io.BytesIO` subclass that carries a `.name` attribute.

    `io.BytesIO` is a C extension type and does not allow arbitrary
    attribute assignment, so `buf.name = x` would raise `AttributeError`.
    Subclassing adds a normal Python `__dict__`, making `.name` writable.
    """

    def __init__(self, data: bytes, name: str) -> None:
        super().__init__(data)
        self.name = name

# Allow imports from project root
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.pipeline import run_pipeline
from app.simulator import build_category_baseline, savings_impact, simulate_balance
from app.auth import get_user_id, require_auth

SAMPLE_PATH = Path(__file__).parent.parent / "data" / "sample" / "sample_mutasi.csv"

app = FastAPI(
    title="OprexDuit API",
    version="2.0.0",
    description="OprexDuit — personal finance companion backend",
)

app.add_middleware(
    CORSMiddleware,
    # In production set ALLOWED_ORIGINS=https://your-app.vercel.app on Render.
    # Locally defaults to allow all.
    allow_origins=os.environ.get("ALLOWED_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", response_class=HTMLResponse)
def home() -> str:
        """Simple landing page for the root path to avoid 404 on '/'."""
        return """
        <html>
            <head><meta charset="utf-8"><title>OprexDuit API</title></head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial;">
                <h1>🚀 OprexDuit API</h1>
                <p>Backend is running</p>
                <p><a href="/docs">Open API Docs (Swagger)</a></p>
            </body>
        </html>
        """


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

class SimulateRequest(BaseModel):
    adjustments: dict[str, float]           # {kategori: multiplier}
    horizon_months: int = 6
    # Pass summary & monthly inline (from previous /analyze call)
    summary: dict[str, Any]
    monthly: list[dict[str, Any]]
    by_category: list[dict[str, Any]]


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "oprexduit"}


@app.get("/me")
def me(user: dict = Depends(require_auth)) -> dict:
    """Protected endpoint — returns decoded Supabase JWT payload.

    Use this from the frontend to verify the backend accepts the user's token::

        const res = await fetch(`${API_URL}/me`, {
          headers: { Authorization: `Bearer ${session.access_token}` }
        })
    """
    return {
        "user_id": user.get("sub"),
        "email": user.get("email"),
        "role": user.get("role"),
    }


@app.get("/analyze/sample")
def analyze_sample(
    forecast_periods: int = Query(30, ge=7, le=90),
    forecast_method: str = Query("linear_regression"),
):
    """Run pipeline on built-in sample data."""
    if not SAMPLE_PATH.exists():
        raise HTTPException(status_code=404, detail="Sample file not found")
    result = run_pipeline(SAMPLE_PATH, forecast_periods=forecast_periods, forecast_method=forecast_method)
    return _serialize(result)


@app.post("/analyze")
async def analyze_upload(
    file: UploadFile = File(...),
    forecast_periods: int = Query(30, ge=7, le=90),
    forecast_method: str = Query("linear_regression"),
):
    """Analyze an uploaded CSV or XLSX file."""
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in {".csv", ".xlsx", ".xls"}:
        raise HTTPException(status_code=400, detail="Only CSV and XLSX files are supported.")

    content = await file.read()
    buffer = _NamedBuffer(content, file.filename or "upload.csv")

    result = run_pipeline(buffer, forecast_periods=forecast_periods, forecast_method=forecast_method)
    return _serialize(result)


@app.post("/simulate")
def simulate(req: SimulateRequest):
    """Run future balance simulation with category adjustments."""
    monthly_df = pd.DataFrame(req.monthly)
    by_cat_df = pd.DataFrame(req.by_category)

    baseline = build_category_baseline(by_cat_df, monthly_df)

    # Frontend sends percent reductions (0-80). Convert to multipliers (0.2-1.0).
    # e.g. slider=50 → spend 50% of baseline → multiplier 0.5
    converted = {k: (100 - v) / 100 for k, v in req.adjustments.items() if v > 0}

    proj = simulate_balance(
        summary=req.summary,
        monthly=monthly_df,
        baseline=baseline,
        adjustments=converted,
        horizon_months=req.horizon_months,
    )
    impact = savings_impact(baseline, converted, req.horizon_months)

    return {
        "projection": proj.to_dict(orient="records"),
        "impact": impact,
        "baseline": baseline,
    }


# ---------------------------------------------------------------------------
# Serialization helpers
# ---------------------------------------------------------------------------

def _serialize(result: dict) -> dict:
    """Convert pipeline result (contains DataFrames) to JSON-safe dict."""
    health = result.get("health_report")

    return {
        "summary": result["summary"],
        "by_category": _df(result["by_category"]),
        "monthly": _df(result["monthly"]),
        "top_merchants": _df(result["top_merchants"]),
        "income_src": _df(result["income_src"]),
        "timeseries": _df_ts(result["timeseries"]),
        "forecast": _df_fc(result["forecast"]),
        "subscriptions": _df(result["subscriptions"]),
        "sub_total_monthly": result["sub_total_monthly"],
        "health_report": health.to_dict() if health else None,
        "monthly_stories": result["monthly_stories"],
        "overall_story": result["overall_story"],
        "category_baseline": result["category_baseline"],
        "transactions": _df_tx(result["df"]),
        "errors": result["errors"],
    }


def _df(df: pd.DataFrame) -> list[dict]:
    if df is None or df.empty:
        return []
    return df.fillna(0).to_dict(orient="records")


def _df_ts(ts: pd.DataFrame) -> list[dict]:
    """Timeseries has datetime index."""
    if ts is None or ts.empty:
        return []
    ts = ts.reset_index()
    ts["tanggal"] = ts["tanggal"].dt.strftime("%Y-%m-%d")
    return ts.fillna(0).to_dict(orient="records")


def _df_fc(fc: pd.DataFrame) -> list[dict]:
    """Forecast has tanggal column as datetime."""
    if fc is None or fc.empty:
        return []
    fc = fc.copy()
    fc["tanggal"] = fc["tanggal"].dt.strftime("%Y-%m-%d")
    return fc.fillna(0).to_dict(orient="records")


def _df_tx(df: pd.DataFrame) -> list[dict]:
    """Transaction DataFrame -- limit to 500 rows for API."""
    if df is None or df.empty:
        return []
    df = df.copy().head(500)
    if "tanggal" in df.columns:
        df["tanggal"] = df["tanggal"].dt.strftime("%Y-%m-%d")
    return df.fillna("").to_dict(orient="records")
