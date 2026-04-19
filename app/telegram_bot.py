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

# WIB timezone (UTC+7)
_WIB = timezone(timedelta(hours=7))


def _today_wib() -> date:
    """Return today's date in WIB (UTC+7) timezone."""
    return datetime.now(_WIB).date()


def _now_wib() -> datetime:
    """Return current datetime in WIB."""
    return datetime.now(_WIB)

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

_WEB_URL = os.environ.get("WEB_URL", "https://oprexduit.vercel.app")

# In-memory state for AI shopping sessions per chat_id
# { str(chat_id): { "step": str, "platform": str, "query": str, "products": [...] } }
_SHOPPING_SESSIONS: dict[str, dict] = {}
_SPLITBILL_SESSIONS: dict[str, dict] = {}
_REPORT_SESSIONS: dict[str, dict] = {}

_SCOPE_LABEL = {"private": "Pribadi", "couple": "Pasangan", "group": "Grup"}
_SCOPE_EMOJI = {"private": "\U0001f464", "couple": "\U0001f491", "group": "\U0001f465"}

# Budget alert threshold (80%)
_BUDGET_ALERT_PCT = 80

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


def _send_keyboard(
    chat_id: int | str,
    text: str,
    keyboard: list[list[dict]],
    parse_mode: str = "HTML",
) -> None:
    """Send a message with an inline keyboard (buttons)."""
    url = _TG_API.format(token=_bot_token(), method="sendMessage")
    try:
        with httpx.Client(timeout=8) as client:
            client.post(url, json={
                "chat_id": chat_id,
                "text": text,
                "parse_mode": parse_mode,
                "disable_web_page_preview": True,
                "reply_markup": {"inline_keyboard": keyboard},
            })
    except Exception as exc:
        print(f"[telegram] _send_keyboard error: {exc}")


def _answer_callback(callback_query_id: str, text: str = "") -> None:
    """Acknowledge a callback query so the button stops loading."""
    url = _TG_API.format(token=_bot_token(), method="answerCallbackQuery")
    try:
        with httpx.Client(timeout=5) as client:
            client.post(url, json={
                "callback_query_id": callback_query_id,
                "text": text,
                "show_alert": False,
            })
    except Exception as exc:
        print(f"[telegram] _answer_callback error: {exc}")


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
    # Handle inline button presses
    if "callback_query" in update:
        _handle_callback_query(update["callback_query"], sb_client)
        return

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
        # Check if user is in a stateful session
        if str(chat_id) in _SPLITBILL_SESSIONS:
            _handle_splitbill_input(chat_id, text, username, sb_client)
        elif str(chat_id) in _SHOPPING_SESSIONS:
            _handle_shopping_input(chat_id, text, username, sb_client)
        elif str(chat_id) in _REPORT_SESSIONS:
            _handle_lapor_input(chat_id, text, username, sb_client)
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
    """Check if this Telegram chat is linked to a web account."""
    if not sb_client:
        return False
    try:
        res = (
            sb_client.table("profiles")
            .select("id,telegram_linked_at")
            .eq("telegram_chat_id", str(chat_id))
            .limit(1)
            .execute()
        )
        rows = res.data or []
        if not rows:
            return False
        
        # If telegram_linked_at is set, it means the user manually linked their web account
        return bool(rows[0].get("telegram_linked_at"))
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
    elif command in ("/bantuan", "/help", "/menu"):
        _cmd_menu(chat_id, sb_client)
    elif command == "/batal":
        _SHOPPING_SESSIONS.pop(str(chat_id), None)
        _SPLITBILL_SESSIONS.pop(str(chat_id), None)
        _REPORT_SESSIONS.pop(str(chat_id), None)
        send_message(chat_id, "\u274e Sesi dibatalkan.")
    elif command in ("/splitbill", "/patungan"):
        _cmd_splitbill_start(chat_id)
    elif command in ("/lapor", "/bug"):
        _cmd_lapor_start(chat_id)
    elif command == "/room":
        _cmd_room(chat_id, args, username, user_id, sb_client)
    elif command in ("/hapus", "/delete"):
        _cmd_hapus(chat_id, user_id, sb_client)
    else:
        send_message(chat_id, "Perintah tidak dikenal. Ketik /menu untuk panduan.")


def _handle_free_text(chat_id: int | str, text: str, username: str, sb_client: Any) -> None:
    """Try to parse free-form text as a transaction. If shopping intent detected, start shopping."""
    text_lower = text.lower()

    # Detect shopping intent keywords
    _SHOPPING_KEYWORDS = {
        "belanja", "beli", "mau beli", "mau belanja", "pengen beli", "pengen belanja",
        "ingin beli", "ingin belanja", "cariin", "cariiin", "cari produk",
        "rekomendasi", "rekomendasiin", "shop", "shopping", "mau cari",
        "mau order", "order", "pesan produk",
    }
    if any(kw in text_lower for kw in _SHOPPING_KEYWORDS):
        _get_or_create_telegram_user(chat_id, username, sb_client)
        _cmd_belanja_start(chat_id)
        return

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
            "\U0001f4a1 <b>Ups, formatnya kurang tepat!</b>\n\n"
            "Jika kamu ingin <b>mencatat transaksi</b>, pastikan sertakan nominal angkanya.\n"
            "Contoh penyebutan:\n"
            "\u2022 <code>50rb makan siang</code>\n"
            "\u2022 <code>+2jt gaji bulanan</code>\n\n"
            "\U0001f916 Untuk analisa keuangan lebih detail, akses <b>AI Chat</b> di web-dashboard!\n",
        )
        _show_menu(chat_id, sb_client, prefix="\U0001f4f1 <b>Menu:</b>")


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
            "\U0001f6cd Mau belanja hemat? Ketik /belanja\n\n"
            "\U0001f4ca Perintah lainnya:\n"
            "  /ringkasan - Ringkasan hari ini\n"
            "  /laporan   - Laporan bulan ini\n"
            "  /budget    - Cek budget\n"
            "  /menu      - Menu lengkap\n\n"
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


