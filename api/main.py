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
from typing import Any, Optional

import pandas as pd
from fastapi import Depends, FastAPI, File, Header, HTTPException, Query, Request, UploadFile
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

from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global Exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Maaf, terjadi kesalahan internal pada sistem. Kami sedang memeriksanya."},
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


@app.get("/analyze/me")
def analyze_me(
    forecast_periods: int = Query(30, ge=7, le=90),
    forecast_method: str = Query("linear_regression"),
    user: dict = Depends(require_auth)
):
    """Analyze transactions directly from the user's Supabase database."""
    sb = _supabase()
    if not sb:
        raise HTTPException(status_code=503, detail="Database tidak tersambung.")

    user_id = user.get("sub")
    res = sb.table("transactions").select("*").eq("user_id", user_id).order("date").execute()
    
    rows = res.data or []
    if not rows:
        # Return empty analysis instead of 404 so dashboards don't break
        return {
            "summary": {
                "total_income": 0, "total_expense": 0, "net_cashflow": 0,
                "avg_daily_expense": 0, "transaction_count": 0,
            },
            "by_category": [],
            "monthly": [],
            "forecast": [],
            "daily_trend": [],
            "raw_data": [],
            "message": "Belum ada transaksi. Mulai catat pengeluaranmu!",
        }
    
    df = pd.DataFrame(rows)
    df = df.rename(columns={
        'date': 'Tanggal',
        'description': 'Keterangan',
        'amount': 'Nominal',
    })
    
    def adjust_nominal(row):
        if row['type'] == 'expense':
            return -abs(row['Nominal'])
        return row['Nominal']
    
    df['Nominal'] = df.apply(adjust_nominal, axis=1)

    result = run_pipeline(df, forecast_periods=forecast_periods, forecast_method=forecast_method)
    return _serialize(result)


# ---------------------------------------------------------------------------
# AI endpoints
# ---------------------------------------------------------------------------

class AIInsightRequest(BaseModel):
    summary: dict[str, Any]
    by_category: list[dict[str, Any]]
    monthly: list[dict[str, Any]] = []


class AICategorizeRequest(BaseModel):
    description: str


@app.post("/ai/insight")
def ai_insight(req: AIInsightRequest):
    """Minta insight otomatis dari data keuangan via GLM/DeepSeek/Gemini."""
    try:
        from app.ai_service import get_ai_insight
        return get_ai_insight(req.summary, req.by_category, req.monthly)
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")


@app.post("/ai/categorize")
def ai_categorize(req: AICategorizeRequest):
    """Kategorisasi 1 transaksi via AI."""
    if not req.description or len(req.description.strip()) < 2:
        raise HTTPException(status_code=422, detail="description terlalu pendek")
    try:
        from app.ai_service import ai_categorize
        return ai_categorize(req.description.strip())
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")


# ---------------------------------------------------------------------------
# Shared Budget Room System
# ---------------------------------------------------------------------------
import secrets
import uuid as _uuid
from datetime import datetime, timezone

# ── Supabase client (lazy init, falls back to in-memory if not configured) ──

_sb_client: Any | None = None
_sb_ready: bool = False


def _supabase():
    """Return Supabase client, or None when env vars are absent (dev/test)."""
    global _sb_client, _sb_ready
    if not _sb_ready:
        url = os.environ.get("SUPABASE_URL", "")
        key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
        if url and key:
            try:
                from supabase import create_client  # type: ignore
                _sb_client = create_client(url, key)
            except Exception as exc:
                print(f"[rooms] Supabase init failed — using in-memory fallback: {exc}")
        else:
            print("[rooms] SUPABASE_URL/KEY not set — using in-memory fallback")
        _sb_ready = True
    return _sb_client


# ── In-memory fallback (only used when Supabase is unavailable) ──
_rooms: dict[str, dict] = {}        # room_id  → room object
_invite_index: dict[str, str] = {}  # invite_code → room_id

PLAN_LIMITS: dict[str, int] = {
    "personal":    1,
    "couple":      2,
    "family":      4,
    "group":       8,
    "team":        16,
    "business":    50,
    "corporate":   200,
    "enterprise":  -1,  # unlimited
}

PLAN_PRICES: dict[str, dict] = {
    "personal":  {"label": "Personal",   "price_idr": 0,       "desc": "Untuk 1 orang"},
    "couple":    {"label": "Couple",     "price_idr": 29000,   "desc": "Untuk berdua — pasangan / sahabat"},
    "family":    {"label": "Family",     "price_idr": 49000,   "desc": "Hingga 4 anggota keluarga"},
    "group":     {"label": "Group",      "price_idr": 79000,   "desc": "Hingga 8 orang — komunitas kecil"},
    "team":      {"label": "Team",       "price_idr": 149000,  "desc": "Hingga 16 orang — tim startup"},
    "business":  {"label": "Business",   "price_idr": 299000,  "desc": "Hingga 50 anggota"},
    "corporate": {"label": "Corporate",  "price_idr": 799000,  "desc": "Hingga 200 anggota"},
    "enterprise":{"label": "Enterprise", "price_idr": -1,      "desc": "Tak terbatas — hubungi kami"},
}

