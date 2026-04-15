"""app/telegram_bot.py — Telegram Bot handlers for OprexDuit.

Webhook-based (no polling). Telegram sends POST requests to
/telegram/webhook on the FastAPI backend.

No python-telegram-bot required — uses httpx directly.

Commands:
  /start     — Welcome + generate link code
  /link      — Get/refresh link code to connect web account
  /catat     — Record transaction: /catat 50rb makan siang
  /ringkasan — Today's spending summary
  /laporan   — This month's report
  /budget    — Check budget status vs limits
  /bantuan   — Show help
  (free text) — Auto-parsed as transaction input
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
    return "█" * filled + "░" * (width - filled)


# ---------------------------------------------------------------------------
# Main dispatcher
# ---------------------------------------------------------------------------

def handle_update(update: dict, sb_client: Any) -> None:
    """Entry point — called by the FastAPI /telegram/webhook endpoint."""
    message = update.get("message") or update.get("edited_message")
    if not message:
        return

    chat_id: int = message["chat"]["id"]
    text: str = (message.get("text") or "").strip()
    if not text:
        return

    if text.startswith("/"):
        parts = text.split()
        # Strip @BotName suffix from command (e.g. /start@OprexDuidbot -> /start)
        command = parts[0].lower().split("@")[0]
        args = parts[1:]
        _handle_command(chat_id, command, args, sb_client)
    else:
        _handle_free_text(chat_id, text, sb_client)


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


# ---------------------------------------------------------------------------
# Command handlers
# ---------------------------------------------------------------------------

def _handle_command(
    chat_id: int | str,
    command: str,
    args: list[str],
    sb_client: Any,
) -> None:
    user_id = _get_user_id(chat_id, sb_client)

    if command == "/start":
        _cmd_start(chat_id, user_id, sb_client)
    elif command == "/link":
        _cmd_link(chat_id, sb_client)
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


def _handle_free_text(chat_id: int | str, text: str, sb_client: Any) -> None:
    """Try to parse free-form text as a transaction."""
    user_id = _get_user_id(chat_id, sb_client)
    if not user_id:
        send_message(
            chat_id,
            "Akun belum terhubung 🔗\n\n"
            "Ketik /link untuk mendapatkan kode hubungkan.\n"
            "Masukkan kode tersebut di OprexDuit Web → Settings → Telegram.",
        )
        return

    parsed = parse_transaction(text)
    if parsed:
        _save_and_confirm(chat_id, parsed, user_id, sb_client)
    else:
        send_message(
            chat_id,
            "Hmm, tidak bisa membaca transaksi ini 🤔\n\n"
            "<b>Format yang bisa dibaca:</b>\n"
            "• <code>50rb makan siang</code>\n"
            "• <code>catat 25000 bensin</code>\n"
            "• <code>+2jt gaji bulan ini</code>\n\n"
            "Atau ketik /bantuan untuk panduan lengkap.",
        )


# ---------------------------------------------------------------------------
# Individual command implementations
# ---------------------------------------------------------------------------

def _cmd_start(chat_id: int | str, user_id: Optional[str], sb_client: Any) -> None:
    if user_id:
        send_message(
            chat_id,
            "👋 Selamat datang kembali di <b>OprexDuit Bot</b>!\n\n"
            "✅ Akun sudah terhubung\n\n"
            "Ketik /bantuan untuk daftar perintah.",
        )
    else:
        link_code = _store_pending_link(chat_id, sb_client)
        link_url = f"{_WEB_URL}/settings?code={link_code}"
        send_message(
            chat_id,
            "👋 Halo! Selamat datang di <b>OprexDuit Bot</b> 🤑\n\n"
            "Bot ini bisa:\n"
            "📝 Catat transaksi lewat chat\n"
            "📊 Laporan harian &amp; mingguan otomatis\n"
            "⏰ Reminder budget\n\n"
            "<b>Hubungkan akun OprexDuit kamu:</b>\n"
            f"👉 <a href='{link_url}'>Klik link ini untuk menghubungkan</a>\n\n"
            f"Atau masukkan kode manual di Settings:\n"
            f"<code>{link_code}</code>\n\n"
            "<i>Kode berlaku 24 jam. Gunakan /link untuk kode baru.</i>",
        )


def _cmd_link(chat_id: int | str, sb_client: Any) -> None:
    link_code = _store_pending_link(chat_id, sb_client)
    link_url = f"{_WEB_URL}/settings?code={link_code}"
    send_message(
        chat_id,
        "🔗 <b>Hubungkan Akun OprexDuit</b>\n\n"
        f"👉 <a href='{link_url}'>Klik di sini untuk menghubungkan</a>\n\n"
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
        send_message(chat_id, "Akun belum terhubung. Gunakan /link terlebih dahulu.")
        return

    if not text.strip():
        send_message(
            chat_id,
            "Format: <code>/catat [jumlah] [keterangan]</code>\n\n"
            "Contoh:\n"
            "• <code>/catat 50rb makan siang</code>\n"
            "• <code>/catat 25000 bensin</code>\n"
            "• <code>/catat +2jt gaji</code>",
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
    icon = "💰" if parsed.type == "income" else "💸"
    type_label = "Pemasukan" if parsed.type == "income" else "Pengeluaran"

    if not sb_client:
        send_message(chat_id, "⚠️ Database tidak tersambung saat ini.")
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
        send_message(chat_id, f"⚠️ Gagal menyimpan: {exc}")


def _cmd_ringkasan(
    chat_id: int | str,
    user_id: Optional[str],
    sb_client: Any,
) -> None:
    if not user_id:
        send_message(chat_id, "Akun belum terhubung. Gunakan /link terlebih dahulu.")
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
                f"📊 <b>Ringkasan Hari Ini</b> ({date.today().strftime('%d %b %Y')})\n\n"
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

        lines = [f"📊 <b>Ringkasan Hari Ini</b> ({date.today().strftime('%d %b %Y')})\n"]
        lines.append(f"💰 Pemasukan : <b>{_fmt(total_income)}</b>")
        lines.append(f"💸 Pengeluaran: <b>{_fmt(total_expense)}</b>")
        lines.append(f"{'📈' if net >= 0 else '📉'} Net       : <b>{_fmt(net)}</b>")

        if expenses:
            lines.append(f"\n<b>Top pengeluaran ({len(expenses)} transaksi):</b>")
            for tx in expenses[:5]:
                lines.append(f"• {tx['description']} — {_fmt(tx['amount'])}")
            if len(expenses) > 5:
                lines.append(f"  ... dan {len(expenses) - 5} lainnya")

        send_message(chat_id, "\n".join(lines))

    except Exception as exc:
        send_message(chat_id, f"⚠️ Gagal mengambil data: {exc}")


def _cmd_laporan(
    chat_id: int | str,
    user_id: Optional[str],
    sb_client: Any,
) -> None:
    if not user_id:
        send_message(chat_id, "Akun belum terhubung. Gunakan /link terlebih dahulu.")
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

        lines = [f"📅 <b>Laporan Bulan Ini</b> ({today.strftime('%B %Y')})\n"]
        lines.append(f"💰 Pemasukan : <b>{_fmt(total_income)}</b>")
        lines.append(f"💸 Pengeluaran: <b>{_fmt(total_expense)}</b>")
        lines.append(f"{'📈' if net >= 0 else '📉'} Net       : <b>{_fmt(net)}</b>")
        lines.append(f"📝 Total transaksi: {len(txs)}")

        if top_cats:
            lines.append("\n<b>Top Kategori Pengeluaran:</b>")
            for cat, total in top_cats:
                pct = (total / total_expense * 100) if total_expense > 0 else 0
                lines.append(f"• {cat}: {_fmt(total)} ({pct:.0f}%)")

        send_message(chat_id, "\n".join(lines))

    except Exception as exc:
        send_message(chat_id, f"⚠️ Gagal mengambil laporan: {exc}")


def _cmd_budget(
    chat_id: int | str,
    user_id: Optional[str],
    sb_client: Any,
) -> None:
    if not user_id:
        send_message(chat_id, "Akun belum terhubung. Gunakan /link terlebih dahulu.")
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
                "⚠️ Belum ada budget yang diatur.\n\n"
                "Set budget di website:\n"
                "<b>OprexDuit → Budgeting → Atur Limit</b>",
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

        lines = [f"💰 <b>Status Budget {today.strftime('%B %Y')}</b>\n"]
        for cat, limit in budgets.items():
            used = spending.get(cat, 0)
            pct = (used / limit * 100) if limit > 0 else 0
            bar = _progress_bar(pct)
            status = "🟢" if pct < 70 else ("🟡" if pct < 90 else "🔴")
            lines.append(
                f"{status} <b>{cat}</b>\n"
                f"   {bar} {pct:.0f}%\n"
                f"   {_fmt(used)} / {_fmt(limit)}"
            )

        send_message(chat_id, "\n\n".join(lines))

    except Exception as exc:
        send_message(chat_id, f"⚠️ Gagal mengambil data budget: {exc}")


def _cmd_bantuan(chat_id: int | str) -> None:
    send_message(
        chat_id,
        "<b>📱 OprexDuit Bot — Panduan</b>\n\n"
        "<b>Catat Transaksi (kirim teks langsung):</b>\n"
        "• <code>50rb makan siang</code>\n"
        "• <code>catat 25000 bensin</code>\n"
        "• <code>+2jt gaji bulan ini</code>\n\n"
        "<b>Format Jumlah:</b>\n"
        "• <code>50rb</code> = Rp50.000\n"
        "• <code>1.5jt</code> = Rp1.500.000\n"
        "• <code>500000</code> = Rp500.000\n"
        "• Awali <code>+</code> untuk pemasukan\n\n"
        "<b>Perintah:</b>\n"
        "/ringkasan — Ringkasan hari ini\n"
        "/laporan   — Laporan bulan ini\n"
        "/budget    — Cek status budget\n"
        "/link      — Kode hubungkan akun\n"
        "/bantuan   — Tampilkan panduan ini",
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
            f"📊 <b>Laporan Mingguan OprexDuit</b>\n"
            f"({week_start} — {today.isoformat()})\n\n"
            f"💰 Pemasukan : <b>{_fmt(total_income)}</b>\n"
            f"💸 Pengeluaran: <b>{_fmt(total_expense)}</b>\n"
            f"{'📈' if net >= 0 else '📉'} Net       : <b>{_fmt(net)}</b>\n"
            f"📝 Transaksi : {len(txs)}\n\n"
            f"Detail selengkapnya di <a href='https://oprexduit.vercel.app'>OprexDuit Web</a> 🌐",
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
                    emoji = "🔴" if pct >= 100 else "🟡"
                    alerts.append(
                        f"{emoji} <b>{cat}</b>: {pct:.0f}%"
                        f" ({_fmt(used)} / {_fmt(limit)})"
                    )

            if alerts:
                lines = ["⚠️ <b>Peringatan Budget Bulan Ini!</b>\n"]
                lines.extend(alerts)
                lines.append("\nYuk hemat di sisa bulan ini 💪")
                send_message(chat_id, "\n".join(lines))
                count += 1

        return count
    except Exception as exc:
        print(f"[telegram] budget_alerts error: {exc}")
        return 0
