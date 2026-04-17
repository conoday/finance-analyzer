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
        "model":    "glm-4.6",
        # Cek 3 key secara berurutan; pakai yang pertama terisi
        "key_envs": ["GLM_API_KEY", "GLM_API_KEY_2", "GLM_API_KEY_3"],
    },
    "deepseek": {
        "base_url": "https://api.deepseek.com/v1",
        "model":    "deepseek-chat",
        "key_envs": ["DEEPSEEK_API_KEY"],
    },
    "gemini": {
        "base_url": "https://generativelanguage.googleapis.com/v1beta/openai/",
        "model":    "gemini-2.0-flash",
        "key_envs": ["GEMINI_API_KEY"],
    },
}

# Error classes yang menandakan key ini sudah habis/rate-limited di GLM
_QUOTA_ERRORS = ("rate_limit", "quota", "insufficient_quota", "exceeded", "429")


def _get_glm_keys() -> list[str]:
    """Kembalikan semua GLM API key yang sudah di-set (non-empty)."""
    return [
        v for env in _PROVIDERS["glm"]["key_envs"]
        if (v := os.environ.get(env, "").strip())
    ]


def _get_client(api_key: str | None = None):
    """
    Buat OpenAI client sesuai AI_PROVIDER di env.

    Untuk GLM: jika api_key di-pass, pakai key itu (digunakan saat fallback).
    Jika tidak di-pass, pakai key pertama yang tersedia.
    """
    from openai import OpenAI

    provider_name = os.environ.get("AI_PROVIDER", "glm").lower()
    cfg = _PROVIDERS.get(provider_name, _PROVIDERS["glm"])

    if api_key is None:
        # Ambil key pertama yang terisi
        for env in cfg["key_envs"]:
            api_key = os.environ.get(env, "").strip()
            if api_key:
                break

    if not api_key:
        envs = ", ".join(cfg["key_envs"])
        raise ValueError(
            f"API key untuk provider '{provider_name}' belum di-set. "
            f"Set salah satu env var berikut di Render: {envs}"
        )

    return OpenAI(api_key=api_key, base_url=cfg["base_url"]), cfg["model"]


def _call_with_fallback(fn, **kwargs):
    """
    Jalankan fn(client, model, **kwargs) dengan fallback key GLM.

    Jika provider bukan GLM, jalan normal tanpa fallback.
    Jika GLM dan key pertama rate-limit / quota habis, coba key berikutnya.
    """
    provider_name = os.environ.get("AI_PROVIDER", "glm").lower()

    if provider_name != "glm":
        client, model = _get_client()
        return fn(client, model, **kwargs)

    keys = _get_glm_keys()
    if not keys:
        raise ValueError(
            "Belum ada GLM API key yang di-set. "
            "Set GLM_API_KEY (dan opsional GLM_API_KEY_2, GLM_API_KEY_3) di Render."
        )

    last_err: Exception = RuntimeError("No keys available")
    for key in keys:
        try:
            client, model = _get_client(api_key=key)
            return fn(client, model, **kwargs)
        except Exception as e:
            err_str = str(e).lower()
            if any(q in err_str for q in _QUOTA_ERRORS):
                last_err = e
                continue  # coba key berikutnya
            raise  # error lain (network, bad request, dll) langsung raise

    raise last_err  # semua key habis


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
    import json

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

    def _do(client, model):
        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=400,
            temperature=0.4,
            response_format={"type": "json_object"},
        )
        raw = response.choices[0].message.content or "{}"
        return json.loads(raw)

    parsed = _call_with_fallback(_do)
    return {
        "headline": parsed.get("headline", ""),
        "tips": parsed.get("tips", []),
        "warn": parsed.get("warn", []),
    }