def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _member_color(idx: int) -> str:
    palette = ["#14b8a6", "#6366f1", "#f59e0b", "#ec4899",
               "#22c55e", "#3b82f6", "#f97316", "#8b5cf6"]
    return palette[idx % len(palette)]


class CreateRoomRequest(BaseModel):
    plan_type: str = "couple"
    display_name: str
    member_id: str | None = None  # client-generated UUID; created if omitted


class JoinRoomRequest(BaseModel):
    invite_code: str
    display_name: str
    member_id: str | None = None


class UpdateSharedBudgetRequest(BaseModel):
    member_id: str
    budgets: dict[str, float]        # category → limit (personal)
    summary: dict | None = None
    by_category: list[dict] | None = None


class SetSharedBudgetRequest(BaseModel):
    member_id: str                   # must be creator
    shared_budgets: dict[str, float]


# ── Supabase helpers ─────────────────────────────────────────────────────────

def _sb_load_room(room_id: str) -> dict | None:
    """Load a room + members from Supabase. Returns None if not found."""
    sb = _supabase()
    if not sb:
        return None
    res = sb.table("rooms").select("*").eq("room_id", room_id).maybe_single().execute()
    if not res.data:
        return None
    row = res.data
    members_res = (
        sb.table("room_members")
        .select("*")
        .eq("room_id", room_id)
        .order("joined_at")
        .execute()
    )
    row["members"] = members_res.data or []
    return row


def _sb_find_room_by_invite(invite_code: str) -> dict | None:
    """Look up room by invite code from Supabase."""
    sb = _supabase()
    if not sb:
        return None
    res = (
        sb.table("rooms")
        .select("*")
        .eq("invite_code", invite_code)
        .maybe_single()
        .execute()
    )
    if not res.data:
        return None
    row = res.data
    members_res = (
        sb.table("room_members")
        .select("*")
        .eq("room_id", row["room_id"])
        .order("joined_at")
        .execute()
    )
    row["members"] = members_res.data or []
    return row


# ── Route handlers ────────────────────────────────────────────────────────────

@app.get("/plans")
def list_plans():
    """Return all plan tiers with limits and price."""
    return {
        plan: {**info, "max_members": PLAN_LIMITS[plan]}
        for plan, info in PLAN_PRICES.items()
    }


@app.post("/rooms/create")
def create_room(req: CreateRoomRequest):
    """Create a new shared budget room and return invite code."""
    plan = req.plan_type.lower()
    if plan not in PLAN_LIMITS:
        raise HTTPException(status_code=400, detail=f"Plan tidak dikenal: {plan}")

    room_id  = str(_uuid.uuid4())
    member_id = req.member_id or str(_uuid.uuid4())
    created  = _now_iso()

    # Guarantee unique invite code
    invite_code = secrets.token_urlsafe(6).upper()[:8]
    sb = _supabase()
    if sb:
        while sb.table("rooms").select("room_id").eq("invite_code", invite_code).execute().data:
            invite_code = secrets.token_urlsafe(6).upper()[:8]
    else:
        while invite_code in _invite_index:
            invite_code = secrets.token_urlsafe(6).upper()[:8]

    member = {
        "member_id":    member_id,
        "display_name": req.display_name[:32],
        "color":        _member_color(0),
        "budgets":      {},
        "summary":      None,
        "by_category":  [],
        "joined_at":    created,
    }

    if sb:
        sb.table("rooms").insert({
            "room_id":           room_id,
            "invite_code":       invite_code,
            "plan_type":         plan,
            "max_members":       PLAN_LIMITS[plan],
            "creator_member_id": member_id,
            "shared_budgets":    {},
            "created_at":        created,
        }).execute()
        sb.table("room_members").insert({
            "room_id":      room_id,
            "member_id":    member_id,
            "display_name": req.display_name[:32],
            "color":        _member_color(0),
            "budgets":      {},
            "summary":      None,
            "by_category":  [],
            "joined_at":    created,
        }).execute()
    else:
        _rooms[room_id] = {
            "room_id":           room_id,
            "invite_code":       invite_code,
            "plan_type":         plan,
            "max_members":       PLAN_LIMITS[plan],
            "creator_member_id": member_id,
            "created_at":        created,
            "shared_budgets":    {},
            "members":           [member],
        }
        _invite_index[invite_code] = room_id

    return {
        "room_id":     room_id,
        "invite_code": invite_code,
        "plan_type":   plan,
        "member_id":   member_id,
        "max_members": PLAN_LIMITS[plan],
        "plan_info":   PLAN_PRICES[plan],
    }


