"""
app/auth.py — FastAPI dependency for Supabase JWT verification.

Every protected endpoint should declare:
    current_user: dict = Depends(require_auth)

Supports both:
  - HS256 → verified using SUPABASE_JWT_SECRET (symmetric)
  - RS256 → verified using Supabase JWKS endpoint (asymmetric, newer projects)

Algorithm is auto-detected from the JWT header — no manual config needed.

Required env vars:
  SUPABASE_JWT_SECRET  → Supabase dashboard → Project Settings → API → JWT Secret
  SUPABASE_URL         → Supabase project URL (needed for RS256 JWKS fallback)
"""

from __future__ import annotations

import os
import time
import logging
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import jwt as _jwt
from jwt import PyJWKClient
from jwt.exceptions import PyJWTError

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

_bearer = HTTPBearer(auto_error=True)

# Cache JWKS client agar tidak fetch ulang setiap request
_jwks_client: PyJWKClient | None = None


def _get_jwks_client() -> PyJWKClient:
    """Return cached PyJWKClient pointing to Supabase JWKS endpoint."""
    global _jwks_client
    if _jwks_client is None:
        supabase_url = os.environ.get("SUPABASE_URL", "").rstrip("/")
        if not supabase_url:
            raise RuntimeError("SUPABASE_URL tidak di-set — dibutuhkan untuk RS256 verification")
        jwks_url = f"{supabase_url}/auth/v1/.well-known/jwks.json"
        logger.info(f"[AUTH] Inisialisasi JWKS client: {jwks_url}")
        _jwks_client = PyJWKClient(jwks_url, cache_keys=True)
    return _jwks_client


def _get_jwt_secret() -> str:
    secret = os.environ.get("SUPABASE_JWT_SECRET", "")
    if not secret:
        logger.error("[AUTH] SUPABASE_JWT_SECRET tidak di-set!")
        raise RuntimeError("SUPABASE_JWT_SECRET is not set. Add it to Render env vars.")
    return secret


def require_auth(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(_bearer)],
) -> dict:
    """Verify Supabase JWT. Auto-detects HS256 (secret) vs RS256 (JWKS).

    Also accepts ADMIN_SECRET token for admin console access — returns a
    synthetic admin payload so admin endpoints don't need separate auth.

    Raises HTTP 401 if the token is missing, expired, or invalid.
    """
    token = credentials.credentials

    # ── 0. Check ADMIN_SECRET first (for admin console) ──────────────────────
    admin_secret = os.environ.get("ADMIN_SECRET", "")
    if admin_secret and token == admin_secret:
        logger.info("[AUTH] Admin access via ADMIN_SECRET")
        return {
            "sub": "admin",
            "email": "superadmin@oprex.com",
            "role": "admin",
            "aud": "authenticated",
        }

    # ── 1. Peek header untuk deteksi algoritma ──────────────────────────────
    try:
        header = _jwt.get_unverified_header(token)
        alg = header.get("alg", "HS256")
        logger.info(f"[AUTH] JWT header: alg={alg}, typ={header.get('typ')}, kid={header.get('kid')}")
    except Exception as e:
        logger.error(f"[AUTH] Gagal baca JWT header: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token format tidak valid: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # ── 2. Peek claims untuk diagnosa (tanpa verifikasi) ─────────────────────
    try:
        unverified = _jwt.decode(
            token,
            options={"verify_signature": False},
            algorithms=["HS256", "RS256", "HS384", "HS512"],
        )
        exp = unverified.get("exp")
        now = int(time.time())
        sisa = (exp - now) if exp else None
        status_exp = "EXPIRED" if (sisa is not None and sisa < 0) else "VALID"
        logger.info(
            f"[AUTH] exp={exp}, now={now}, sisa={sisa}s [{status_exp}] | "
            f"sub={unverified.get('sub')} | email={unverified.get('email')}"
        )
        if sisa is not None and sisa < 0:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token sudah expired. Silakan login ulang.",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"[AUTH] Gagal decode claims (unverified): {e}")

    # ── 3. Verifikasi signature sesuai algoritma ─────────────────────────────
    try:
        if alg == "HS256":
            # Symmetric — gunakan JWT secret
            secret = _get_jwt_secret()
            logger.info(f"[AUTH] Verifikasi HS256 dengan secret (len={len(secret)})")
            payload = _jwt.decode(
                token,
                secret,
                algorithms=["HS256"],
                options={"verify_aud": False},
            )
        else:
            # Asymmetric (RS256, ES256, dll) — gunakan JWKS dari Supabase
            logger.info(f"[AUTH] Verifikasi {alg} via JWKS Supabase")
            try:
                jwks_client = _get_jwks_client()
                signing_key = jwks_client.get_signing_key_from_jwt(token)
            except Exception:
                # Reset cached client so next request re-fetches fresh JWKS
                global _jwks_client
                _jwks_client = None
                raise
            payload = _jwt.decode(
                token,
                signing_key.key,
                algorithms=[alg],
                options={"verify_aud": False},
            )

        logger.info(f"[AUTH] Token valid! user_id={payload.get('sub')}, email={payload.get('email')}")
        return payload

    except PyJWTError as exc:
        logger.error(f"[AUTH] Verifikasi GAGAL [{alg}]: {type(exc).__name__}: {exc}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {exc}",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
    except RuntimeError as exc:
        logger.error(f"[AUTH] Config error: {exc}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc


def get_user_id(payload: Annotated[dict, Depends(require_auth)]) -> str:
    """Shortcut dependency — returns just the Supabase user UUID (sub claim)."""
    uid = payload.get("sub")
    if not uid:
        logger.error("[AUTH] Field 'sub' tidak ada di JWT payload!")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID missing from token",
        )
    return uid