def get_financial_plan(
    monthly_income: float,
    monthly_expense: float,
    goals: str,
    current_savings: float = 0,
    horizon_months: int = 12,
) -> dict:
    """
    Buat rencana keuangan personal berdasarkan pemasukan, pengeluaran, & tujuan.

    Returns dict:
        {
          "headline": str,
          "health_score": int (0-100),
          "savings_rate_now": float,
          "savings_rate_target": float,
          "monthly_savings_needed": float,
          "tips": list[str],
          "warn": list[str],
          "milestones": [{"label": str, "months": int, "amount": float}],
          "budget_allocation": [{"category": str, "pct": int, "color": str}],
        }
    """
    import json

    net = monthly_income - monthly_expense
    savings_rate = round((net / monthly_income * 100) if monthly_income > 0 else 0, 1)

    prompt = (
        f"Bantu buat rencana keuangan personal.\n"
        f"Data keuangan:\n"
        f"- Pemasukan bulanan: Rp {monthly_income:,.0f}\n"
        f"- Pengeluaran bulanan: Rp {monthly_expense:,.0f}\n"
        f"- Net cashflow: Rp {net:,.0f}\n"
        f"- Savings rate saat ini: {savings_rate}%\n"
        f"- Tabungan saat ini: Rp {current_savings:,.0f}\n"
        f"- Tujuan keuangan: {goals}\n"
        f"- Horizon waktu: {horizon_months} bulan\n\n"
        "Buat rencana dalam format JSON:\n"
        "{\n"
        '  "headline": "kalimat singkat kondisi & rekomendasi utama",\n'
        '  "health_score": (angka 0-100 seberapa sehat kondisi keuangan),\n'
        '  "savings_rate_now": (savings rate saat ini dalam %),\n'
        '  "savings_rate_target": (savings rate yang sebaiknya dicapai dalam %),\n'
        '  "monthly_savings_needed": (jumlah tabungan bulanan yang perlu ditarget dalam Rp),\n'
        '  "tips": ["tip konkret 1", "tip konkret 2", "tip konkret 3", "tip 4"],\n'
        '  "warn": ["peringatan/risiko 1", ...],\n'
        '  "milestones": [\n'
        '    {"label": "nama milestone", "months": bulan_ke_berapa, "amount": jumlah_Rp},\n'
        '    ...\n'
        '  ],\n'
        '  "budget_allocation": [\n'
        '    {"category": "Tabungan/Investasi", "pct": 20, "color": "#14b8a6"},\n'
        '    {"category": "Kebutuhan Pokok", "pct": 50, "color": "#6366f1"},\n'
        '    {"category": "Hiburan & Lifestyle", "pct": 20, "color": "#f59e0b"},\n'
        '    {"category": "Dana Darurat", "pct": 10, "color": "#22c55e"}\n'
        '  ]\n'
        "}\n"
        "Jawab bahasa Indonesia, realistis, fokus ke tujuan yang disebutkan."
    )

    def _do(client, model):
        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=800,
            temperature=0.5,
            response_format={"type": "json_object"},
        )
        raw = response.choices[0].message.content or "{}"
        return json.loads(raw)

    parsed = _call_with_fallback(_do)

    # Normalize & provide fallback values
    return {
        "headline": parsed.get("headline", ""),
        "health_score": int(parsed.get("health_score", 50)),
        "savings_rate_now": float(parsed.get("savings_rate_now", savings_rate)),
        "savings_rate_target": float(parsed.get("savings_rate_target", 20)),
        "monthly_savings_needed": float(parsed.get("monthly_savings_needed", 0)),
        "tips": parsed.get("tips", []),
        "warn": parsed.get("warn", []),
        "milestones": parsed.get("milestones", []),
        "budget_allocation": parsed.get("budget_allocation", []),
    }


def parse_receipt_image(image_bytes: bytes, content_type: str) -> dict:
    """
    Baca foto struk belanja/restoran via AI vision.

    Returns:
        {
          "event_name": str | None,
          "tax_pct": int | None,
          "items": [{"name": str, "price": float, "qty": int}],
        }
    """
    import json
    import base64

    provider_name = os.environ.get("AI_PROVIDER", "glm").lower()
    b64 = base64.b64encode(image_bytes).decode("utf-8")
    image_url = f"data:{content_type};base64,{b64}"

    prompt = (
        "Baca struk/receipt ini. Ekstrak semua item beserta harga dan kuantitas.\n"
        "Kembalikan dalam format JSON:\n"
        "{\n"
        '  "event_name": "nama restoran atau acara jika ada, null jika tidak ada",\n'
        '  "tax_pct": (persentase pajak jika tertulis, null jika tidak ada),\n'
        '  "items": [\n'
        '    {"name": "nama item", "price": harga_satuan_dalam_angka, "qty": jumlah},\n'
        '    ...\n'
        '  ]\n'
        "}\n"
        "Harga dalam Rupiah (tanpa simbol). Qty default 1 jika tidak disebutkan."
    )

    def _do(client, model):
        # GLM pakai model vision khusus
        used_model = "glm-4v-flash" if provider_name == "glm" else model
        response = client.chat.completions.create(
            model=used_model,
            messages=[{
                "role": "user",
                "content": [
                    {"type": "image_url", "image_url": {"url": image_url}},
                    {"type": "text", "text": prompt},
                ],
            }],
            max_tokens=600,
            temperature=0.1,
            response_format={"type": "json_object"},
        )
        raw = response.choices[0].message.content or "{}"
        return json.loads(raw)

    parsed = _call_with_fallback(_do)

    return {
        "event_name": parsed.get("event_name"),
        "tax_pct": parsed.get("tax_pct"),
        "items": [
            {
                "name": str(it.get("name", "")),
                "price": float(it.get("price", 0)),
                "qty": int(it.get("qty", 1)),
            }
            for it in parsed.get("items", [])
            if it.get("name") and float(it.get("price", 0)) > 0
        ],
    }