@app.post("/rooms/join")
def join_room(req: JoinRoomRequest):
    """Join an existing room with an invite code."""
    code = req.invite_code.strip().upper()
    sb = _supabase()

    room = _sb_find_room_by_invite(code) if sb else None
    if not sb:
        room_id = _invite_index.get(code)
        if room_id:
            room = _rooms.get(room_id)

    if not room:
        raise HTTPException(status_code=404, detail="Kode undangan tidak ditemukan atau sudah kedaluwarsa")

    room_id   = room["room_id"]
    max_m     = room["max_members"]
    members   = room.get("members", [])
    count     = len(members)

    if max_m != -1 and count >= max_m:
        raise HTTPException(
            status_code=403,
            detail=f"Room penuh ({count}/{max_m}). Upgrade plan untuk tambah anggota."
        )

    member_id = req.member_id or str(_uuid.uuid4())
    existing_ids = {m["member_id"] for m in members}

    if member_id in existing_ids:
        member = next(m for m in members if m["member_id"] == member_id)
        return {
            "room_id": room_id, "member_id": member_id,
            "plan_type": room["plan_type"], "already_member": True,
            "member": member, "room": _safe_room(room),
        }

    new_member = {
        "room_id":      room_id,
        "member_id":    member_id,
        "display_name": req.display_name[:32],
        "color":        _member_color(count),
        "budgets":      {},
        "summary":      None,
        "by_category":  [],
        "joined_at":    _now_iso(),
    }

    if sb:
        sb.table("room_members").insert(new_member).execute()
        # Reload room to include new member
        room = _sb_load_room(room_id) or room
    else:
        room["members"].append(new_member)

    return {
        "room_id":        room_id,
        "member_id":      member_id,
        "plan_type":      room["plan_type"],
        "already_member": False,
        "room":           _safe_room(room),
    }


