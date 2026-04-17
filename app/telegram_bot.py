"""app/telegram_bot.py - Telegram Bot handlers for OprexDuit.

Webhook-based (no polling). Telegram sends POST requests to
/telegram/webhook on the FastAPI backend.

No python-telegram-bot required - uses httpx directly.

Commands:
  /start     - Welcome + generate link code
  /link      - Get/refresh link code (disabled once linked to web account)
  /catat     - Record transaction: /catat 50rb makan siang
  /ringkasan - Today's spending summary
  /laporan   - This month's report
  /budget    - Check budget status vs limits
  /belanja   - AI-assisted shopping (affiliate recommendation)
  /bantuan   - Show help
  (free text) - Auto-parsed as transaction input or AI shopping context
"""

from __future__ import annotations

import os
import secrets
from datetime import date, datetime, timedelta, timezone
from typing import Any, Optional

import httpx

from app.telegram_parser import ParsedTx, parse_transaction

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

_WEB_URL = os.environ.get("WEB_URL", "https://oprexduit.vercel.app")

# In-memory state for AI shopping sessions per chat_id
# { str(chat_id): { "step": str, "platform": str, "query": str, "products": [...] } }
_SHOPPING_SESSIONS: dict[str, dict] = {}

# ---------------------------------------------------------------------------
# Telegram API helper
# ---------------------------------------------------------------------------

_TG_API = "https://api.telegram.org/bot{token}/{method}"


def _bot_token() -> str:
    token = os.environ.get("TELEGRAM_BOT_TOKEN", "")
    if not token:
        raise RuntimeError("TELEGRAM_BOT_TOKEN env var not set")
    return token


def send_message(chat_id: int | str, text: str, parse_mode: str = "HTML") -> None:
    """Send a message to a Telegram chat (fire-and-forget)."""
    url = _TG_API.format(token=_bot_token(), method="sendMessage")
    try:
        with httpx.Client(timeout=8) as client:
            client.post(url, json={
                "chat_id": chat_id,
                "text": text,
                "parse_mode": parse_mode,
                "disable_web_page_preview": False,
            })
    except Exception as exc:
        print(f"[telegram] send_message error: {exc}")


def _fmt(amount: float) -> str:
    """Format as Indonesian Rupiah: 1234567 -> Rp1.234.567"""
    return f"Rp{amount:,.0f}".replace(",", ".")


def _progress_bar(pct: float, width: int = 10) -> str:
    filled = min(int(pct / 100 * width), width)
    return "\u2588" * filled + "\u2591" * (width - filled)


# ---------------------------------------------------------------------------
# Main dispatcher
# ---------------------------------------------------------------------------

def handle_update(update: dict, sb_client: Any) -> None:
    """Entry point - called by the FastAPI /telegram/webhook endpoint."""
    message = update.get("message") or update.get("edited_message")
    if not message:
        return

    chat_id: int = message["chat"]["id"]
    text: str = (message.get("text") or "").strip()
    if not text:
        return

    from_data = message.get("from") or {}
    username: str = (
        from_data.get("username")
        or from_data.get("first_name")
        or str(chat_id)
    )

    if text.startswith("/"):
        parts = text.split()
        # Strip @BotName suffix from command (e.g. /start@OprexDuidbot -> /start)
        command = parts[0].lower().split("@")[0]
        args = parts[1:]
        _handle_command(chat_id, command, args, username, sb_client)
    else:
        # Check if user is in a shopping session first
        session = _SHOPPING_SESSIONS.get(str(chat_id))
        if session:
            _handle_shopping_input(chat_id, text, username, sb_client)
        else:
            _handle_free_text(chat_id, text, username, sb_client)


# ---------------------------------------------------------------------------
# Supabase helpers
# ---------------------------------------------------------------------------

def _get_user_id(chat_id: int | str, sb_client: Any) -> Optional[str]:
    """Return user_id from profiles where telegram_chat_id matches."""
    if not sb_client:
        return None
    try:
        res = (
            sb_client.table("profiles")
            .select("id")
            .eq("telegram_chat_id", str(chat_id))
            .limit(1)
            .execute()
        )
        rows = res.data or []
        return rows[0]["id"] if rows else None
    except Exception:
        return None