# ---------------------------------------------------------------------------
# Room Notification + Budget Alert helpers
# ---------------------------------------------------------------------------

def _get_room_member_ids(user_id: str, sb_client: Any) -> list[str]:
    """Get all member IDs from rooms this user belongs to (including self).
    Used to include shared transactions in reports."""
    if not sb_client:
        return [user_id]
    try:
        memberships = (
            sb_client.table("room_members")
            .select("room_id")
            .eq("member_id", user_id)
            .execute()
        )
        room_ids = [m["room_id"] for m in (memberships.data or [])]
        if not room_ids:
            return [user_id]

        all_ids = {user_id}
        for rid in room_ids:
            members_res = (
                sb_client.table("room_members")
                .select("member_id")
                .eq("room_id", rid)
                .execute()
            )
            for m in (members_res.data or []):
                all_ids.add(m["member_id"])
        return list(all_ids)
    except Exception:
        return [user_id]

def _notify_room_members(
    user_id: str,
    username: str,
    scope: str,
    tx_type: str,
    amount: float,
    description: str,
    sb_client: Any,
) -> None:
    """Notify all other room members when a shared transaction is recorded.
    
    Only triggers for scope != 'private'. Finds all rooms the user belongs to,
    then sends a Telegram message to every OTHER member's chat_id.
    """
    if scope == "private" or not sb_client:
        return

    try:
        # Find rooms this user is in
        memberships = (
            sb_client.table("room_members")
            .select("room_id")
            .eq("member_id", user_id)
            .execute()
        )
        room_ids = [m["room_id"] for m in (memberships.data or [])]
        if not room_ids:
            return

        # For each room, find other members and their chat_ids
        for rid in room_ids:
            members_res = (
                sb_client.table("room_members")
                .select("member_id,display_name")
                .eq("room_id", rid)
                .neq("member_id", user_id)
                .execute()
            )
            other_members = members_res.data or []

            for member in other_members:
                mid = member["member_id"]
                # Lookup their telegram_chat_id
                try:
                    profile_res = (
                        sb_client.table("profiles")
                        .select("telegram_chat_id")
                        .eq("id", mid)
                        .limit(1)
                        .execute()
                    )
                    rows = profile_res.data or []
                    if not rows or not rows[0].get("telegram_chat_id"):
                        continue

                    their_chat_id = rows[0]["telegram_chat_id"]
                    scope_label = _SCOPE_LABEL.get(scope, scope.title())
                    scope_emoji = _SCOPE_EMOJI.get(scope, "")
                    tx_icon = "\U0001f4b0" if tx_type == "income" else "\U0001f4b8"
                    tx_label = "Pemasukan" if tx_type == "income" else "Pengeluaran"

                    send_message(
                        their_chat_id,
                        f"\U0001f514 <b>Notifikasi Room</b>\n\n"
                        f"{scope_emoji} <b>{username}</b> menambahkan {tx_label.lower()} baru:\n\n"
                        f"{tx_icon} {tx_label}: <b>{_fmt(amount)}</b>\n"
                        f"\U0001f4dd Keterangan: {description}\n"
                        f"\U0001f465 Cakupan: {scope_label}\n\n"
                        f"<i>Lihat detail di /room info atau di web dashboard.</i>",
                    )
                except Exception as exc:
                    print(f"[room_notify] Gagal kirim notif ke {mid}: {exc}")

    except Exception as exc:
        print(f"[room_notify] Error: {exc}")


