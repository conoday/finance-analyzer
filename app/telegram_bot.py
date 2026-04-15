"""app/telegram_bot.py â€” Telegram Bot handlers for OprexDuit.

Webhook-based (no polling). Telegram sends POST requests to
/telegram/webhook on the FastAPI backend.

No python-telegram-bot required â€” uses httpx directly.

Commands:
  /start     â€” Welcome + generate link code
  /link      â€” Get/refresh link code to connect web account
  /catat     â€” Record transaction: /catat 50rb makan siang
  /ringkasan â€” Today's spending summary
  /laporan   â€” This month's report
  /budget    â€” Check budget status vs limits
  /bantuan   â€” Show help
  (free text) â€” Auto-parsed as transaction input
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
                "disable_web_page_preview": True,
            })
    except Exception as exc:
        print(f"[telegram] send_message error: {exc}")


def _fmt(amount: float) -> str:
    """Format as Indonesian Rupiah: 1234567 -> Rp1.234.567"""
    return f"Rp{amount:,.0f}".replace(",", ".")


def _progress_bar(pct: float, width: int = 10) -> str:
    filled = min(int(pct / 100 * width), width)
    return "â–ˆ" * filled + "â–‘" * (width - filled)


# ---------------------------------------------------------------------------
# Main dispatcher
# ---------------------------------------------------------------------------

def handle_update(update: dict, sb_client: Any) -> None:
    """Entry point â€” called by the FastAPI /telegram/webhook endpoint."""
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
            .single()
            .execute()
        )
        return res.data["id"] if res.data else None
    except Exception:
        return None


def _store_pending_link(chat_id: int | str, sb_client: Any) -> str:
    """Upsert a fresh link code for this chat_id. Returns the code."""
    code = secrets.token_urlsafe(8)
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
    A placeholder internal email is used so the schema is satisfied â€” the user
    never needs to log in via email.  Returns the new UUID or None on failure.
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

        # Write profile so _get_user_id can find this user by chat_id going forward
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
    # /link only checks existing link â€” does NOT auto-create
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
    elif command in ("/bantuan", "/help"):
        _cmd_bantuan(chat_id)
    else:
        send_message(chat_id, "Perintah tidak dikenal. Ketik /bantuan untuk panduan.")


def _handle_free_text(chat_id: int | str, text: str, username: str, sb_client: Any) -> None:
    """Try to parse free-form text as a transaction."""
    user_id = _get_or_create_telegram_user(chat_id, username, sb_client)
    if not user_id:
        send_message(
            chat_id,
            "âš ï¸ Tidak bisa membuat akun saat ini.\n"
            "Coba ketik /start untuk memulai.",
        )
        return

    parsed = parse_transaction(text)
    if parsed:
        _save_and_confirm(chat_id, parsed, user_id, sb_client)
    else:
        send_message(
            chat_id,
            "Hmm, tidak bisa membaca transaksi ini ðŸ¤”\n\n"
            "<b>Format yang bisa dibaca:</b>\n"
            "â€¢ <code>50rb makan siang</code>\n"
            "â€¢ <code>catat 25000 bensin</code>\n"
            "â€¢ <code>+2jt gaji bulan ini</code>\n\n"
            "Atau ketik /bantuan untuk panduan lengkap.",
        )


# ---------------------------------------------------------------------------
# Individual command implementations
# ---------------------------------------------------------------------------

def _cmd_start(chat_id: int | str, user_id: Optional[str], username: str, sb_client: Any) -> None:
    if user_id:
        send_message(
            chat_id,
            f"ðŸ‘‹ Halo <b>{username}</b>! Selamat datang di <b>OprexDuit Bot</b> ðŸ¤‘\n\n"
            "âœ… Akun kamu sudah aktif â€” langsung bisa dipakai!\n\n"
            "ðŸ“ Catat pengeluaran:\n"
            "  <code>50rb makan siang</code>\n"
            "  <code>25000 bensin</code>\n\n"
            "ðŸ“Š Perintah lainnya:\n"
            "  /ringkasan â€” Ringkasan hari ini\n"
            "  /laporan   â€” Laporan bulan ini\n"
            "  /budget    â€” Cek budget\n"
            "  /bantuan   â€” Panduan lengkap\n\n"
            "ðŸ’¡ <i>Ingin akses analisis di web? Ketik /link untuk menghubungkan ke OprexDuit Web.</i>",
        )
    else:
        send_message(
            chat_id,
            "âš ï¸ Tidak bisa membuat akun saat ini. Coba lagi nanti atau hubungi support.",
        )


def _cmd_link(chat_id: int | str, sb_client: Any) -> None:
    link_code = _store_pending_link(chat_id, sb_client)
    link_url = f"{_WEB_URL}/settings?code={link_code}"
    send_message(
        chat_id,
        "ðŸ”— <b>Hubungkan Akun OprexDuit</b>\n\n"
        f"ðŸ‘‰ <a href='{link_url}'>Klik di sini untuk menghubungkan</a>\n\n"
        f"Atau buka Settings secara manual dan masukkan kode:\n"
        f"<code>{link_code}</code>\n\n"
        "<i>Link/kode berlaku 24 jam.</i>",
    )


def _cmd_catat(
    chat_id: int | str,
    text: str,
    user_id: Optional[str],
    sb_client: Any,
) -> None:
    if not user_id:
        send_message(chat_id, "⚠️ Gagal menginisialisasi akun. Coba ketik /start lagi.")
        return

    if not text.strip():
        send_message(
            chat_id,
            "Format: <code>/catat [jumlah] [keterangan]</code>\n\n"
            "Contoh:\n"
            "â€¢ <code>/catat 50rb makan siang</code>\n"
            "â€¢ <code>/catat 25000 bensin</code>\n"
            "â€¢ <code>/catat +2jt gaji</code>",
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
    icon = "ðŸ’°" if parsed.type == "income" else "ðŸ’¸"
    type_label = "Pemasukan" if parsed.type == "income" else "Pengeluaran"

    if not sb_client:
        send_message(chat_id, "âš ï¸ Database tidak tersambung saat ini.")
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
        send_message(chat_id, f"âš ï¸ Gagal menyimpan: {exc}")


def _cmd_ringkasan(
    chat_id: int | str,
    user_id: Optional[str],
    sb_client: Any,
) -> None:
    if not user_id:
        send_message(chat_id, "⚠️ Gagal menginisialisasi akun. Coba ketik /start lagi.")
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
                f"ðŸ“Š <b>Ringkasan Hari Ini</b> ({date.today().strftime('%d %b %Y')})\n\n"
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

        lines = [f"ðŸ“Š <b>Ringkasan Hari Ini</b> ({date.today().strftime('%d %b %Y')})\n"]
        lines.append(f"ðŸ’° Pemasukan : <b>{_fmt(total_income)}</b>")
        lines.append(f"ðŸ’¸ Pengeluaran: <b>{_fmt(total_expense)}</b>")
        lines.append(f"{'ðŸ“ˆ' if net >= 0 else 'ðŸ“‰'} Net       : <b>{_fmt(net)}</b>")

        if expenses:
            lines.append(f"\n<b>Top pengeluaran ({len(expenses)} transaksi):</b>")
            for tx in expenses[:5]:
                lines.append(f"â€¢ {tx['description']} â€” {_fmt(tx['amount'])}")
            if len(expenses) > 5:
                lines.append(f"  ... dan {len(expenses) - 5} lainnya")

        send_message(chat_id, "\n".join(lines))

    except Exception as exc:
        send_message(chat_id, f"âš ï¸ Gagal mengambil data: {exc}")


def _cmd_laporan(
    chat_id: int | str,
    user_id: Optional[str],
    sb_client: Any,
) -> None:
    if not user_id:
        send_message(chat_id, "⚠️ Gagal menginisialisasi akun. Coba ketik /start lagi.")
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

        lines = [f"ðŸ“… <b>Laporan Bulan Ini</b> ({today.strftime('%B %Y')})\n"]
        lines.append(f"ðŸ’° Pemasukan : <b>{_fmt(total_income)}</b>")
        lines.append(f"ðŸ’¸ Pengeluaran: <b>{_fmt(total_expense)}</b>")
        lines.append(f"{'ðŸ“ˆ' if net >= 0 else 'ðŸ“‰'} Net       : <b>{_fmt(net)}</b>")
        lines.append(f"ðŸ“ Total transaksi: {len(txs)}")

        if top_cats:
            lines.append("\n<b>Top Kategori Pengeluaran:</b>")
            for cat, total in top_cats:
                pct = (total / total_expense * 100) if total_expense > 0 else 0
                lines.append(f"â€¢ {cat}: {_fmt(total)} ({pct:.0f}%)")

        send_message(chat_id, "\n".join(lines))

    except Exception as exc:
        send_message(chat_id, f"âš ï¸ Gagal mengambil laporan: {exc}")


def _cmd_budget(
    chat_id: int | str,
    user_id: Optional[str],
    sb_client: Any,
) -> None:
    if not user_id:
        send_message(chat_id, "⚠️ Gagal menginisialisasi akun. Coba ketik /start lagi.")
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
                "âš ï¸ Belum ada budget yang diatur.\n\n"
                "Set budget di website:\n"
                "<b>OprexDuit â†’ Budgeting â†’ Atur Limit</b>",
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

        lines = [f"ðŸ’° <b>Status Budget {today.strftime('%B %Y')}</b>\n"]
        for cat, limit in budgets.items():
            used = spending.get(cat, 0)
            pct = (used / limit * 100) if limit > 0 else 0
            bar = _progress_bar(pct)
            status = "ðŸŸ¢" if pct < 70 else ("ðŸŸ¡" if pct < 90 else "ðŸ”´")
            lines.append(
                f"{status} <b>{cat}</b>\n"
                f"   {bar} {pct:.0f}%\n"
                f"   {_fmt(used)} / {_fmt(limit)}"
            )

        send_message(chat_id, "\n\n".join(lines))

    except Exception as exc:
        send_message(chat_id, f"âš ï¸ Gagal mengambil data budget: {exc}")


def _cmd_bantuan(chat_id: int | str) -> None:
    send_message(
        chat_id,
        "<b>ðŸ“± OprexDuit Bot â€” Panduan</b>\n\n"
        "<b>Catat Transaksi (kirim teks langsung):</b>\n"
        "â€¢ <code>50rb makan siang</code>\n"
        "â€¢ <code>catat 25000 bensin</code>\n"
        "â€¢ <code>+2jt gaji bulan ini</code>\n\n"
        "<b>Format Jumlah:</b>\n"
        "â€¢ <code>50rb</code> = Rp50.000\n"
        "â€¢ <code>1.5jt</code> = Rp1.500.000\n"
        "â€¢ <code>500000</code> = Rp500.000\n"
        "â€¢ Awali <code>+</code> untuk pemasukan\n\n"
        "<b>Perintah:</b>\n"
        "/ringkasan â€” Ringkasan hari ini\n"
        "/laporan   â€” Laporan bulan ini\n"
        "/budget    â€” Cek status budget\n"
        "/link      â€” Kode hubungkan akun\n"
        "/bantuan   â€” Tampilkan panduan ini",
    )


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

        send_message(
            chat_id,
            f"ðŸ“Š <b>Laporan Mingguan OprexDuit</b>\n"
            f"({week_start} â€” {today.isoformat()})\n\n"
            f"ðŸ’° Pemasukan : <b>{_fmt(total_income)}</b>\n"
            f"ðŸ’¸ Pengeluaran: <b>{_fmt(total_expense)}</b>\n"
            f"{'ðŸ“ˆ' if net >= 0 else 'ðŸ“‰'} Net       : <b>{_fmt(net)}</b>\n"
            f"ðŸ“ Transaksi : {len(txs)}\n\n"
            f"Detail selengkapnya di <a href='https://oprexduit.vercel.app'>OprexDuit Web</a> ðŸŒ",
        )
    except Exception as exc:
        print(f"[telegram] weekly_summary error for {user_id}: {exc}")


def send_budget_alerts(sb_client: Any) -> int:
    """Send alert to users who exceeded 80% of any budget this month."""
    if not sb_client:
        return 0
    today = date.today()
    month_start = today.replace(day=1).isoformat()

    try:
        res = (
            sb_client.table("profiles")
            .select("id,telegram_chat_id")
            .not_.is_("telegram_chat_id", None)
            .execute()
        )
        count = 0
        for user in res.data or []:
            chat_id = user["telegram_chat_id"]
            user_id = user["id"]

            budgets_res = (
                sb_client.table("budgets")
                .select("category,monthly_limit")
                .eq("user_id", user_id)
                .execute()
            )
            budgets = {b["category"]: b["monthly_limit"] for b in (budgets_res.data or [])}
            if not budgets:
                continue

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

            alerts: list[str] = []
            for cat, limit in budgets.items():
                used = spending.get(cat, 0)
                pct = (used / limit * 100) if limit > 0 else 0
                if pct >= 80:
                    emoji = "ðŸ”´" if pct >= 100 else "ðŸŸ¡"
                    alerts.append(
                        f"{emoji} <b>{cat}</b>: {pct:.0f}%"
                        f" ({_fmt(used)} / {_fmt(limit)})"
                    )

            if alerts:
                lines = ["âš ï¸ <b>Peringatan Budget Bulan Ini!</b>\n"]
                lines.extend(alerts)
                lines.append("\nYuk hemat di sisa bulan ini ðŸ’ª")
                send_message(chat_id, "\n".join(lines))
                count += 1

        return count
    except Exception as exc:
        print(f"[telegram] budget_alerts error: {exc}")
        return 0