def _is_linked_to_web(chat_id: int | str, sb_client: Any) -> bool:
    """Check if this Telegram chat is linked to a web (email) account."""
    if not sb_client:
        return False
    try:
        res = (
            sb_client.table("profiles")
            .select("id,email")
            .eq("telegram_chat_id", str(chat_id))
            .limit(1)
            .execute()
        )
        rows = res.data or []
        if not rows:
            return False
        # A web-linked account has a real email (not the internal telegram placeholder)
        email: str = rows[0].get("email") or ""
        return bool(email) and "@telegram.oprexduit.internal" not in email
    except Exception:
        return False


def _store_pending_link(chat_id: int | str, sb_client: Any) -> str:
    """Upsert a fresh link code for this chat_id. Returns the code (uppercase)."""
    code = secrets.token_urlsafe(8).upper()
    if sb_client:
        try:
            sb_client.table("pending_telegram_links").upsert(
                {
                    "chat_id": str(chat_id),
                    "link_code": code,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                },
                on_conflict="chat_id",
            ).execute()
        except Exception as exc:
            print(f"[telegram] store_pending_link error: {exc}")
    return code


def _create_telegram_user(chat_id: int | str, username: str, sb_client: Any) -> Optional[str]:
    """Create a new Supabase auth user for this Telegram chat_id (standalone mode).

    Uses SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY to call the admin REST API.
    Returns the new UUID or None on failure.
    """
    supabase_url = os.environ.get("SUPABASE_URL", "")
    service_role_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    if not supabase_url or not service_role_key:
        print("[telegram] Cannot auto-create user: SUPABASE_URL / SERVICE_ROLE_KEY not set")
        return None

    internal_email = f"tg_{chat_id}@telegram.oprexduit.internal"
    try:
        with httpx.Client(timeout=10) as client:
            resp = client.post(
                f"{supabase_url}/auth/v1/admin/users",
                headers={
                    "Authorization": f"Bearer {service_role_key}",
                    "apikey": service_role_key,
                },
                json={
                    "email": internal_email,
                    "email_confirm": True,
                    "user_metadata": {
                        "telegram_chat_id": str(chat_id),
                        "telegram_username": username,
                        "account_type": "telegram_only",
                    },
                },
            )

        if resp.status_code not in (200, 201):
            print(f"[telegram] Admin create_user failed {resp.status_code}: {resp.text[:200]}")
            return None

        new_user_id: Optional[str] = resp.json().get("id")
        if not new_user_id:
            return None

        if sb_client:
            try:
                sb_client.table("profiles").upsert(
                    {
                        "id": new_user_id,
                        "telegram_chat_id": str(chat_id),
                        "full_name": username,
                    },
                    on_conflict="id",
                ).execute()
            except Exception as exc:
                print(f"[telegram] profile upsert error: {exc}")

        return new_user_id

    except Exception as exc:
        print(f"[telegram] _create_telegram_user error: {exc}")
        return None


def _get_or_create_telegram_user(chat_id: int | str, username: str, sb_client: Any) -> Optional[str]:
    """Return existing user_id or auto-create a Telegram-only Supabase account."""
    user_id = _get_user_id(chat_id, sb_client)
    if user_id:
        return user_id
    return _create_telegram_user(chat_id, username, sb_client)


# ---------------------------------------------------------------------------
# Command handlers
# ---------------------------------------------------------------------------

def _handle_command(
    chat_id: int | str,
    command: str,
    args: list[str],
    username: str,
    sb_client: Any,
) -> None:
    # /link is handled separately - no auto-create needed
    if command == "/link":
        _cmd_link(chat_id, sb_client)
        return

    # All other commands: auto-create Telegram-only account if first use
    user_id = _get_or_create_telegram_user(chat_id, username, sb_client)

    if command == "/start":
        _cmd_start(chat_id, user_id, username, sb_client)
    elif command in ("/catat", "/tambah", "/add"):
        _cmd_catat(chat_id, " ".join(args), user_id, sb_client)
    elif command == "/ringkasan":
        _cmd_ringkasan(chat_id, user_id, sb_client)
    elif command == "/laporan":
        _cmd_laporan(chat_id, user_id, sb_client)
    elif command == "/budget":
        _cmd_budget(chat_id, user_id, sb_client)
    elif command in ("/belanja", "/shop"):
        _cmd_belanja_start(chat_id)
    elif command in ("/bantuan", "/help"):
        _cmd_bantuan(chat_id, sb_client)
    elif command == "/batal":
        _SHOPPING_SESSIONS.pop(str(chat_id), None)
        send_message(chat_id, "\u274e Sesi belanja dibatalkan.")
    else:
        send_message(chat_id, "Perintah tidak dikenal. Ketik /bantuan untuk panduan.")


