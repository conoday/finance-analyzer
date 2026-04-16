"""
app/auth.py — FastAPI dependency for Supabase JWT verification.

Every protected endpoint should declare:
    current_user: dict = Depends(require_auth)

The frontend sends the Supabase access token in the Authorization header:
    Authorization: Bearer <supabase_access_token>

The JWT is verified locally using SUPABASE_JWT_SECRET — no round-trip to
Supabase on every request.

Required env var:  SUPABASE_JWT_SECRET
  → Supabase dashboard → Project Settings → API → JWT Secret
"""

from __future__ import annotations

import os
import logging
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import jwt as _jwt
from jwt.exceptions import PyJWTError

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

_bearer = HTTPBearer(auto_error=True)

ALGORITHM = "HS256"


def _get_jwt_secret() -> str:
    secret = os.environ.get("SUPABASE_JWT_SECRET")
    if not secret:
        logger.error("[AUTH] ❌ SUPABASE_JWT_SECRET tidak di-set di environment!")
        raise RuntimeError(
            "SUPABASE_JWT_SECRET is not set. Add it to Render env vars."
        )
    logger.info(f"[AUTH] ✅ SUPABASE_JWT_SECRET ditemukan (panjang: {len(secret)} karakter)")
    return secret


def require_auth(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(_bearer)],
) -> dict:
    """Verify Supabase JWT and return the decoded payload (contains user id, email, role).

    Raises HTTP 401 if the token is missing, expired, or invalid.
    """
    token = credentials.credentials

    # Log token preview (aman: hanya 20 karakter pertama)
    logger.info(f"[AUTH] 🔑 Token diterima: {token[:20]}... (panjang total: {len(token)})")

    # Decode header tanpa verifikasi untuk diagnosa
    try:
        unverified_header = _jwt.get_unverified_header(token)
        logger.info(f"[AUTH] 📋 JWT Header (unverified): {unverified_header}")
    except Exception as header_err:
        logger.warning(f"[AUTH] ⚠️ Gagal decode JWT header: {header_err}")

    # Decode claims tanpa verifikasi untuk diagnosa
    try:
        unverified_claims = _jwt.decode(token, options={"verify_signature": False}, algorithms=["HS256", "RS256"])
        import time
        exp = unverified_claims.get("exp")
        now = int(time.time())
        if exp:
            sisa = exp - now
            logger.info(f"[AUTH] ⏰ Token exp: {exp}, sekarang: {now}, sisa: {sisa}s ({'EXPIRED' if sisa < 0 else 'VALID'})")
        logger.info(f"[AUTH] 📦 Claims: sub={unverified_claims.get('sub')}, email={unverified_claims.get('email')}, role={unverified_claims.get('role')}")
    except Exception as claims_err:
        logger.warning(f"[AUTH] ⚠️ Gagal decode JWT claims: {claims_err}")

    # Verifikasi sesungguhnya
    try:
        secret = _get_jwt_secret()
        payload = _jwt.decode(
            token,
            secret,
            algorithms=[ALGORITHM],
            options={"verify_aud": False},  # Supabase JWTs don't set aud by default
        )
        logger.info(f"[AUTH] ✅ Token valid! user_id={payload.get('sub')}")
    except PyJWTError as exc:
        logger.error(f"[AUTH] ❌ JWT verification GAGAL: {type(exc).__name__}: {exc}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {exc}",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    return payload


def get_user_id(payload: Annotated[dict, Depends(require_auth)]) -> str:
    """Shortcut dependency — returns just the Supabase user UUID (sub claim)."""
    uid = payload.get("sub")
    if not uid:
        logger.error("[AUTH] ❌ Field 'sub' tidak ada di JWT payload!")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User ID missing from token")
    return uid
