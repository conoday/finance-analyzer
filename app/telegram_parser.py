"""app/telegram_parser.py — Natural language transaction parser for Telegram bot.

Parses Indonesian-language input such as:
  "50rb makan siang"         -> expense 50,000 "Makan Siang"
  "catat 25000 bensin"       -> expense 25,000 "Bensin"
  "+2jt gaji bulan ini"      -> income  2,000,000 "Gaji Bulan Ini"
  "terima 500rb freelance"   -> income  500,000 "Freelance"
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Optional


# ---------------------------------------------------------------------------
# Data class
# ---------------------------------------------------------------------------

@dataclass
class ParsedTx:
    amount: float
    type: str          # "income" | "expense"
    description: str
    category_hint: Optional[str]


# ---------------------------------------------------------------------------
# Amount parser  (50rb, 1.5jt, 500000, 500k)
# ---------------------------------------------------------------------------

_MULTIPLIERS = {
    "rb":   1_000,
    "ribu": 1_000,
    "k":    1_000,
    "jt":   1_000_000,
    "juta": 1_000_000,
    "m":    1_000_000,
}


def parse_amount(token: str) -> Optional[float]:
    """Parse a single token as an Indonesian currency amount. Returns None if unparseable."""
    t = token.lower().strip()
    # Remove thousand-separator dots (e.g. "1.500.000" -> "1500000")
    t = re.sub(r"\.(?=\d{3})", "", t)

    for suffix, mult in _MULTIPLIERS.items():
        if t.endswith(suffix):
            num_part = t[: -len(suffix)].strip().replace(",", ".")
            try:
                return float(num_part) * mult
            except ValueError:
                return None

    try:
        return float(t.replace(",", "."))
    except ValueError:
        return None


# ---------------------------------------------------------------------------
# Category keywords
# ---------------------------------------------------------------------------

_CATEGORY_KEYWORDS: dict[str, list[str]] = {
    "Kuliner":         ["makan", "minum", "kopi", "cafe", "resto", "warung", "nasi",
                        "bakso", "ayam", "sate", "pizza", "burger", "jajan", "lunch",
                        "dinner", "sarapan", "snack", "ngopi", "boba", "es", "minuman"],
    "Transportasi":    ["grab", "gojek", "ojek", "bensin", "parkir", "tol", "bus",
                        "mrt", "commuter", "kereta", "taxi", "uber", "angkot", "bbm",
                        "pertalite", "pertamax", "motor", "mobil"],
    "Belanja":         ["belanja", "supermarket", "indomaret", "alfamart", "shopee",
                        "tokopedia", "lazada", "tiktok shop", "beli", "borong"],
    "Tagihan":         ["listrik", "pln", "air", "pdam", "internet", "wifi",
                        "indihome", "telkom", "tagihan", "iuran"],
    "Pulsa & Data":    ["pulsa", "paket data", "xl", "telkomsel", "indosat", "tri",
                        "smartfren", "by.u"],
    "Hiburan":         ["netflix", "spotify", "youtube", "game", "bioskop",
                        "hiburan", "nonton", "film", "disney", "vidio"],
    "Kesehatan":       ["obat", "dokter", "apotek", "rs", "rumah sakit", "klinik",
                        "vitamin", "kesehatan", "bpjs", "prodia"],
    "Pendidikan":      ["sekolah", "kursus", "buku", "spp", "les", "kuliah",
                        "pendidikan", "kelas", "workshop", "seminar"],
    "E-Wallet Top Up": ["gopay", "ovo", "dana", "shopeepay", "linkaja", "top up",
                        "topup", "isi saldo"],
    "Gaji & Bonus":    ["gaji", "salary", "bonus", "thr", "payroll", "slip"],
    "Freelance":       ["freelance", "honor", "honorarium", "fee", "proyek",
                        "project", "jasa", "komisi"],
    "Transfer":        ["transfer", "kirim", "tf"],
    "Investasi":       ["investasi", "reksa dana", "saham", "kripto", "bitcoin",
                        "deposito", "tabungan berjangka"],
    "Amal & Donasi":   ["amal", "donasi", "sedekah", "zakat", "infaq", "sumbangan", "zIS", "panti"],
}

_INCOME_HINTS = {
    "gaji", "salary", "bonus", "thr", "payroll", "freelance", "honor",
    "honorarium", "fee", "proyek", "project", "jasa", "komisi", "terima",
    "dapat", "pemasukan", "pendapatan", "dividen", "hasil", "untung",
    "cashback", "refund", "kembalian",
}


def _guess_category(description: str) -> Optional[str]:
    dl = description.lower()
    for category, keywords in _CATEGORY_KEYWORDS.items():
        if any(kw in dl for kw in keywords):
            return category
    return None


# ---------------------------------------------------------------------------
# Main parser
# ---------------------------------------------------------------------------

_CMD_PREFIXES = {"catat", "tambah", "input", "add", "record", "masukin"}


def parse_transaction(text: str) -> Optional[ParsedTx]:
    """
    Parse free-form Indonesian text into a ParsedTx.
    Returns None if no amount can be found.
    """
    text = text.strip()

    # Strip command prefix (e.g. "catat 50rb makan" -> "50rb makan")
    tokens = text.split()
    if tokens and tokens[0].lower() in _CMD_PREFIXES:
        tokens = tokens[1:]
    if not tokens:
        return None

    # Explicit sign prefix
    tx_type: Optional[str] = None
    if tokens[0].startswith("+"):
        tx_type = "income"
        tokens[0] = tokens[0][1:]
        if not tokens[0]:
            tokens = tokens[1:]
    elif tokens[0].startswith("-"):
        tx_type = "expense"
        tokens[0] = tokens[0][1:]
        if not tokens[0]:
            tokens = tokens[1:]

    # Find first token that parses as an amount
    amount: Optional[float] = None
    amount_idx: int = -1
    amount_ends_idx: int = -1

    for i, tok in enumerate(tokens):
        combined_tok = tok
        lookahead = 0
        if i + 1 < len(tokens):
            next_t = tokens[i+1].lower()
            if next_t in _MULTIPLIERS:
                combined_tok = tok + next_t
                lookahead = 1

        amt = parse_amount(combined_tok)
        if amt is not None and amt > 0:
            amount = amt
            amount_idx = i
            amount_ends_idx = i + lookahead
            break

        amt = parse_amount(tok)
        if amt is not None and amt > 0:
            amount = amt
            amount_idx = i
            amount_ends_idx = i
            break

    if amount is None:
        return None

    desc_tokens = [t for i, t in enumerate(tokens) if i < amount_idx or i > amount_ends_idx]
    description = " ".join(desc_tokens).strip().title() or "Transaksi"

    # Infer type from description if not set by sign
    if tx_type is None:
        dl = description.lower()
        tx_type = "income" if any(h in dl for h in _INCOME_HINTS) else "expense"

    category_hint = _guess_category(description)

    return ParsedTx(
        amount=amount,
        type=tx_type,
        description=description,
        category_hint=category_hint,
    )