def _handle_free_text(chat_id: int | str, text: str, username: str, sb_client: Any) -> None:
    """Try to parse free-form text as a transaction."""
    user_id = _get_or_create_telegram_user(chat_id, username, sb_client)
    if not user_id:
        send_message(
            chat_id,
            "\u26a0\ufe0f Tidak bisa membuat akun saat ini.\n"
            "Coba ketik /start untuk memulai.",
        )
        return

    parsed = parse_transaction(text)
    if parsed:
        _save_and_confirm(chat_id, parsed, user_id, sb_client)
    else:
        send_message(
            chat_id,
            "Hmm, tidak bisa membaca transaksi ini \U0001f914\n\n"
            "<b>Format yang bisa dibaca:</b>\n"
            "\u2022 <code>50rb makan siang</code>\n"
            "\u2022 <code>catat 25000 bensin</code>\n"
            "\u2022 <code>+2jt gaji bulan ini</code>\n\n"
            "Atau ketik /bantuan untuk panduan lengkap.",
        )


# ---------------------------------------------------------------------------
# Individual command implementations
# ---------------------------------------------------------------------------

def _cmd_start(chat_id: int | str, user_id: Optional[str], username: str, sb_client: Any) -> None:
    linked = _is_linked_to_web(chat_id, sb_client)
    link_info = (
        "\u2705 Akun kamu sudah terhubung ke OprexDuit Web."
        if linked
        else "\U0001f4a1 <i>Ingin akses analisis di web? Ketik /link untuk menghubungkan ke OprexDuit Web.</i>"
    )
    if user_id:
        send_message(
            chat_id,
            f"\U0001f44b Halo <b>{username}</b>! Selamat datang di <b>OprexDuit Bot</b> \U0001f911\n\n"
            "\u2705 Akun kamu sudah aktif - langsung bisa dipakai!\n\n"
            "\U0001f4dd Catat pengeluaran:\n"
            "  <code>50rb makan siang</code>\n"
            "  <code>25000 bensin</code>\n\n"
            "\U0001f6cd\ufe0f Mau belanja hemat? Ketik /belanja\n\n"
            "\U0001f4ca Perintah lainnya:\n"
            "  /ringkasan - Ringkasan hari ini\n"
            "  /laporan   - Laporan bulan ini\n"
            "  /budget    - Cek budget\n"
            "  /bantuan   - Panduan lengkap\n\n"
            f"{link_info}",
        )
    else:
        send_message(
            chat_id,
            "\u26a0\ufe0f Tidak bisa membuat akun saat ini. Coba lagi nanti atau hubungi support.",
        )


def _cmd_link(chat_id: int | str, sb_client: Any) -> None:
    # If already linked to a web account, block and inform
    if _is_linked_to_web(chat_id, sb_client):
        send_message(
            chat_id,
            "\u2705 <b>Akun Telegram kamu sudah terhubung ke OprexDuit Web.</b>\n\n"
            "Kode link tidak diperlukan lagi.\n"
            "Jika ingin <b>memutus koneksi</b>, buka Settings \u2192 Telegram di website.",
        )
        return

    link_code = _store_pending_link(chat_id, sb_client)
    link_url = f"{_WEB_URL}/settings?code={link_code}"
    send_message(
        chat_id,
        "\U0001f517 <b>Hubungkan Akun OprexDuit</b>\n\n"
        f"\U0001f449 <a href='{link_url}'>Klik di sini untuk menghubungkan</a>\n\n"
        "Atau buka Settings secara manual dan masukkan kode:\n"
        f"<code>{link_code}</code>\n\n"
        "<i>Link/kode berlaku 24 jam. Setelah terhubung, /link tidak dapat digunakan lagi.</i>",
    )


