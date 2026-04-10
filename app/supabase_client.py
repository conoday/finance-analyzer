"""
app/supabase_client.py — Admin Supabase client (server-side only).

Uses SUPABASE_SERVICE_ROLE_KEY which bypasses Row Level Security.
Never expose this key to the frontend.

Usage:
    from app.supabase_client import get_admin_client

    sb = get_admin_client()
    sb.table("transactions").select("*").eq("user_id", uid).execute()
"""

from __future__ import annotations

import os
from functools import lru_cache

from supabase import Client, create_client


@lru_cache(maxsize=1)
def get_admin_client() -> Client:
    """Return a singleton Supabase admin client.

    Raises RuntimeError if the required env vars are missing so the error
    surfaces early at startup rather than on the first request.
    """
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

    if not url or not key:
        raise RuntimeError(
            "Missing Supabase env vars: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY "
            "must be set on the server (Render / .env)."
        )

    return create_client(url, key)