def _check_budget_alert(
    chat_id: int | str,
    user_id: str,
    category: str,
    sb_client: Any,
) -> None:
    """Check if user's spending in a category has exceeded the budget threshold.
    
    Sends an alert if spending >= 80% of set budget for that category.
    """
    if not sb_client:
        return
    try:
        # Check if user has budget set for this category
        budget_res = (
            sb_client.table("budgets")
            .select("monthly_limit")
            .eq("user_id", user_id)
            .eq("category", category)
            .maybe_single()
            .execute()
        )
        if not budget_res.data:
            return

        cat_limit = float(budget_res.data.get("monthly_limit", 0))
        if cat_limit <= 0:
            return

        # Calculate spending this month
        today = _today_wib()
        month_start = today.replace(day=1).isoformat()
        tx_res = (
            sb_client.table("transactions")
            .select("amount")
            .eq("user_id", user_id)
            .eq("type", "expense")
            .eq("category_raw", category)
            .gte("date", month_start)
            .execute()
        )
        total_spent = sum(t["amount"] for t in (tx_res.data or []))
        pct = (total_spent / cat_limit * 100) if cat_limit > 0 else 0

        if pct >= _BUDGET_ALERT_PCT:
            bar = _progress_bar(pct)
            if pct >= 100:
                emoji = "\U0001f534"
                level = "MELAMPAUI"
            elif pct >= 90:
                emoji = "\U0001f7e1"
                level = "MENDEKATI"
            else:
                emoji = "\U0001f7e0"
                level = "HAMPIR"

            send_message(
                chat_id,
                f"{emoji} <b>Peringatan Budget!</b>\n\n"
                f"Kategori <b>{category}</b> sudah {level} batas:\n"
                f"{bar} {pct:.0f}%\n"
                f"{_fmt(total_spent)} / {_fmt(cat_limit)}\n\n"
                f"<i>Cek detail budget: /budget</i>",
            )
    except Exception:
        pass  # Budget alert is non-critical, don't break the flow


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
        today = _today_wib()
        tx_data = {
            "user_id": user_id,
            "date": today.isoformat(),
            "description": parsed.description,
            "amount": parsed.amount,
            "type": parsed.type,
            "category_raw": parsed.category_hint or "Lainnya",
            "source": "telegram",
            "scope": "private"
        }
        res = sb_client.table("transactions").insert(tx_data).execute()
        
        # Get inserted tx id
        tx_id = ""
        if res.data and len(res.data) > 0:
            tx_id = res.data[0].get("id", "")

        msg = (
            f"{icon} <b>Transaksi dicatat!</b>\n\n"
            f"Jenis     : {type_label}\n"
            f"Jumlah    : <b>{_fmt(parsed.amount)}</b>\n"
            f"Keterangan: {parsed.description}\n"
            f"Kategori  : {parsed.category_hint or 'Lainnya'}\n"
            f"Tanggal   : {today.strftime('%d %b %Y')}"
        )
        
        if tx_id:
            keyboard = [[
                {"text": "\U0001f464 Pribadi", "callback_data": f"tx:scope:private:{tx_id}"},
                {"text": "\U0001f491 Pasangan", "callback_data": f"tx:scope:couple:{tx_id}"},
                {"text": "\U0001f465 Grup", "callback_data": f"tx:scope:group:{tx_id}"},
            ]]
            msg += "\n\nAtur cakupan pengeluaran ini:"
            _send_keyboard(chat_id, msg, keyboard)
        else:
            send_message(chat_id, msg)

        # Budget alert: check if spending exceeded threshold
        if parsed.type == "expense":
            _check_budget_alert(chat_id, user_id, parsed.category_hint or "Lainnya", sb_client)
            
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

    today = _today_wib().isoformat()

    try:
        # Own transactions
        res = (
            sb_client.table("transactions")
            .select("amount,type,description,category_raw,scope")
            .eq("user_id", user_id)
            .eq("date", today)
            .execute()
        )
        txs = res.data or []
        for t in txs:
            t["_from"] = "self"

        # Shared transactions from room members
        room_member_ids = _get_room_member_ids(user_id, sb_client)
        other_ids = [mid for mid in room_member_ids if mid != user_id]
        for mid in other_ids:
            try:
                other_res = (
                    sb_client.table("transactions")
                    .select("amount,type,description,category_raw,scope")
                    .eq("user_id", mid)
                    .in_("scope", ["couple", "group"])
                    .eq("date", today)
                    .execute()
                )
                for t in (other_res.data or []):
                    t["_from"] = "room"
                    txs.append(t)
            except Exception:
                pass

        if not txs:
            send_message(
                chat_id,
                f"\U0001f4ca <b>Ringkasan Hari Ini</b> ({_today_wib().strftime('%d %b %Y')})\n\n"
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

        own_count = sum(1 for t in txs if t["_from"] == "self")
        room_count = sum(1 for t in txs if t["_from"] == "room")

        lines = [f"\U0001f4ca <b>Ringkasan Hari Ini</b> ({_today_wib().strftime('%d %b %Y')})\n"]
        lines.append(f"\U0001f4b0 Pemasukan : <b>{_fmt(total_income)}</b>")
        lines.append(f"\U0001f4b8 Pengeluaran: <b>{_fmt(total_expense)}</b>")
        _net_icon = "\U0001f4c8" if net >= 0 else "\U0001f4c9"
        lines.append(f"{_net_icon} Net       : <b>{_fmt(net)}</b>")
        if room_count > 0:
            lines.append(f"\U0001f465 Incl. {room_count} transaksi bersama dari room")

        if expenses:
            lines.append(f"\n<b>Top pengeluaran ({len(expenses)} transaksi):</b>")
            for tx in expenses[:5]:
                scope_tag = ""
                if tx.get("_from") == "room":
                    scope_tag = f" \U0001f465"
                elif tx.get("scope") in ("couple", "group"):
                    scope_tag = f" {_SCOPE_EMOJI.get(tx['scope'], '')}"
                lines.append(f"\u2022 {tx['description']} - {_fmt(tx['amount'])}{scope_tag}")
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

    today = _today_wib()
    month_start = today.replace(day=1).isoformat()

    try:
        # Own transactions
        res = (
            sb_client.table("transactions")
            .select("amount,type,category_raw,scope")
            .eq("user_id", user_id)
            .gte("date", month_start)
            .lte("date", today.isoformat())
            .execute()
        )
        txs = res.data or []
        for t in txs:
            t["_from"] = "self"

        # Shared transactions from room members (couple/group only)
        room_member_ids = _get_room_member_ids(user_id, sb_client)
        other_ids = [mid for mid in room_member_ids if mid != user_id]
        for mid in other_ids:
            try:
                other_res = (
                    sb_client.table("transactions")
                    .select("amount,type,category_raw,scope")
                    .eq("user_id", mid)
                    .in_("scope", ["couple", "group"])
                    .gte("date", month_start)
                    .lte("date", today.isoformat())
                    .execute()
                )
                for t in (other_res.data or []):
                    t["_from"] = "room"
                    txs.append(t)
            except Exception:
                pass

        total_income = sum(t["amount"] for t in txs if t["type"] == "income")
        total_expense = sum(t["amount"] for t in txs if t["type"] == "expense")
        net = total_income - total_expense

        cat_totals: dict[str, float] = {}
        scope_totals: dict[str, float] = {}
        for tx in txs:
            if tx["type"] == "expense":
                cat = tx.get("category_raw") or "Lainnya"
                cat_totals[cat] = cat_totals.get(cat, 0) + tx["amount"]
                scope = tx.get("scope") or "private"
                scope_totals[scope] = scope_totals.get(scope, 0) + tx["amount"]

        top_cats = sorted(cat_totals.items(), key=lambda x: x[1], reverse=True)[:5]

        own_count = sum(1 for t in txs if t["_from"] == "self")
        room_count = sum(1 for t in txs if t["_from"] == "room")

        lines = [f"\U0001f4c5 <b>Laporan Bulan Ini</b> ({today.strftime('%B %Y')})\n"]
        lines.append(f"\U0001f4b0 Pemasukan : <b>{_fmt(total_income)}</b>")
        lines.append(f"\U0001f4b8 Pengeluaran: <b>{_fmt(total_expense)}</b>")
        _net_icon2 = "\U0001f4c8" if net >= 0 else "\U0001f4c9"
        lines.append(f"{_net_icon2} Net       : <b>{_fmt(net)}</b>")
        lines.append(f"\U0001f4dd Total transaksi: {len(txs)}")
        if room_count > 0:
            lines.append(f"\U0001f465 Termasuk {room_count} transaksi bersama dari room")

        if top_cats:
            lines.append("\n<b>Top Kategori Pengeluaran:</b>")
            for cat, total in top_cats:
                pct = (total / total_expense * 100) if total_expense > 0 else 0
                lines.append(f"\u2022 {cat}: {_fmt(total)} ({pct:.0f}%)")

        # Scope breakdown
        if len(scope_totals) > 1 or (scope_totals and "private" not in scope_totals):
            lines.append("\n<b>Berdasarkan Cakupan:</b>")
            for scope, total in sorted(scope_totals.items(), key=lambda x: x[1], reverse=True):
                label = _SCOPE_LABEL.get(scope, scope.title())
                pct = (total / total_expense * 100) if total_expense > 0 else 0
                lines.append(f"\u2022 {label}: {_fmt(total)} ({pct:.0f}%)")

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

    today = _today_wib()
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


def _cmd_menu(chat_id: int | str, sb_client: Any = None) -> None:
    """Show interactive menu. Replaces old /bantuan."""
    _show_menu(chat_id, sb_client)


def _show_menu(chat_id: int | str, sb_client: Any = None, prefix: str = "") -> None:
    """Send the interactive menu keyboard. Called after actions too."""
    linked = _is_linked_to_web(chat_id, sb_client) if sb_client else False
    link_text = "\u2705 Sudah Terhubung Web" if linked else "\U0001f517 Hubungkan Akun Web"
    link_data = "cmd:noop" if linked else "cmd:link"
    
    keyboard = [
        [
            {"text": "\U0001f4ca Ringkasan", "callback_data": "cmd:ringkasan"},
            {"text": "\U0001f4c5 Laporan", "callback_data": "cmd:laporan"},
        ],
        [
            {"text": "\U0001f4b0 Budget", "callback_data": "cmd:budget"},
            {"text": "\U0001f6cd Belanja AI", "callback_data": "cmd:belanja"},
        ],
        [
            {"text": "\U0001f465 Room", "callback_data": "cmd:room"},
            {"text": "\U0001f5d1 Hapus Transaksi", "callback_data": "cmd:hapus"},
        ],
        [
            {"text": "\U0001f91d Patungan", "callback_data": "cmd:splitbill"},
            {"text": link_text, "callback_data": link_data},
        ],
        [
            {"text": "\U0001f6a8 Lapor Bug", "callback_data": "cmd:lapor"},
        ],
    ]

    header = prefix or (
        "<b>\U0001f4f1 OprexDuit Menu</b>\n\n"
        "<b>Catat Transaksi:</b> kirim teks langsung\n"
        "\u2022 <code>50rb makan siang</code>\n"
        "\u2022 <code>+2jt gaji bulan ini</code>\n\n"
        "<b>Pilih menu di bawah:</b>"
    )
    _send_keyboard(chat_id, header, keyboard)


# ---------------------------------------------------------------------------
# Room management (Telegram)
# ---------------------------------------------------------------------------

def _cmd_room(
    chat_id: int | str,
    args: list[str],
    username: str,
    user_id: Optional[str],
    sb_client: Any,
) -> None:
    """Handle /room subcommands: create, join, info."""
    if not user_id:
        send_message(chat_id, "\u26a0\ufe0f Gagal menginisialisasi akun. Coba /start dulu.")
        return

    if not args:
        _send_keyboard(
            chat_id,
            "\U0001f465 <b>Shared Room</b>\n\n"
            "Kelola pengeluaran bersama pasangan, keluarga, atau teman.\n\n"
            "Pilih aksi:",
            [
                [
                    {"text": "\u2795 Buat Room", "callback_data": "room:create"},
                    {"text": "\U0001f517 Gabung Room", "callback_data": "room:join_prompt"},
                ],
                [
                    {"text": "\U0001f4cb Info Room Saya", "callback_data": "room:info"},
                ],
            ],
        )
        return

    sub = args[0].lower()

    if sub == "create":
        name = " ".join(args[1:]) if len(args) > 1 else username
        _room_create(chat_id, name, user_id, sb_client)

    elif sub == "join":
        if len(args) < 2:
            send_message(chat_id, "Format: <code>/room join KODE_UNDANGAN</code>")
            return
        _room_join(chat_id, args[1], username, sb_client)

    elif sub == "info":
        _room_info(chat_id, user_id, sb_client)

    else:
        send_message(chat_id, "Subcommand tidak dikenal.\nGunakan: /room create, /room join KODE, /room info")


def _room_create(chat_id: int | str, display_name: str, user_id: str, sb_client: Any) -> None:
    """Create a couple room via backend API."""
    if not sb_client:
        send_message(chat_id, "\u26a0\ufe0f Database tidak tersambung.")
        return
    try:
        import uuid as _uuid
        room_id = str(_uuid.uuid4())
        invite_code = secrets.token_urlsafe(6).upper()[:8]
        created = datetime.now(timezone.utc).isoformat()

        sb_client.table("rooms").insert({
            "room_id": room_id,
            "invite_code": invite_code,
            "plan_type": "couple",
            "max_members": 2,
            "creator_member_id": user_id,
            "shared_budgets": {},
            "created_at": created,
        }).execute()

        sb_client.table("room_members").insert({
            "room_id": room_id,
            "member_id": user_id,
            "display_name": display_name[:32],
            "color": "#14b8a6",
            "budgets": {},
            "summary": None,
            "by_category": [],
            "joined_at": created,
        }).execute()

        web_url = os.environ.get("WEB_URL", "https://oprexduit.vercel.app")
        send_message(
            chat_id,
            f"\u2705 <b>Room berhasil dibuat!</b>\n\n"
            f"\U0001f511 Kode Undangan: <code>{invite_code}</code>\n\n"
            "Bagikan kode di atas ke pasangan/teman kamu.\n"
            f"Mereka bisa gabung dengan: <code>/room join {invite_code}</code>\n\n"
            f"\U0001f310 Atau via web: {web_url}/shared?code={invite_code}",
        )
    except Exception as exc:
        send_message(chat_id, f"\u26a0\ufe0f Gagal membuat room: {exc}")


def _room_join(chat_id: int | str, code: str, username: str, sb_client: Any) -> None:
    """Join an existing room via invite code."""
    if not sb_client:
        send_message(chat_id, "\u26a0\ufe0f Database tidak tersambung.")
        return
    try:
        code = code.strip().upper()
        res = sb_client.table("rooms").select("*").eq("invite_code", code).maybe_single().execute()
        if not res.data:
            send_message(chat_id, "\u274c Kode undangan tidak ditemukan. Pastikan kode benar.")
            return

        room = res.data
        room_id = room["room_id"]

        # Check existing member
        members_res = sb_client.table("room_members").select("member_id").eq("room_id", room_id).execute()
        existing_ids = [m["member_id"] for m in (members_res.data or [])]
        member_count = len(existing_ids)

        user_id = _get_user_id(chat_id, sb_client)
        if user_id and user_id in existing_ids:
            send_message(chat_id, "\u2705 Kamu sudah menjadi anggota room ini!")
            return

        max_m = room.get("max_members", 2)
        if max_m != -1 and member_count >= max_m:
            send_message(chat_id, f"\u274c Room penuh ({member_count}/{max_m}). Minta admin upgrade plan.")
            return

        sb_client.table("room_members").insert({
            "room_id": room_id,
            "member_id": user_id or str(chat_id),
            "display_name": username[:32],
            "color": "#6366f1",
            "budgets": {},
            "summary": None,
            "by_category": [],
            "joined_at": datetime.now(timezone.utc).isoformat(),
        }).execute()

        send_message(
            chat_id,
            f"\u2705 <b>Berhasil gabung room!</b>\n\n"
            f"Plan: {room.get('plan_type', 'couple').title()}\n"
            f"Anggota: {member_count + 1}/{max_m}\n\n"
            "Transaksi yang kamu catat bisa diberi scope Pasangan/Grup.",
        )
    except Exception as exc:
        send_message(chat_id, f"\u26a0\ufe0f Gagal gabung room: {exc}")


def _room_info(chat_id: int | str, user_id: str, sb_client: Any) -> None:
    """Show info about all rooms the user is a member of, including shared spending."""
    if not sb_client:
        send_message(chat_id, "\u26a0\ufe0f Database tidak tersambung.")
        return
    try:
        memberships = (
            sb_client.table("room_members")
            .select("room_id")
            .eq("member_id", user_id)
            .execute()
        )
        room_ids = [m["room_id"] for m in (memberships.data or [])]

        if not room_ids:
            send_message(
                chat_id,
                "\U0001f4ad Kamu belum tergabung di room manapun.\n\n"
                "Buat room baru: /room create\n"
                "Atau gabung: /room join KODE",
            )
            return

        today = _today_wib()
        month_start = today.replace(day=1).isoformat()

        lines = ["\U0001f465 <b>Room Kamu:</b>\n"]
        for rid in room_ids[:5]:
            room_res = sb_client.table("rooms").select("*").eq("room_id", rid).maybe_single().execute()
            if not room_res.data:
                continue
            r = room_res.data
            members_res = sb_client.table("room_members").select("member_id,display_name").eq("room_id", rid).execute()
            members_data = members_res.data or []
            member_names = [m["display_name"] for m in members_data]
            member_ids = [m["member_id"] for m in members_data]

            # Fetch shared spending (scope=couple/group) for members this month
            room_spending: dict[str, float] = {}
            total_room_expense = 0.0
            for mid in member_ids:
                try:
                    tx_res = (
                        sb_client.table("transactions")
                        .select("amount,type,scope")
                        .eq("user_id", mid)
                        .eq("type", "expense")
                        .in_("scope", ["couple", "group"])
                        .gte("date", month_start)
                        .execute()
                    )
                    for tx in (tx_res.data or []):
                        name = next((m["display_name"] for m in members_data if m["member_id"] == mid), "?")
                        room_spending[name] = room_spending.get(name, 0) + tx["amount"]
                        total_room_expense += tx["amount"]
                except Exception:
                    pass

            room_info = (
                f"\u2022 <b>{r.get('plan_type', 'couple').title()}</b>\n"
                f"  Kode: <code>{r.get('invite_code', '-')}</code>\n"
                f"  Anggota: {', '.join(member_names)}"
            )

            if total_room_expense > 0:
                room_info += f"\n\n  \U0001f4b8 <b>Pengeluaran Bersama ({today.strftime('%b %Y')}):</b>\n"
                room_info += f"  Total: <b>{_fmt(total_room_expense)}</b>\n"
                for name, amount in sorted(room_spending.items(), key=lambda x: x[1], reverse=True):
                    room_info += f"  \u2022 {name}: {_fmt(amount)}\n"
            else:
                room_info += "\n  \U0001f4ad Belum ada pengeluaran bersama bulan ini."

            lines.append(room_info)

        send_message(chat_id, "\n\n".join(lines))
    except Exception as exc:
        send_message(chat_id, f"\u26a0\ufe0f Gagal mengambil info room: {exc}")


# ---------------------------------------------------------------------------
# Delete Transaction (Telegram)
# ---------------------------------------------------------------------------

def _cmd_hapus(chat_id: int | str, user_id: Optional[str], sb_client: Any) -> None:
    """Show last 5 transactions as buttons for deletion."""
    if not user_id:
        send_message(chat_id, "\u26a0\ufe0f Gagal menginisialisasi akun. Coba /start dulu.")
        return
    if not sb_client:
        send_message(chat_id, "\u26a0\ufe0f Database tidak tersambung.")
        return

    try:
        res = (
            sb_client.table("transactions")
            .select("id,date,description,amount,type")
            .eq("user_id", user_id)
            .order("date", desc=True)
            .limit(5)
            .execute()
        )
        txs = res.data or []

        if not txs:
            send_message(chat_id, "\U0001f4ad Belum ada transaksi untuk dihapus.")
            return

        lines = ["\U0001f5d1 <b>Pilih transaksi yang mau dihapus:</b>\n"]
        keyboard: list[list[dict]] = []
        for i, tx in enumerate(txs, 1):
            icon = "\U0001f4b0" if tx["type"] == "income" else "\U0001f4b8"
            lines.append(
                f"{i}. {icon} {tx['description']} — {_fmt(tx['amount'])} ({tx['date']})"
            )
            keyboard.append([
                {"text": f"\U0001f5d1 {i}. {tx['description'][:25]}", "callback_data": f"del:{tx['id']}"}
            ])

        keyboard.append([{"text": "\u274c Batal", "callback_data": "del:cancel"}])
        _send_keyboard(chat_id, "\n".join(lines), keyboard)

    except Exception as exc:
        send_message(chat_id, f"\u26a0\ufe0f Gagal mengambil transaksi: {exc}")

def _cmd_lapor_start(chat_id: int | str) -> None:
    _REPORT_SESSIONS[str(chat_id)] = {"step": "waiting_feedback"}
    send_message(
        chat_id,
        "\U0001f6a8 <b>Lapor Bug / Kendala</b>\n\nSilakan ketikkan masalah atau bug yang kamu alami. Nanti tim OprexDuit akan mengeceknya.\n\nKetik /batal jika tidak jadi melapor."
    )

def _handle_lapor_input(chat_id: int | str, text: str, username: str, sb_client: Any = None) -> None:
    session = _REPORT_SESSIONS.get(str(chat_id))
    if not session:
        return
    
    # Try to save to Supabase for admin console
    saved_to_db = False
    if sb_client:
        try:
            sb_client.table("bug_reports").insert({
                "telegram_chat_id": str(chat_id),
                "username": username,
                "message": text[:2000],
                "status": "open",
                "created_at": _now_wib().isoformat(),
            }).execute()
            saved_to_db = True
        except Exception as exc:
            print(f"[bug_report] Gagal simpan ke DB: {exc}")
    
    # Always log to stdout as backup
    print("====================================================")
    print(f"[BUG REPORT] From user {username} ({chat_id}):")
    print(f"{text}")
    print("====================================================")
    
    send_message(chat_id, "\u2705 Laporanmu sudah diteruskan ke tim pengembang OprexDuit. Terima kasih!")
    _REPORT_SESSIONS.pop(str(chat_id), None)

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
    """Step 1 - Ask user which platform via inline keyboard buttons."""
    _SHOPPING_SESSIONS[str(chat_id)] = {"step": "choose_platform"}
    _send_keyboard(
        chat_id,
        "\U0001f6cd\ufe0f <b>Belanja Hemat dengan AI</b>\n\nMau belanja di platform mana?",
        [
            [
                {"text": "\U0001f7e0 Shopee", "callback_data": "shop:platform:shopee"},
                {"text": "\U0001f3b5 TikTok Shop", "callback_data": "shop:platform:tiktokshop"},
            ],
            [
                {"text": "\U0001f7e2 Alfagift", "callback_data": "shop:platform:alfagift"},
            ],
        ],
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
            _send_keyboard(
                chat_id,
                f"\U0001f614 Belum ada produk <b>{query}</b> di {platform_label}.\n\n"
                "Coba cari produk lain atau hubungi admin!",
                [
                    [{"text": "\U0001f50d Cari Produk Lain", "callback_data": "shop:newproduct"}],
                    [{"text": "\u274c Selesai", "callback_data": "shop:cancel"}],
                ],
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
                f"   \U0001f4b0 {price_str}"
            )
            if p.get("description"):
                desc = p["description"][:80]
                lines.append(f"   \U0001f4dd {desc}{'...' if len(p['description']) > 80 else ''}")

        # Build inline keyboard: each product row = [Beli URL button] [Lapor button]
        keyboard: list[list[dict]] = []
        for i, p in enumerate(products, 1):
            price_str = _fmt(p["price"]) if p.get("price") else "Lihat"
            name_short = p["name"][:22]
            row: list[dict] = [
                {"text": f"\U0001f6d2 {i}. {name_short}", "url": p["affiliate_url"]},
                {"text": "\U0001f6a9 Lapor", "callback_data": f"shop:report:{p['id']}"},
            ]
            keyboard.append(row)

        keyboard.append([
            {"text": "\u2705 Sudah Beli", "callback_data": "shop:confirm"},
            {"text": "\U0001f50d Cari Lain", "callback_data": "shop:newproduct"},
            {"text": "\u274c Selesai", "callback_data": "shop:cancel"},
        ])

        _send_keyboard(chat_id, "\n".join(lines), keyboard)

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
                        "date": _today_wib().isoformat(),
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
# Inline keyboard callback handlers
# ---------------------------------------------------------------------------

def _handle_callback_query(cq: dict, sb_client: Any) -> None:
    """Dispatch inline button presses."""
    cq_id: str = cq["id"]
    chat_id: int = cq["message"]["chat"]["id"]
    from_data = cq.get("from") or {}
    username: str = (
        from_data.get("username") or from_data.get("first_name") or str(chat_id)
    )
    data: str = cq.get("data", "")

    if data.startswith("shop:platform:"):
        platform_key = data[len("shop:platform:"):]
        _answer_callback(cq_id, "Platform dipilih!")
        _handle_platform_selection(chat_id, platform_key)

    elif data == "cmd:ringkasan":
        _answer_callback(cq_id)
        user_id = _get_or_create_telegram_user(chat_id, username, sb_client)
        _cmd_ringkasan(chat_id, user_id, sb_client)
        _show_menu(chat_id, sb_client, prefix="\U0001f4f1 <b>Menu:</b>")
        
    elif data == "cmd:laporan":
        _answer_callback(cq_id)
        user_id = _get_or_create_telegram_user(chat_id, username, sb_client)
        _cmd_laporan(chat_id, user_id, sb_client)
        _show_menu(chat_id, sb_client, prefix="\U0001f4f1 <b>Menu:</b>")
        
    elif data == "cmd:budget":
        _answer_callback(cq_id)
        user_id = _get_or_create_telegram_user(chat_id, username, sb_client)
        _cmd_budget(chat_id, user_id, sb_client)
        _show_menu(chat_id, sb_client, prefix="\U0001f4f1 <b>Menu:</b>")
        
    elif data == "cmd:belanja":
        _answer_callback(cq_id)
        _cmd_belanja_start(chat_id)
        
    elif data == "cmd:link":
        _answer_callback(cq_id)
        _cmd_link(chat_id, sb_client)
        
    elif data == "cmd:splitbill":
        _answer_callback(cq_id)
        _cmd_splitbill_start(chat_id)
        
    elif data == "cmd:noop":
        _answer_callback(cq_id)

    elif data == "shop:confirm":
        _answer_callback(cq_id, "Mencatat pembelian...")
        _handle_purchase_confirm(chat_id, username, sb_client)

    elif data == "shop:cancel":
        _answer_callback(cq_id, "Sesi belanja diakhiri.")
        _SHOPPING_SESSIONS.pop(str(chat_id), None)
        send_message(
            chat_id,
            "Tidak jadi belanja? Tidak apa-apa! \U0001f60a\n"
            "Ketik /belanja kapan saja jika mau cari produk ya!",
        )

    elif data == "shop:newproduct":
        _answer_callback(cq_id)
        session = _SHOPPING_SESSIONS.get(str(chat_id), {})
        session["step"] = "choose_product"
        _SHOPPING_SESSIONS[str(chat_id)] = session
        send_message(chat_id, "Mau cari produk apa? Ketik nama produknya \U0001f50d")

    elif data.startswith("shop:report:"):
        product_id = data[len("shop:report:"):]
        _answer_callback(cq_id, "Laporan terkirim! Terima kasih \U0001f64f")
        _report_broken_link(chat_id, product_id, username, sb_client)

    elif data.startswith("tx:scope:"):
        parts = data.split(":")
        if len(parts) == 4:
            new_scope = parts[2]
            tx_id = parts[3]
            try:
                sb_client.table("transactions").update({"scope": new_scope}).eq("id", tx_id).execute()
                emoji = _SCOPE_EMOJI.get(new_scope, "")
                label = _SCOPE_LABEL.get(new_scope, new_scope.title())
                _answer_callback(cq_id, f"Cakupan diubah ke {label}!")
                send_message(
                    chat_id,
                    f"{emoji} <b>Cakupan diperbarui!</b>\n\n"
                    f"Transaksi ini sekarang tercatat sebagai pengeluaran <b>{label}</b>.\n"
                    + ("Transaksi akan muncul di laporan bersama room kamu." if new_scope != "private" else "Transaksi ini hanya terlihat oleh kamu."),
                )

                # Notify room members if scope is shared
                if new_scope != "private":
                    user_id = _get_or_create_telegram_user(chat_id, username, sb_client)
                    if user_id:
                        # Fetch tx details for notification
                        tx_res = sb_client.table("transactions").select("amount,type,description").eq("id", tx_id).maybe_single().execute()
                        if tx_res.data:
                            tx = tx_res.data
                            _notify_room_members(
                                user_id=user_id,
                                username=username,
                                scope=new_scope,
                                tx_type=tx.get("type", "expense"),
                                amount=tx.get("amount", 0),
                                description=tx.get("description", ""),
                                sb_client=sb_client,
                            )
            except Exception:
                _answer_callback(cq_id, "Gagal mengubah scope.")
        else:
            _answer_callback(cq_id)

    elif data == "cmd:room":
        _answer_callback(cq_id)
        user_id = _get_or_create_telegram_user(chat_id, username, sb_client)
        _cmd_room(chat_id, [], username, user_id, sb_client)

    elif data == "cmd:hapus":
        _answer_callback(cq_id)
        user_id = _get_or_create_telegram_user(chat_id, username, sb_client)
        _cmd_hapus(chat_id, user_id, sb_client)

    elif data == "cmd:lapor":
        _answer_callback(cq_id)
        _cmd_lapor_start(chat_id)

    elif data == "room:create":
        _answer_callback(cq_id, "Membuat room...")
        user_id = _get_or_create_telegram_user(chat_id, username, sb_client)
        if user_id:
            _room_create(chat_id, username, user_id, sb_client)

    elif data == "room:join_prompt":
        _answer_callback(cq_id)
        send_message(
            chat_id,
            "\U0001f517 Ketik kode undangan:\n"
            "<code>/room join KODE_UNDANGAN</code>",
        )

    elif data == "room:info":
        _answer_callback(cq_id)
        user_id = _get_or_create_telegram_user(chat_id, username, sb_client)
        if user_id:
            _room_info(chat_id, user_id, sb_client)

    elif data.startswith("del:"):
        tx_id = data[4:]
        if tx_id == "cancel":
            _answer_callback(cq_id, "Batal hapus.")
            send_message(chat_id, "\u274e Penghapusan dibatalkan.")
        else:
            _answer_callback(cq_id, "Menghapus...")
            try:
                sb_client.table("transactions").delete().eq("id", tx_id).execute()
                send_message(chat_id, "\u2705 Transaksi berhasil dihapus!")
            except Exception as exc:
                send_message(chat_id, f"\u26a0\ufe0f Gagal menghapus: {exc}")

    else:
        _answer_callback(cq_id)


def _handle_platform_selection(chat_id: int | str, platform_key: str) -> None:
    """Called when user picks a platform via button."""
    platform_label = _PLATFORM_LABELS.get(platform_key, platform_key.title())
    _SHOPPING_SESSIONS[str(chat_id)] = {
        "step": "choose_product",
        "platform": platform_key,
        "platform_label": platform_label,
    }
    send_message(
        chat_id,
        f"\u2705 Platform: <b>{platform_label}</b>\n\n"
        "Mau belanja apa? Ketik nama produknya:\n"
        "<i>(contoh: sunscreen, headset gaming, beras 5kg)</i>\n\n"
        "Ketik /batal untuk keluar.",
    )


def _handle_purchase_confirm(chat_id: int | str, username: str, sb_client: Any) -> None:
    """Record a purchase when user presses 'Sudah Beli' button."""
    session = _SHOPPING_SESSIONS.get(str(chat_id), {})
    products = session.get("products", [])
    query = session.get("query", "Belanja online")

    if products and products[0].get("price"):
        amount = products[0]["price"]
        user_id = _get_or_create_telegram_user(chat_id, username, sb_client)
        if user_id and sb_client:
            try:
                sb_client.table("transactions").insert({
                    "user_id": user_id,
                    "date": _today_wib().isoformat(),
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
                    "Terima kasih sudah belanja hemat! \U0001f389",
                )
            except Exception as exc:
                send_message(chat_id, f"\u2705 Terima kasih! (Gagal menyimpan transaksi: {exc})")
        else:
            send_message(chat_id, "\u2705 Terima kasih sudah belanja! \U0001f389")
    else:
        send_message(
            chat_id,
            f"\u2705 Terima kasih sudah belanja <b>{query}</b>!\n"
            "Jangan lupa catat pengeluarannya ya:\n"
            f"<code>50rb {query}</code>",
        )
    _SHOPPING_SESSIONS.pop(str(chat_id), None)


def _report_broken_link(
    chat_id: int | str, product_id: str, username: str, sb_client: Any
) -> None:
    """Insert a broken-link report into link_reports table."""
    if not sb_client:
        send_message(chat_id, "\u26a0\ufe0f Gagal mengirim laporan. Coba lagi nanti.")
        return
    try:
        user_id = _get_user_id(chat_id, sb_client)
        sb_client.table("link_reports").insert({
            "product_id": product_id,
            "reported_by": user_id,
            "reason": "Link rusak / tidak bisa dibuka (laporan dari Telegram)",
        }).execute()
        send_message(
            chat_id,
            "\U0001f64f Terima kasih laporan kamu!\n\n"
            "Admin akan segera memperbaiki link tersebut. \U0001f527",
        )
    except Exception as exc:
        send_message(chat_id, f"\u26a0\ufe0f Gagal mengirim laporan: {exc}")


# ---------------------------------------------------------------------------
# Split Bill Flow
# ---------------------------------------------------------------------------

def _cmd_splitbill_start(chat_id: int | str) -> None:
    _SPLITBILL_SESSIONS[str(chat_id)] = {"step": "input_text"}
    send_message(
        chat_id,
        "🤝 <b>Mode Patungan (Split Bill)</b> - Powered by AI\n\n"
        "Ketikkan daftar belanjaanmu untuk dipisah secara cerdas. Contoh:\n\n"
        "<code>bakso 15rb 3 porsi\n"
        "es teh 5000 2 gelas\n"
        "krupuk 2000 1x</code>\n\n"
        "Ketik /batal untuk membatalkan."
    )


def _handle_splitbill_input(chat_id: int | str, text: str, username: str, sb_client: Any) -> None:
    session = _SPLITBILL_SESSIONS.get(str(chat_id))
    if not session:
        return

    step = session.get("step")

    if step == "input_text":
        send_message(chat_id, "\u23f3 Sedang membaca tagihan dengan AI...")
        try:
            from app.ai_service import parse_split_bill_text
            items = parse_split_bill_text(text)
            if not items:
                send_message(chat_id, "\u26a0\ufe0f Tidak mendektesi daftar belanja. Coba format lain atau ketik /batal")
                return

            lines = ["\U0001f4cb <b>Item Tagihan Ditemukan:</b>\n"]
            total = 0
            for i, it in enumerate(items, 1):
                sub = it["price"] * it["qty"]
                total += sub
                lines.append(f"{i}. <b>{it['name']}</b> (x{it['qty']}) = {_fmt(sub)}")
            lines.append(f"\n<b>Total: {_fmt(total)}</b>")
            lines.append("\n\U0001f449 <i>Fitur penugasan tagihan ke teman sedang disempurnakan. Data ini dapat ditambahkan ke database Split Bill Anda!</i>")

            # Reset session after outputting the raw items mapping MVP
            _SPLITBILL_SESSIONS.pop(str(chat_id), None)
            send_message(chat_id, "\n".join(lines))

        except Exception as exc:
            send_message(chat_id, f"\u26a0\ufe0f Gagal memproses AI: {exc}")
            _SPLITBILL_SESSIONS.pop(str(chat_id), None)

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
        today = _today_wib()
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
    today = _today_wib()
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