def _cmd_catat(
    chat_id: int | str,
    text: str,
    user_id: Optional[str],
    sb_client: Any,
) -> None:
    if not user_id:
        send_message(chat_id, "\u26a0\ufe0f Gagal menginisialisasi akun. Coba ketik /start lagi.")
        return

    if not text.strip():
        send_message(
            chat_id,
            "Format: <code>/catat [jumlah] [keterangan]</code>\n\n"
            "Contoh:\n"
            "\u2022 <code>/catat 50rb makan siang</code>\n"
            "\u2022 <code>/catat 25000 bensin</code>\n"
            "\u2022 <code>/catat +2jt gaji</code>",
        )
        return

    parsed = parse_transaction(text)
    if not parsed:
        send_message(chat_id, "Tidak bisa membaca jumlah. Contoh: <code>/catat 50rb makan siang</code>")
        return

    _save_and_confirm(chat_id, parsed, user_id, sb_client)


def _save_and_confirm(
    chat_id: int | str,
    parsed: ParsedTx,
    user_id: str,
    sb_client: Any,
) -> None:
    icon = "\U0001f4b0" if parsed.type == "income" else "\U0001f4b8"
    type_label = "Pemasukan" if parsed.type == "income" else "Pengeluaran"

    if not sb_client:
        send_message(chat_id, "\u26a0\ufe0f Database tidak tersambung saat ini.")
        return

    try:
        tx_data = {
            "user_id": user_id,
            "date": date.today().isoformat(),
            "description": parsed.description,
            "amount": parsed.amount,
            "type": parsed.type,
            "category_raw": parsed.category_hint or "Lainnya",
            "source": "telegram",
        }
        sb_client.table("transactions").insert(tx_data).execute()

        send_message(
            chat_id,
            f"{icon} <b>Transaksi dicatat!</b>\n\n"
            f"Jenis     : {type_label}\n"
            f"Jumlah    : <b>{_fmt(parsed.amount)}</b>\n"
            f"Keterangan: {parsed.description}\n"
            f"Kategori  : {parsed.category_hint or 'Lainnya'}\n"
            f"Tanggal   : {date.today().strftime('%d %b %Y')}",
        )
    except Exception as exc:
        send_message(chat_id, f"\u26a0\ufe0f Gagal menyimpan: {exc}")


def _cmd_ringkasan(
    chat_id: int | str,
    user_id: Optional[str],
    sb_client: Any,
) -> None:
    if not user_id:
        send_message(chat_id, "\u26a0\ufe0f Gagal menginisialisasi akun. Coba ketik /start lagi.")
        return

    today = date.today().isoformat()

    try:
        res = (
            sb_client.table("transactions")
            .select("amount,type,description,category_raw")
            .eq("user_id", user_id)
            .eq("date", today)
            .execute()
        )
        txs = res.data or []

        if not txs:
            send_message(
                chat_id,
                f"\U0001f4ca <b>Ringkasan Hari Ini</b> ({date.today().strftime('%d %b %Y')})\n\n"
                "Belum ada transaksi hari ini.\n"
                "Yuk catat: <code>50rb makan siang</code>",
            )
            return

        total_income = sum(t["amount"] for t in txs if t["type"] == "income")
        total_expense = sum(t["amount"] for t in txs if t["type"] == "expense")
        net = total_income - total_expense
        expenses = sorted(
            [t for t in txs if t["type"] == "expense"],
            key=lambda x: x["amount"],
            reverse=True,
        )

        lines = [f"\U0001f4ca <b>Ringkasan Hari Ini</b> ({date.today().strftime('%d %b %Y')})\n"]
        lines.append(f"\U0001f4b0 Pemasukan : <b>{_fmt(total_income)}</b>")
        lines.append(f"\U0001f4b8 Pengeluaran: <b>{_fmt(total_expense)}</b>")
        _net_icon = "\U0001f4c8" if net >= 0 else "\U0001f4c9"
        lines.append(f"{_net_icon} Net       : <b>{_fmt(net)}</b>")

        if expenses:
            lines.append(f"\n<b>Top pengeluaran ({len(expenses)} transaksi):</b>")
            for tx in expenses[:5]:
                lines.append(f"\u2022 {tx['description']} - {_fmt(tx['amount'])}")
            if len(expenses) > 5:
                lines.append(f"  ... dan {len(expenses) - 5} lainnya")

        send_message(chat_id, "\n".join(lines))

    except Exception as exc:
        send_message(chat_id, f"\u26a0\ufe0f Gagal mengambil data: {exc}")