@app.get("/rooms/{room_id}")
def get_room(room_id: str):
    """Get full room data including all members' budgets."""
    sb = _supabase()
    room = _sb_load_room(room_id) if sb else _rooms.get(room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room tidak ditemukan")
    return _safe_room(room)


@app.put("/rooms/{room_id}/sync")
def sync_member_data(room_id: str, req: UpdateSharedBudgetRequest):
    """Member syncs their personal budget + financial summary to room."""
    sb = _supabase()
    room = _sb_load_room(room_id) if sb else _rooms.get(room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room tidak ditemukan")

    members = room.get("members", [])
    member = next((m for m in members if m["member_id"] == req.member_id), None)
    if not member:
        raise HTTPException(status_code=404, detail="Member tidak ditemukan di room ini")

    if sb:
        update_payload: dict = {"budgets": req.budgets}
        if req.summary is not None:
            update_payload["summary"] = req.summary
        if req.by_category is not None:
            update_payload["by_category"] = req.by_category
        sb.table("room_members").update(update_payload).eq("room_id", room_id).eq("member_id", req.member_id).execute()
        room = _sb_load_room(room_id) or room
    else:
        member["budgets"] = req.budgets
        if req.summary is not None:
            member["summary"] = req.summary
        if req.by_category is not None:
            member["by_category"] = req.by_category

    return {"ok": True, "room": _safe_room(room)}


@app.put("/rooms/{room_id}/shared-budget")
def update_shared_budget(room_id: str, req: SetSharedBudgetRequest):
    """Update shared budget limits — creator only (server-side enforced)."""
    sb = _supabase()
    room = _sb_load_room(room_id) if sb else _rooms.get(room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room tidak ditemukan")

    # Server-side creator guard — not just UI
    creator_id = room.get("creator_member_id") or (room.get("members", [{}])[0].get("member_id"))
    if req.member_id != creator_id:
        raise HTTPException(status_code=403, detail="Hanya pembuat room yang bisa mengubah shared budget")

    if sb:
        sb.table("rooms").update({"shared_budgets": req.shared_budgets}).eq("room_id", room_id).execute()
        room = _sb_load_room(room_id) or room
    else:
        _rooms[room_id]["shared_budgets"] = req.shared_budgets
        room = _rooms[room_id]

    return {"ok": True, "room": _safe_room(room)}


def _safe_room(room: dict) -> dict:
    """Return room dict safe for JSON serialization."""
    members = room.get("members", [])
    return {
        "room_id":        room["room_id"],
        "invite_code":    room["invite_code"],
        "plan_type":      room["plan_type"],
        "max_members":    room["max_members"],
        "created_at":     room["created_at"],
        "member_count":   len(members),
        "shared_budgets": room.get("shared_budgets", {}),
        "creator_member_id": room.get("creator_member_id"),
        "members": [
            {
                "member_id":    m["member_id"],
                "display_name": m["display_name"],
                "color":        m["color"],
                "budgets":      m.get("budgets") or {},
                "summary":      m.get("summary"),
                "by_category":  m.get("by_category") or [],
                "joined_at":    m["joined_at"],
            }
            for m in members
        ],
        "plan_info": PLAN_PRICES.get(room["plan_type"], {}),
    }


# ---------------------------------------------------------------------------
# Simulate
# ---------------------------------------------------------------------------

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


# ---------------------------------------------------------------------------
# Telegram Bot — Webhook + Account Linking
# ---------------------------------------------------------------------------

@app.post("/telegram/webhook")
async def telegram_webhook(
    request: Request,
    x_telegram_bot_api_secret_token: str = Header(default=""),
):
    """Receive updates pushed by Telegram. Register this URL via /telegram/setup."""
    webhook_secret = os.environ.get("TELEGRAM_WEBHOOK_SECRET", "")
    if webhook_secret and x_telegram_bot_api_secret_token != webhook_secret:
        raise HTTPException(status_code=403, detail="Invalid webhook secret")

    update = await request.json()
    from app.telegram_bot import handle_update
    handle_update(update, _supabase())
    return {"ok": True}


class TelegramLinkRequest(BaseModel):
    link_code: str


@app.post("/telegram/link")
def telegram_link(req: TelegramLinkRequest, user: dict = Depends(require_auth)):
    """Link a Telegram chat to the authenticated user's Supabase account.

    Flow:
      1. User opens bot → /start → bot generates link_code stored in pending_telegram_links.
      2. User enters link_code in OprexDuit Web → Settings → Telegram.
      3. Frontend calls POST /telegram/link (with Bearer JWT).
      4. Backend resolves chat_id from link_code, saves to profiles, confirms on Telegram.
    """
    sb = _supabase()
    if not sb:
        raise HTTPException(status_code=503, detail="Database tidak tersedia")

    user_id = user.get("sub")

    try:
        # Look up pending link — use limit(1) to avoid maybe_single() returning None
        # in some supabase-py versions when no row is found
        normalized_code = req.link_code.strip().upper()
        res = (
            sb.table("pending_telegram_links")
            .select("chat_id,created_at")
            .eq("link_code", normalized_code)
            .limit(1)
            .execute()
        )
        row = (res.data or [])[0] if (res and res.data) else None
        if not row:
            raise HTTPException(status_code=404, detail="Kode tidak ditemukan atau sudah kadaluarsa")

        chat_id = row["chat_id"]

        # Save telegram_chat_id to user profile
        sb.table("profiles").update({
            "telegram_chat_id": chat_id,
            "telegram_linked_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", user_id).execute()

        # Delete used link code
        sb.table("pending_telegram_links").delete().eq("link_code", normalized_code).execute()

        # Send confirmation message to Telegram
        from app.telegram_bot import send_message
        send_message(
            chat_id,
            "✅ <b>Akun OprexDuit berhasil terhubung!</b>\n\n"
            "Sekarang kamu bisa:\n"
            "📝 Catat transaksi langsung di sini\n"
            "📊 Terima laporan harian otomatis\n"
            "⏰ Notif budget saat hampir melebihi limit\n\n"
            "Coba sekarang: ketik <code>50rb makan siang</code> 🚀",
        )

        return {"ok": True, "chat_id": chat_id}

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Gagal menghubungkan: {exc}")


@app.delete("/telegram/unlink")
def telegram_unlink(user: dict = Depends(require_auth)):
    """Remove Telegram link from user's profile."""
    sb = _supabase()
    if not sb:
        raise HTTPException(status_code=503, detail="Database tidak tersedia")
    sb.table("profiles").update({
        "telegram_chat_id": None,
        "telegram_linked_at": None,
    }).eq("id", user.get("sub")).execute()
    return {"ok": True}


# ── Cron-triggered broadcast endpoints ──────────────────────────────────────
# Protect with CRON_SECRET env var. Call from cron-job.org every day:
#   POST https://your-render-app.onrender.com/telegram/daily-report
#   Header: x-cron-secret: <CRON_SECRET>

def _verify_cron(secret: str) -> None:
    expected = os.environ.get("CRON_SECRET", "")
    if expected and secret != expected:
        raise HTTPException(status_code=403, detail="Invalid cron secret")


@app.post("/telegram/daily-report")
def telegram_daily_report(x_cron_secret: str = Header(default="")):
    """Send today's summary to all linked Telegram users. Trigger at 09:00 WIB."""
    _verify_cron(x_cron_secret)
    from app.telegram_bot import send_daily_reports
    count = send_daily_reports(_supabase())
    return {"ok": True, "sent": count}


@app.post("/telegram/weekly-report")
def telegram_weekly_report(x_cron_secret: str = Header(default="")):
    """Send 7-day report to all linked users. Trigger every Monday 08:00 WIB."""
    _verify_cron(x_cron_secret)
    from app.telegram_bot import send_weekly_reports
    count = send_weekly_reports(_supabase())
    return {"ok": True, "sent": count}


@app.post("/telegram/budget-alert")
def telegram_budget_alert(x_cron_secret: str = Header(default="")):
    """Send budget alerts to users above 80% of limit. Trigger daily at 20:00 WIB."""
    _verify_cron(x_cron_secret)
    from app.telegram_bot import send_budget_alerts
    count = send_budget_alerts(_supabase())
    return {"ok": True, "sent": count}

class AIChatRequest(BaseModel):
    message: str
    history: list[dict[str, str]] = []

@app.post("/ai/chat")
def ai_chat(req: AIChatRequest):
    """Obrolan interaktif dengan Asisten AI terkait keuangan user."""
    try:
        from app.ai_service import get_ai_chat_response
        reply = get_ai_chat_response(req.message, req.history)
        return {"reply": reply}
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")


# ---------------------------------------------------------------------------
# Personal Budgets CRUD
# ---------------------------------------------------------------------------

class BudgetUpsertRequest(BaseModel):
    category: str
    monthly_limit: float


@app.get("/budgets")
def get_budgets(user: dict = Depends(require_auth)):
    """Return all personal budget limits for the authenticated user."""
    sb = _supabase()
    if not sb:
        raise HTTPException(status_code=503, detail="Database tidak tersedia")
    res = (
        sb.table("budgets")
        .select("category,monthly_limit,updated_at")
        .eq("user_id", user["sub"])
        .order("category")
        .execute()
    )
    return res.data or []


@app.put("/budgets")
def upsert_budget(req: BudgetUpsertRequest, user: dict = Depends(require_auth)):
    """Create or update a budget limit for one category."""
    if not req.category.strip():
        raise HTTPException(status_code=422, detail="category tidak boleh kosong")
    if req.monthly_limit <= 0:
        raise HTTPException(status_code=422, detail="monthly_limit harus lebih dari 0")

    sb = _supabase()
    if not sb:
        raise HTTPException(status_code=503, detail="Database tidak tersedia")

    sb.table("budgets").upsert(
        {
            "user_id": user["sub"],
            "category": req.category.strip(),
            "monthly_limit": req.monthly_limit,
        },
        on_conflict="user_id,category",
    ).execute()
    return {"ok": True}


@app.delete("/budgets/{category}")
def delete_budget(category: str, user: dict = Depends(require_auth)):
    """Delete a budget limit for one category."""
    sb = _supabase()
    if not sb:
        raise HTTPException(status_code=503, detail="Database tidak tersedia")
    sb.table("budgets").delete().eq("user_id", user["sub"]).eq("category", category).execute()
    return {"ok": True}


# ---------------------------------------------------------------------------
# AI Financial Planner
# ---------------------------------------------------------------------------

class FinancialPlanRequest(BaseModel):
    monthly_income: float
    monthly_expense: float = 0
    current_savings: float = 0
    goals: str
    horizon_months: int = 12


@app.post("/ai/financial-plan")
def ai_financial_plan(req: FinancialPlanRequest):
    """
    Buat rencana keuangan personal via AI.
    Returns: headline, health_score, tips, milestones, budget_allocation, dll.
    """
    try:
        from app.ai_service import get_financial_plan
        return get_financial_plan(
            monthly_income=req.monthly_income,
            monthly_expense=req.monthly_expense,
            goals=req.goals,
            current_savings=req.current_savings,
            horizon_months=req.horizon_months,
        )
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI error: {e}")


# ---------------------------------------------------------------------------
# Split Bill — Receipt Parsing
# ---------------------------------------------------------------------------

@app.post("/split-bill/parse")
async def split_bill_parse(file: UploadFile = File(...)):
    """
    Upload foto struk → AI vision membaca item & harga.
    Returns: { event_name, tax_pct, items: [{name, price, qty}] }
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File harus berupa gambar (image/*).")

    # Limit to 10 MB to prevent memory abuse
    MAX_BYTES = 10 * 1024 * 1024
    image_bytes = await file.read(MAX_BYTES + 1)
    if len(image_bytes) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="Ukuran gambar maksimal 10 MB.")

    try:
        from app.ai_service import parse_receipt_image
        return parse_receipt_image(image_bytes, file.content_type)
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal membaca struk: {e}")


# ---------------------------------------------------------------------------
# Affiliate Products endpoints
# ---------------------------------------------------------------------------

class AffiliateProductCreate(BaseModel):
    name: str
    price: Optional[float] = None
    platform: str  # shopee | tiktokshop | alfagift | other
    affiliate_url: str
    image_url: Optional[str] = None
    description: Optional[str] = None
    is_active: bool = True


class AffiliateProductUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    platform: Optional[str] = None
    affiliate_url: Optional[str] = None
    image_url: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class LinkReportCreate(BaseModel):
    product_id: str
    reason: Optional[str] = None


@app.get("/affiliate/products", tags=["affiliate"])
async def list_affiliate_products(
    platform: Optional[str] = None,
    active_only: bool = True,
    limit: int = 50,
):
    """List affiliate products, optionally filtered by platform."""
    sb = _supabase()
    if not sb:
        raise HTTPException(status_code=503, detail="Database tidak tersambung.")
    try:
        q = sb.table("affiliate_products").select(
            "id,name,price,platform,affiliate_url,image_url,description,is_active,created_at"
        )
        if active_only:
            q = q.eq("is_active", True)
        if platform:
            q = q.eq("platform", platform)
        res = q.order("created_at", desc=True).limit(limit).execute()
        return {"products": res.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/affiliate/products", tags=["affiliate"])
async def create_affiliate_product(
    payload: AffiliateProductCreate,
    user: dict = Depends(require_auth),
):
    """Admin: add a new affiliate product."""
    sb = _supabase()
    if not sb:
        raise HTTPException(status_code=503, detail="Database tidak tersambung.")
    valid_platforms = {"shopee", "tiktokshop", "alfagift", "other"}
    if payload.platform not in valid_platforms:
        raise HTTPException(status_code=400, detail=f"Platform harus salah satu dari: {valid_platforms}")
    try:
        data = payload.dict()
        res = sb.table("affiliate_products").insert(data).execute()
        return {"product": (res.data or [{}])[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/affiliate/products/{product_id}", tags=["affiliate"])
async def update_affiliate_product(
    product_id: str,
    payload: AffiliateProductUpdate,
    user: dict = Depends(require_auth),
):
    """Admin: update an existing affiliate product."""
    sb = _supabase()
    if not sb:
        raise HTTPException(status_code=503, detail="Database tidak tersambung.")
    update_data = {k: v for k, v in payload.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="Tidak ada data yang diupdate.")
    try:
        res = (
            sb.table("affiliate_products")
            .update(update_data)
            .eq("id", product_id)
            .execute()
        )
        rows = res.data or []
        if not rows:
            raise HTTPException(status_code=404, detail="Produk tidak ditemukan.")
        return {"product": rows[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/affiliate/products/{product_id}", tags=["affiliate"])
async def delete_affiliate_product(
    product_id: str,
    user: dict = Depends(require_auth),
):
    """Admin: delete an affiliate product."""
    sb = _supabase()
    if not sb:
        raise HTTPException(status_code=503, detail="Database tidak tersambung.")
    try:
        sb.table("affiliate_products").delete().eq("id", product_id).execute()
        return {"status": "deleted", "id": product_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/affiliate/report", tags=["affiliate"])
async def report_broken_link(
    payload: LinkReportCreate,
    user: dict = Depends(require_auth),
):
    """User: report a broken affiliate link."""
    sb = _supabase()
    if not sb:
        raise HTTPException(status_code=503, detail="Database tidak tersambung.")
    try:
        res = sb.table("link_reports").insert({
            "product_id": payload.product_id,
            "reported_by": user["id"],
            "reason": payload.reason,
        }).execute()
        return {"status": "reported", "report": (res.data or [{}])[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/affiliate/reports", tags=["affiliate"])
async def list_link_reports(
    limit: int = 100,
    user: dict = Depends(require_auth),
):
    """Admin: list broken-link reports with product info."""
    sb = _supabase()
    if not sb:
        raise HTTPException(status_code=503, detail="Database tidak tersambung.")
    try:
        res = (
            sb.table("link_reports")
            .select("id,product_id,reason,created_at,affiliate_products(name,platform,affiliate_url)")
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return {"reports": res.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/affiliate/reports/{report_id}", tags=["affiliate"])
async def delete_link_report(
    report_id: str,
    user: dict = Depends(require_auth),
):
    """Admin: dismiss (delete) a broken-link report."""
    sb = _supabase()
    if not sb:
        raise HTTPException(status_code=503, detail="Database tidak tersambung.")
    try:
        sb.table("link_reports").delete().eq("id", report_id).execute()
        return {"status": "deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Admin — AI API Key Management
# ---------------------------------------------------------------------------
# Protected by ADMIN_SECRET env var.
# Admin Console sends: Authorization: Bearer <ADMIN_SECRET>
#
# Usage flow:
#   1. Admin adds keys via Admin Console UI → POST /admin/api-keys
#   2. Backend reads keys from Supabase instead of env vars
#   3. When a key hits rate-limit → auto-marked in DB → next key is tried
#   4. Admin can reset / deactivate / reorder keys via Admin Console

_ADMIN_SECRET = os.environ.get("ADMIN_SECRET", "")


def _verify_admin(authorization: str = Header(default="")) -> None:
    """Guard for admin-only endpoints. Checks Bearer token against ADMIN_SECRET."""
    if not _ADMIN_SECRET:
        # If ADMIN_SECRET not set, block all requests for safety
        raise HTTPException(
            status_code=503,
            detail="ADMIN_SECRET tidak di-set di server. Set env var ADMIN_SECRET di Render.",
        )
    token = authorization.removeprefix("Bearer ").strip()
    if token != _ADMIN_SECRET:
        raise HTTPException(status_code=403, detail="Unauthorized: invalid admin secret")


class ApiKeyCreate(BaseModel):
    provider: str = "glm"      # 'glm' | 'deepseek' | 'gemini'
    label: str = ""             # friendly name, e.g. "Key 1 - Akun A"
    api_key: str                # actual API key
    priority: int = 0           # lower number = tried first


class ApiKeyUpdate(BaseModel):
    label: Optional[str] = None
    priority: Optional[int] = None
    is_active: Optional[bool] = None
    is_rate_limited: Optional[bool] = None  # manual reset saat True → False


def _mask_key(key: str) -> str:
    """Tampilkan hanya 8 karakter pertama + '...' untuk keamanan."""
    if len(key) <= 8:
        return key
    return key[:8] + "..." + key[-4:]


@app.get("/admin/api-keys", tags=["admin"])
def admin_list_api_keys(_: None = Depends(_verify_admin)):
    """
    Admin: list semua AI API keys.
    Nilai api_key di-mask (hanya prefix 8 char) untuk keamanan.
    """
    sb = _supabase()
    if not sb:
        raise HTTPException(status_code=503, detail="Database tidak tersambung.")
    try:
        res = (
            sb.table("ai_api_keys")
            .select("id,provider,label,priority,is_active,is_rate_limited,rate_limited_at,last_used_at,created_at,api_key")
            .order("provider")
            .order("priority")
            .execute()
        )
        rows = res.data or []
        # Mask the actual key value before returning
        for row in rows:
            row["api_key_preview"] = _mask_key(row.get("api_key", ""))
            del row["api_key"]
        return {"keys": rows}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/admin/api-keys", tags=["admin"])
def admin_add_api_key(req: ApiKeyCreate, _: None = Depends(_verify_admin)):
    """Admin: tambah API key baru ke pool."""
    if not req.api_key.strip():
        raise HTTPException(status_code=422, detail="api_key tidak boleh kosong")
    if req.provider not in ("glm", "deepseek", "gemini"):
        raise HTTPException(status_code=422, detail="provider harus: glm | deepseek | gemini")

    sb = _supabase()
    if not sb:
        raise HTTPException(status_code=503, detail="Database tidak tersambung.")
    try:
        res = sb.table("ai_api_keys").insert({
            "provider":  req.provider,
            "label":     req.label.strip()[:64],
            "api_key":   req.api_key.strip(),
            "priority":  req.priority,
            "is_active": True,
            "is_rate_limited": False,
        }).execute()
        row = (res.data or [{}])[0]
        row["api_key_preview"] = _mask_key(row.get("api_key", ""))
        row.pop("api_key", None)

        # Invalidate cache so backend picks up the new key immediately
        from app.ai_service import _invalidate_cache
        _invalidate_cache(req.provider)

        return {"ok": True, "key": row}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.patch("/admin/api-keys/{key_id}", tags=["admin"])
def admin_update_api_key(key_id: str, req: ApiKeyUpdate, _: None = Depends(_verify_admin)):
    """
    Admin: update label, priority, is_active, atau reset is_rate_limited.
    Kirim hanya field yang ingin diubah.
    """
    payload: dict = {}
    if req.label is not None:
        payload["label"] = req.label.strip()[:64]
    if req.priority is not None:
        payload["priority"] = req.priority
    if req.is_active is not None:
        payload["is_active"] = req.is_active
    if req.is_rate_limited is not None:
        payload["is_rate_limited"] = req.is_rate_limited
        if not req.is_rate_limited:
            payload["rate_limited_at"] = None  # reset timestamp juga

    if not payload:
        raise HTTPException(status_code=422, detail="Tidak ada field yang diupdate")

    sb = _supabase()
    if not sb:
        raise HTTPException(status_code=503, detail="Database tidak tersambung.")
    try:
        res = (
            sb.table("ai_api_keys")
            .update(payload)
            .eq("id", key_id)
            .execute()
        )
        row = (res.data or [{}])[0]

        # Invalidate cache untuk provider ini
        from app.ai_service import _invalidate_cache
        _invalidate_cache(row.get("provider", "glm"))

        row["api_key_preview"] = _mask_key(row.get("api_key", ""))
        row.pop("api_key", None)
        return {"ok": True, "key": row}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/admin/api-keys/{key_id}", tags=["admin"])
def admin_delete_api_key(key_id: str, _: None = Depends(_verify_admin)):
    """Admin: hapus API key permanen dari pool."""
    sb = _supabase()
    if not sb:
        raise HTTPException(status_code=503, detail="Database tidak tersambung.")
    try:
        # Fetch provider dulu sebelum delete (untuk invalidate cache)
        res = sb.table("ai_api_keys").select("provider").eq("id", key_id).maybe_single().execute()
        provider = (res.data or {}).get("provider", "glm")

        sb.table("ai_api_keys").delete().eq("id", key_id).execute()

        from app.ai_service import _invalidate_cache
        _invalidate_cache(provider)

        return {"ok": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Transaction management
# ---------------------------------------------------------------------------

@app.delete("/transactions/{tx_id}", tags=["transactions"])
def delete_transaction(tx_id: str, user: dict = Depends(require_auth)):
    """Delete a transaction. Admin can delete any; regular user only their own."""
    sb = _supabase()
    if not sb:
        raise HTTPException(status_code=503, detail="Database tidak tersambung.")
    try:
        user_id = user.get("sub")
        is_admin = user.get("role") == "admin"

        # Verify ownership (unless admin)
        if not is_admin:
            check = sb.table("transactions").select("user_id").eq("id", tx_id).maybe_single().execute()
            if not check.data:
                raise HTTPException(status_code=404, detail="Transaksi tidak ditemukan.")
            if check.data.get("user_id") != user_id:
                raise HTTPException(status_code=403, detail="Tidak diizinkan menghapus transaksi orang lain.")

        sb.table("transactions").delete().eq("id", tx_id).execute()
        return {"ok": True, "deleted_id": tx_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Admin: Stats & User Management
# ---------------------------------------------------------------------------

@app.get("/admin/stats", tags=["admin"])
def admin_stats(_: None = Depends(_verify_admin)):
    """Admin: get system-wide statistics for dashboard."""
    sb = _supabase()
    if not sb:
        raise HTTPException(status_code=503, detail="Database tidak tersambung.")
    try:
        from datetime import datetime, timezone, timedelta
        _wib = timezone(timedelta(hours=7))
        today = datetime.now(_wib).date()
        month_start = today.replace(day=1).isoformat()

        # Users
        profiles = sb.table("profiles").select("id", count="exact").execute()
        user_count = profiles.count if profiles.count is not None else len(profiles.data or [])

        # Telegram users (have telegram_chat_id)
        tg_profiles = (
            sb.table("profiles")
            .select("id", count="exact")
            .not_.is_("telegram_chat_id", "null")
            .execute()
        )
        telegram_user_count = tg_profiles.count if tg_profiles.count is not None else len(tg_profiles.data or [])

        # Transactions today
        tx_today = (
            sb.table("transactions")
            .select("id", count="exact")
            .eq("date", today.isoformat())
            .execute()
        )
        transactions_today = tx_today.count if tx_today.count is not None else len(tx_today.data or [])

        # Transactions this month
        tx_month = (
            sb.table("transactions")
            .select("id", count="exact")
            .gte("date", month_start)
            .execute()
        )
        transactions_month = tx_month.count if tx_month.count is not None else len(tx_month.data or [])

        # Total income/expense this month
        tx_month_data = (
            sb.table("transactions")
            .select("amount,type")
            .gte("date", month_start)
            .execute()
        )
        total_income = sum(t["amount"] for t in (tx_month_data.data or []) if t.get("type") == "income")
        total_expense = sum(t["amount"] for t in (tx_month_data.data or []) if t.get("type") == "expense")

        # Affiliate products
        products = sb.table("affiliate_products").select("id", count="exact").execute()
        product_count = products.count if products.count is not None else len(products.data or [])

        # Link reports
        reports = sb.table("link_reports").select("id", count="exact").execute()
        report_count = reports.count if reports.count is not None else len(reports.data or [])

        # Active rooms
        rooms = sb.table("rooms").select("room_id", count="exact").execute()
        room_count = rooms.count if rooms.count is not None else len(rooms.data or [])

        # AI API keys active
        try:
            keys = (
                sb.table("ai_api_keys")
                .select("id", count="exact")
                .eq("is_active", True)
                .execute()
            )
            active_keys = keys.count if keys.count is not None else len(keys.data or [])
        except Exception:
            active_keys = 0

        return {
            "user_count": user_count,
            "telegram_user_count": telegram_user_count,
            "transactions_today": transactions_today,
            "transactions_month": transactions_month,
            "total_income_month": total_income,
            "total_expense_month": total_expense,
            "affiliate_product_count": product_count,
            "report_count": report_count,
            "room_count": room_count,
            "active_ai_keys": active_keys,
            "date": today.isoformat(),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/admin/users", tags=["admin"])
def admin_list_users(
    search: str = "",
    limit: int = 50,
    offset: int = 0,
    _: None = Depends(_verify_admin),
):
    """Admin: list all users with stats."""
    sb = _supabase()
    if not sb:
        raise HTTPException(status_code=503, detail="Database tidak tersambung.")
    try:
        q = sb.table("profiles").select("id,full_name,telegram_chat_id,created_at")
        if search:
            q = q.ilike("full_name", f"%{search}%")
        q = q.order("created_at", desc=True).range(offset, offset + limit - 1)
        res = q.execute()
        users = res.data or []

        # Enrich with transaction count per user
        for u in users:
            try:
                tx_res = (
                    sb.table("transactions")
                    .select("id", count="exact")
                    .eq("user_id", u["id"])
                    .execute()
                )
                u["transaction_count"] = tx_res.count if tx_res.count is not None else len(tx_res.data or [])
            except Exception:
                u["transaction_count"] = 0

        return {"users": users, "count": len(users)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/admin/transactions", tags=["admin"])
def admin_list_transactions(
    user_id: str = "",
    type: str = "",
    date_from: str = "",
    date_to: str = "",
    limit: int = 50,
    offset: int = 0,
    _: None = Depends(_verify_admin),
):
    """Admin: list all transactions with filters."""
    sb = _supabase()
    if not sb:
        raise HTTPException(status_code=503, detail="Database tidak tersambung.")
    try:
        q = sb.table("transactions").select(
            "id,user_id,date,description,amount,type,category_raw,source,scope,created_at"
        )
        if user_id:
            q = q.eq("user_id", user_id)
        if type:
            q = q.eq("type", type)
        if date_from:
            q = q.gte("date", date_from)
        if date_to:
            q = q.lte("date", date_to)
        q = q.order("date", desc=True).range(offset, offset + limit - 1)
        res = q.execute()
        return {"transactions": res.data or [], "count": len(res.data or [])}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Admin: AI Error Logs
# ---------------------------------------------------------------------------

@app.get("/admin/ai-logs", tags=["admin"])
def admin_ai_logs(_: None = Depends(_verify_admin)):
    """Admin: return in-memory AI error/rate-limit log (last 100 events)."""
    from app.ai_service import get_ai_error_logs
    return {"logs": get_ai_error_logs()}