def ai_categorize(description: str) -> dict[str, str]:
    """
    Kategorisasi 1 transaksi via AI (fallback dari rule-based).

    Returns: {"kategori": "...", "tipe": "income" | "expense"}
    """
    import json

    prompt = (
        f'Transaksi: "{description}"\n'
        "Kategorikan ke salah satu: Gaji, Transfer Masuk, Refund, E-Wallet, "
        "Transportasi, Fast Food, Kuliner, Food Delivery, Minimarket, Supermarket, "
        "Streaming, Gaming, Pulsa & Data, Listrik, Air, Internet, Asuransi, "
        "Kesehatan, Pendidikan, Belanja, Lainnya.\n"
        'JSON: {"kategori": "...", "tipe": "income" atau "expense"}'
    )

    def _do(client, model):
        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=60,
            temperature=0.1,
            response_format={"type": "json_object"},
        )
        raw = response.choices[0].message.content or "{}"
        return json.loads(raw)

    parsed = _call_with_fallback(_do)
    return {
        "kategori": parsed.get("kategori", "Lainnya"),
        "tipe": parsed.get("tipe", "expense"),
    }

def parse_split_bill_text(text: str) -> list[dict]:
    """
    Baca daftar belanja manual via AI.
    
    Returns:
        [{"name": "barang a", "price": 15000, "qty": 3}, ...]
    """
    import json

    prompt = (
        "Ekstrak daftar belanja berikut menjadi JSON array.\n"
        "Teks:\n"
        f"{text}\n\n"
        "Kembalikan tepat sebuah JSON dengan format:\n"
        "{\n"
        '  "items": [\n'
        '    {"name": "nama barang", "price": angka_harga_satuan, "qty": angka_jumlah},\n'
        '    ...\n'
        '  ]\n'
        "}\n"
        "Abaikan jika ada kalimat yang bukan barang belanjaan. Pastikan hasil valid JSON."
    )

    def _do(client, model):
        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=600,
            temperature=0.1,
            response_format={"type": "json_object"},
        )
        raw = response.choices[0].message.content or "{}"
        return json.loads(raw)

    parsed = _call_with_fallback(_do)
    return [
        {
            "name": str(it.get("name", "")),
            "price": float(it.get("price", 0)),
            "qty": int(it.get("qty", 1)),
        }
        for it in parsed.get("items", [])
        if it.get("name") and float(it.get("price", 0)) > 0
    ]

def get_ai_chat_response(message: str, history: list[dict[str, str]] = []) -> str:
    """
    Kirim obrolan User ke AI Assistant (GLM).
    history format: [{"role": "user"|"assistant", "content": "..."}]
    """
    system_prompt = (
        "Kamu adalah asisten keuangan OprexDuit yang pintar, ramah, dan solutif. "
        "Bantu pengguna mengelola uang, mencari insight, dan menjawab pertanyaan. "
        "Gunakan bahasa Indonesia yang santai tapi profesional. Jangan bertele-tele."
    )
    
    messages = [{"role": "system", "content": system_prompt}]
    for h in history[-5:]: # ambil 5 context terakhir
        messages.append({"role": h.get("role", "user"), "content": h.get("content", "")})
    messages.append({"role": "user", "content": message})
    
    def _do(client, model):
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            max_tokens=600,
            temperature=0.7,
        )
        return response.choices[0].message.content or "Maaf, aku tidak bisa menjawab saat ini."

    return _call_with_fallback(_do)