def _cmd_laporan(
    chat_id: int | str,
    user_id: Optional[str],
    sb_client: Any,
) -> None:
    if not user_id:
        send_message(chat_id, "\u26a0\ufe0f Gagal menginisialisasi akun. Coba ketik /start lagi.")
        return

    today = date.today()
    month_start = today.replace(day=1).isoformat()

    try:
        res = (
            sb_client.table("transactions")
            .select("amount,type,category_raw")
            .eq("user_id", user_id)
            .gte("date", month_start)
            .lte("date", today.isoformat())
            .execute()
        )
        txs = res.data or []

        total_income = sum(t["amount"] for t in txs if t["type"] == "income")
        total_expense = sum(t["amount"] for t in txs if t["type"] == "expense")
        net = total_income - total_expense

        cat_totals: dict[str, float] = {}
        for tx in txs:
            if tx["type"] == "expense":
                cat = tx.get("category_raw") or "Lainnya"
                cat_totals[cat] = cat_totals.get(cat, 0) + tx["amount"]

        top_cats = sorted(cat_totals.items(), key=lambda x: x[1], reverse=True)[:5]

        lines = [f"\U0001f4c5 <b>Laporan Bulan Ini</b> ({today.strftime('%B %Y')})\n"]
        lines.append(f"\U0001f4b0 Pemasukan : <b>{_fmt(total_income)}</b>")
        lines.append(f"\U0001f4b8 Pengeluaran: <b>{_fmt(total_expense)}</b>")
        _net_icon2 = "\U0001f4c8" if net >= 0 else "\U0001f4c9"
        lines.append(f"{_net_icon2} Net       : <b>{_fmt(net)}</b>")
        lines.append(f"\U0001f4dd Total transaksi: {len(txs)}")

        if top_cats:
            lines.append("\n<b>Top Kategori Pengeluaran:</b>")
            for cat, total in top_cats:
                pct = (total / total_expense * 100) if total_expense > 0 else 0
                lines.append(f"\u2022 {cat}: {_fmt(total)} ({pct:.0f}%)")

        send_message(chat_id, "\n".join(lines))

    except Exception as exc:
        send_message(chat_id, f"\u26a0\ufe0f Gagal mengambil laporan: {exc}")


def _cmd_budget(
    chat_id: int | str,
    user_id: Optional[str],
    sb_client: Any,
) -> None:
    if not user_id:
        send_message(chat_id, "\u26a0\ufe0f Gagal menginisialisasi akun. Coba ketik /start lagi.")
        return

    today = date.today()
    month_start = today.replace(day=1).isoformat()

    try:
        budgets_res = (
            sb_client.table("budgets")
            .select("category,monthly_limit")
            .eq("user_id", user_id)
            .execute()
        )
        budgets = {b["category"]: b["monthly_limit"] for b in (budgets_res.data or [])}

        if not budgets:
            send_message(
                chat_id,
                "\u26a0\ufe0f Belum ada budget yang diatur.\n\n"
                "Set budget di website:\n"
                "<b>OprexDuit \u2192 Budgeting \u2192 Atur Limit</b>",
            )
            return

        txs_res = (
            sb_client.table("transactions")
            .select("amount,category_raw")
            .eq("user_id", user_id)
            .eq("type", "expense")
            .gte("date", month_start)
            .execute()
        )

        spending: dict[str, float] = {}
        for tx in txs_res.data or []:
            cat = tx.get("category_raw") or "Lainnya"
            spending[cat] = spending.get(cat, 0) + tx["amount"]

        lines = [f"\U0001f4b0 <b>Status Budget {today.strftime('%B %Y')}</b>\n"]
        for cat, limit in budgets.items():
            used = spending.get(cat, 0)
            pct = (used / limit * 100) if limit > 0 else 0
            bar = _progress_bar(pct)
            status = "\U0001f7e2" if pct < 70 else ("\U0001f7e1" if pct < 90 else "\U0001f534")
            lines.append(
                f"{status} <b>{cat}</b>\n"
                f"   {bar} {pct:.0f}%\n"
                f"   {_fmt(used)} / {_fmt(limit)}"
            )

        send_message(chat_id, "\n\n".join(lines))

    except Exception as exc:
        send_message(chat_id, f"\u26a0\ufe0f Gagal mengambil data budget: {exc}")


