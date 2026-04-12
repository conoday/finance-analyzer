"""
app/ai_service.py — AI provider integration (GLM / DeepSeek / Gemini).

Semua provider pakai OpenAI-compatible chat API agar mudah swap.
Provider dipilih via env var AI_PROVIDER (default: glm).

Usage:
    from app.ai_service import get_ai_insight
    result = get_ai_insight(summary, by_category)
"""

from __future__ import annotations

import os
from typing import Any

# ---------------------------------------------------------------------------
# Provider config
# ---------------------------------------------------------------------------

_PROVIDERS: dict[str, dict] = {
    "glm": {
        "base_url": "https://open.bigmodel.cn/api/paas/v4/",
        "model":    "glm-4-flash",
        "key_env":  "GLM_API_KEY",
    },
    "deepseek": {
        "base_url": "https://api.deepseek.com/v1",
        "model":    "deepseek-chat",
        "key_env":  "DEEPSEEK_API_KEY",
    },
    "gemini": {
        "base_url": "https://generativelanguage.googleapis.com/v1beta/openai/",
        "model":    "gemini-2.0-flash",
        "key_env":  "GEMINI_API_KEY",
    },
}


def _get_client():
    """Buat OpenAI client sesuai AI_PROVIDER di env."""
    from openai import OpenAI

    provider_name = os.environ.get("AI_PROVIDER", "glm").lower()
    cfg = _PROVIDERS.get(provider_name, _PROVIDERS["glm"])

    api_key = os.environ.get(cfg["key_env"], "")
    if not api_key:
        raise ValueError(
            f"API key untuk provider '{provider_name}' belum di-set. "
            f"Set env var {cfg['key_env']} di Render."
        )

    return OpenAI(api_key=api_key, base_url=cfg["base_url"]), cfg["model"]


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def get_ai_insight(
    summary: dict[str, Any],
    by_category: list[dict[str, Any]],
    monthly: list[dict[str, Any]] | None = None,
) -> dict[str, str]:
    """
    Minta AI buat insight singkat dari data keuangan.

    Returns dict:
        {
          "headline":   string singkat 1 kalimat,
          "tips":       list 3 tips konkret,
          "warn":       list kategori berpotensi boros (bisa kosong),
        }
    """
    client, model = _get_client()

    # Format ringkas untuk prompt agar hemat token
    income = summary.get("total_income", 0)
    expense = summary.get("total_expense", 0)
    net = summary.get("net_cashflow", 0)
    savings_rate = round((net / income * 100) if income > 0 else 0, 1)

    top_cats = sorted(by_category, key=lambda x: x.get("total", 0), reverse=True)[:5]
    cats_str = ", ".join(f"{c['kategori']} {c['pct']:.0f}%" for c in top_cats)

    prompt = (
        f"Data keuangan bulan ini (Rupiah):\n"
        f"- Pemasukan: {income:,.0f}\n"
        f"- Pengeluaran: {expense:,.0f}\n"
        f"- Net cashflow: {net:,.0f}\n"
        f"- Savings rate: {savings_rate}%\n"
        f"- Top 5 kategori pengeluaran: {cats_str}\n\n"
        "Berikan dalam format JSON:\n"
        "{\n"
        '  "headline": "satu kalimat ringkasan kondisi keuangan",\n'
        '  "tips": ["tip 1", "tip 2", "tip 3"],\n'
        '  "warn": ["kategori boros 1", ...]\n'
        "}\n"
        "Jawab bahasa Indonesia, ringkas, to the point."
    )

    response = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=400,
        temperature=0.4,
        response_format={"type": "json_object"},
    )

    import json
    raw = response.choices[0].message.content or "{}"
    parsed = json.loads(raw)

    return {
        "headline": parsed.get("headline", ""),
        "tips": parsed.get("tips", []),
        "warn": parsed.get("warn", []),
    }


def ai_categorize(description: str) -> dict[str, str]:
    """
    Kategorisasi 1 transaksi via AI (fallback dari rule-based).

    Returns: {"kategori": "...", "tipe": "income" | "expense"}
    """
    client, model = _get_client()

    prompt = (
        f'Transaksi: "{description}"\n'
        "Kategorikan ke salah satu: Gaji, Transfer Masuk, Refund, E-Wallet, "
        "Transportasi, Fast Food, Kuliner, Food Delivery, Minimarket, Supermarket, "
        "Streaming, Gaming, Pulsa & Data, Listrik, Air, Internet, Asuransi, "
        "Kesehatan, Pendidikan, Belanja, Lainnya.\n"
        'JSON: {"kategori": "...", "tipe": "income" atau "expense"}'
    )

    response = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=60,
        temperature=0.1,
        response_format={"type": "json_object"},
    )

    import json
    raw = response.choices[0].message.content or "{}"
    parsed = json.loads(raw)
    return {
        "kategori": parsed.get("kategori", "Lainnya"),
        "tipe": parsed.get("tipe", "expense"),
    }
