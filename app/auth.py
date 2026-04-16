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
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import jwt as _jwt
from jwt.exceptions import PyJWTError

_bearer = HTTPBearer(auto_error=True)

ALGORITHM = "HS256"


def _get_jwt_secret() -> str:
    secret = os.environ.get("SUPABASE_JWT_SECRET")
    if not secret:
        raise RuntimeError(
            "SUPABASE_JWT_SECRET is not set. Add it to Render env vars."
        )
    return secret


def require_auth(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(_bearer)],
) -> dict:
    """Verify Supabase JWT and return the decoded payload (contains user id, email, role).

    Raises HTTP 401 if the token is missing, expired, or invalid.
    """
    token = credentials.credentials
    try:
        payload = _jwt.decode(
            token,
            _get_jwt_secret(),
            algorithms=[ALGORITHM],
            options={"verify_aud": False},  # Supabase JWTs don't set aud by default
        )
    except PyJWTError as exc:
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
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User ID missing from token")
    return uid