def _cmd_bantuan(chat_id: int | str, sb_client: Any = None) -> None:
    linked = _is_linked_to_web(chat_id, sb_client) if sb_client else False
    link_section = (
        "\u2705 Akun sudah terhubung ke OprexDuit Web"
        if linked
        else "/link      - Hubungkan ke OprexDuit Web"
    )
    send_message(
        chat_id,
        "<b>\U0001f4f1 OprexDuit Bot - Panduan</b>\n\n"
        "<b>Catat Transaksi (kirim teks langsung):</b>\n"
        "\u2022 <code>50rb makan siang</code>\n"
        "\u2022 <code>catat 25000 bensin</code>\n"
        "\u2022 <code>+2jt gaji bulan ini</code>\n\n"
        "<b>Format Jumlah:</b>\n"
        "\u2022 <code>50rb</code> = Rp50.000\n"
        "\u2022 <code>1.5jt</code> = Rp1.500.000\n"
        "\u2022 <code>500000</code> = Rp500.000\n"
        "\u2022 Awali <code>+</code> untuk pemasukan\n\n"
        "<b>Perintah:</b>\n"
        "/ringkasan - Ringkasan hari ini\n"
        "/laporan   - Laporan bulan ini\n"
        "/budget    - Cek status budget\n"
        "/belanja   - Belanja hemat dengan AI \U0001f6cd\ufe0f\n"
        f"{link_section}\n"
        "/bantuan   - Tampilkan panduan ini",
    )


# ---------------------------------------------------------------------------
# AI Shopping Flow
# ---------------------------------------------------------------------------

_PLATFORMS: dict[str, tuple[str, str]] = {
    "1": ("Shopee", "shopee"),
    "2": ("TikTok Shop", "tiktokshop"),
    "3": ("Alfagift", "alfagift"),
}

_PLATFORM_ALIASES: dict[str, str] = {
    "shopee": "shopee",
    "tiktok": "tiktokshop",
    "tiktokshop": "tiktokshop",
    "tiktok shop": "tiktokshop",
    "alfagift": "alfagift",
    "alfa": "alfagift",
    "indomaret": "alfagift",
}

_PLATFORM_LABELS: dict[str, str] = {
    "shopee": "Shopee",
    "tiktokshop": "TikTok Shop",
    "alfagift": "Alfagift",
}


def _cmd_belanja_start(chat_id: int | str) -> None:
    """Step 1 - Ask user which platform."""
    _SHOPPING_SESSIONS[str(chat_id)] = {"step": "choose_platform"}
    send_message(
        chat_id,
        "\U0001f6cd\ufe0f <b>Belanja Hemat dengan AI</b>\n\n"
        "Mau belanja di platform mana?\n\n"
        "1\ufe0f\u20e3 Shopee\n"
        "2\ufe0f\u20e3 TikTok Shop\n"
        "3\ufe0f\u20e3 Alfagift\n\n"
        "Balas dengan angka (1/2/3) atau ketik /batal untuk keluar.",
    )


def _handle_shopping_input(
    chat_id: int | str, text: str, username: str, sb_client: Any
) -> None:
    """Handle text input while user is in a shopping session."""
    session = _SHOPPING_SESSIONS.get(str(chat_id))
    if not session:
        return

    step = session.get("step")

    if step == "choose_platform":
        choice = text.strip()
        platform_key: Optional[str] = None
        platform_label: Optional[str] = None

        if choice in _PLATFORMS:
            platform_label, platform_key = _PLATFORMS[choice]
        else:
            platform_key = _PLATFORM_ALIASES.get(choice.lower())
            if platform_key:
                platform_label = _PLATFORM_LABELS[platform_key]

        if platform_key and platform_label:
            session["platform"] = platform_key
            session["platform_label"] = platform_label
            session["step"] = "choose_product"
            send_message(
                chat_id,
                f"\u2705 Platform: <b>{platform_label}</b>\n\n"
                "Mau belanja apa? (contoh: <i>sunscreen, headset gaming, beras 5kg</i>)\n\n"
                "Ketik /batal untuk keluar.",
            )
        else:
            send_message(chat_id, "Balas dengan angka 1, 2, atau 3 ya. Atau /batal untuk keluar.")

    elif step == "choose_product":
        query = text.strip()
        session["query"] = query
        session["step"] = "showing_products"
        _fetch_and_show_products(chat_id, query, session.get("platform", "shopee"), sb_client)

    elif step == "showing_products":
        _handle_purchase_confirmation(chat_id, text, username, sb_client)


def _fetch_and_show_products(
    chat_id: int | str, query: str, platform: str, sb_client: Any
) -> None:
    """Fetch affiliate products from DB and send recommendations."""
    if not sb_client:
        send_message(chat_id, "\u26a0\ufe0f Database tidak tersambung. Coba lagi nanti.")
        _SHOPPING_SESSIONS.pop(str(chat_id), None)
        return

    platform_label = _SHOPPING_SESSIONS.get(str(chat_id), {}).get("platform_label", platform)

    try:
        res = (
            sb_client.table("affiliate_products")
            .select("id,name,price,platform,affiliate_url,image_url,description")
            .eq("platform", platform)
            .eq("is_active", True)
            .ilike("name", f"%{query}%")
            .order("price", desc=False)
            .limit(5)
            .execute()
        )
        products = res.data or []

        # Fallback: show any active products from this platform if no name match
        if not products:
            res2 = (
                sb_client.table("affiliate_products")
                .select("id,name,price,platform,affiliate_url,image_url,description")
                .eq("platform", platform)
                .eq("is_active", True)
                .order("price", desc=False)
                .limit(5)
                .execute()
            )
            products = res2.data or []

        if not products:
            send_message(
                chat_id,
                f"\U0001f614 Belum ada produk <b>{query}</b> di {platform_label}.\n\n"
                "Coba cari produk lain atau hubungi admin!\n"
                "Mau cari yang lain? Ketik nama produk atau /batal untuk keluar.",
            )
            _SHOPPING_SESSIONS[str(chat_id)]["step"] = "choose_product"
            return

        _SHOPPING_SESSIONS[str(chat_id)]["products"] = products
        _SHOPPING_SESSIONS[str(chat_id)]["sent_at"] = datetime.now(timezone.utc).isoformat()

        lines = [f"\U0001f6cd\ufe0f <b>Rekomendasi {query.title()} di {platform_label}</b>\n"]

        for i, p in enumerate(products, 1):
            price_str = _fmt(p["price"]) if p.get("price") else "Lihat di toko"
            lines.append(
                f"{i}. <b>{p['name']}</b>\n"
                f"   \U0001f4b0 {price_str}\n"
                f"   \U0001f517 <a href='{p['affiliate_url']}'>Beli di {platform_label}</a>"
            )
            if p.get("description"):
                desc = p["description"][:80]
                lines.append(f"   \U0001f4dd {desc}{'...' if len(p['description']) > 80 else ''}")

        lines.append(
            f"\n\u23eb Klik link untuk belanja langsung di {platform_label}.\n"
            "\U0001f4ac Balas <b>jadi</b> jika sudah beli, atau <b>batal</b> jika tidak jadi."
        )

        send_message(chat_id, "\n\n".join(lines))

    except Exception as exc:
        send_message(chat_id, f"\u26a0\ufe0f Gagal mengambil produk: {exc}")
        _SHOPPING_SESSIONS.pop(str(chat_id), None)


def _handle_purchase_confirmation(
    chat_id: int | str, text: str, username: str, sb_client: Any
) -> None:
    """Handle user's reply after viewing product recommendations."""
    session = _SHOPPING_SESSIONS.get(str(chat_id), {})
    text_lower = text.strip().lower()

    confirmed_words = {"jadi", "beli", "sudah", "iya", "ya", "yes", "ok", "oke", "done", "bayar", "deal"}
    cancel_words = {"batal", "tidak", "ga", "gak", "nggak", "cancel", "no", "enggak", "ngga"}

    if any(w in text_lower for w in confirmed_words):
        products = session.get("products", [])
        query = session.get("query", "Belanja online")

        if products and products[0].get("price"):
            amount = products[0]["price"]
            user_id = _get_or_create_telegram_user(chat_id, username, sb_client)
            if user_id and sb_client:
                try:
                    sb_client.table("transactions").insert({
                        "user_id": user_id,
                        "date": date.today().isoformat(),
                        "description": f"Belanja {query} ({session.get('platform_label', 'Online')})",
                        "amount": amount,
                        "type": "expense",
                        "category_raw": "Belanja",
                        "source": "telegram_shopping",
                    }).execute()
                    send_message(
                        chat_id,
                        f"\u2705 <b>Pembelian dicatat!</b>\n\n"
                        f"Pengeluaran <b>{_fmt(amount)}</b> untuk <b>{query}</b> sudah disimpan.\n\n"
                        "Terima kasih sudah belanja hemat! \U0001f389\n"
                        "Catat transaksi lain atau ketik /ringkasan untuk lihat hari ini.",
                    )
                except Exception as exc:
                    send_message(chat_id, f"\u2705 Terima kasih! (Gagal menyimpan transaksi: {exc})")
            else:
                send_message(chat_id, "\u2705 Terima kasih sudah belanja! \U0001f389")
        else:
            send_message(
                chat_id,
                f"\u2705 Terima kasih sudah belanja <b>{query}</b>!\n\n"
                "Jangan lupa catat pengeluarannya ya:\n"
                f"<code>50rb {query}</code>",
            )
        _SHOPPING_SESSIONS.pop(str(chat_id), None)

    elif any(w in text_lower for w in cancel_words):
        _SHOPPING_SESSIONS.pop(str(chat_id), None)
        send_message(
            chat_id,
            "Tidak jadi belanja? Tidak apa-apa! \U0001f60a\n"
            "Kalau mau cari produk lain kapan saja, ketik /belanja ya!",
        )
    else:
        # Treat as a new product search
        _SHOPPING_SESSIONS[str(chat_id)]["step"] = "choose_product"
        _SHOPPING_SESSIONS[str(chat_id)]["query"] = text
        _fetch_and_show_products(chat_id, text, session.get("platform", "shopee"), sb_client)


# ---------------------------------------------------------------------------
# Scheduled broadcast functions (called by cron endpoints)
# ---------------------------------------------------------------------------

def send_daily_reports(sb_client: Any) -> int:
    """Send today's summary to all linked users. Called by cron at 09:00 WIB."""
    if not sb_client:
        return 0
    try:
        res = (
            sb_client.table("profiles")
            .select("id,telegram_chat_id")
            .not_.is_("telegram_chat_id", None)
            .execute()
        )
        count = 0
        for user in res.data or []:
            _cmd_ringkasan(user["telegram_chat_id"], user["id"], sb_client)
            count += 1
        return count
    except Exception as exc:
        print(f"[telegram] daily_reports error: {exc}")
        return 0


def send_weekly_reports(sb_client: Any) -> int:
    """Send 7-day report to all linked users. Called by cron every Monday 08:00 WIB."""
    if not sb_client:
        return 0
    try:
        res = (
            sb_client.table("profiles")
            .select("id,telegram_chat_id")
            .not_.is_("telegram_chat_id", None)
            .execute()
        )
        count = 0
        today = date.today()
        week_start = (today - timedelta(days=7)).isoformat()
        for user in res.data or []:
            _send_weekly_summary(
                user["telegram_chat_id"], user["id"], week_start, sb_client
            )
            count += 1
        return count
    except Exception as exc:
        print(f"[telegram] weekly_reports error: {exc}")
        return 0


def _send_weekly_summary(
    chat_id: str, user_id: str, week_start: str, sb_client: Any
) -> None:
    today = date.today()
    try:
        res = (
            sb_client.table("transactions")
            .select("amount,type,category_raw")
            .eq("user_id", user_id)
            .gte("date", week_start)
            .lte("date", today.isoformat())
            .execute()
        )
        txs = res.data or []
        total_income = sum(t["amount"] for t in txs if t["type"] == "income")
        total_expense = sum(t["amount"] for t in txs if t["type"] == "expense")
        net = total_income - total_expense

        _wi = "\U0001f4c8" if net >= 0 else "\U0001f4c9"
        send_message(
            chat_id,
            f"\U0001f4ca <b>Laporan Mingguan OprexDuit</b>\n"
            f"({week_start} - {today.isoformat()})\n\n"
            f"\U0001f4b0 Pemasukan : <b>{_fmt(total_income)}</b>\n"
            f"\U0001f4b8 Pengeluaran: <b>{_fmt(total_expense)}</b>\n"
            f"{_wi} Net       : <b>{_fmt(net)}</b>\n\n"
            f"\U0001f4dd {len(txs)} transaksi minggu ini.",
        )
    except Exception as exc:
        print(f"[telegram] weekly_summary error for {user_id}: {exc}")
