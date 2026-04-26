"use client";

import {
  ArrowLeftRight,
  Clapperboard,
  HeartPulse,
  LineChart,
  ReceiptText,
  ShoppingBag,
  Sparkles,
  TramFront,
  UtensilsCrossed,
  Wallet,
  type LucideIcon,
} from "lucide-react";

/* ──────────────────────────────────────────
   CategoryBadge — icon + tinted pill per category
   ─────────────────────────────────────────── */

type CanonicalCategory =
  | "Makan"
  | "Transport"
  | "Belanja"
  | "Tagihan"
  | "Hiburan"
  | "Kesehatan"
  | "Transfer"
  | "Pendapatan"
  | "Investasi"
  | "Lainnya";

export interface CategoryMeta {
  key: CanonicalCategory;
  icon: LucideIcon;
  emoji: string;
  label: string;
  cssClass: string;   // matches .cat-* in globals.css
  hex: string;        // for inline styles when needed
}

const CANONICAL_MAP: Record<CanonicalCategory, CategoryMeta> = {
  Makan: {
    key: "Makan",
    icon: UtensilsCrossed,
    emoji: "🍽",
    label: "Makan",
    cssClass: "cat-food",
    hex: "#fb923c",
  },
  Transport: {
    key: "Transport",
    icon: TramFront,
    emoji: "🚕",
    label: "Transport",
    cssClass: "cat-transport",
    hex: "#38bdf8",
  },
  Belanja: {
    key: "Belanja",
    icon: ShoppingBag,
    emoji: "🛍",
    label: "Belanja",
    cssClass: "cat-shopping",
    hex: "#c084fc",
  },
  Tagihan: {
    key: "Tagihan",
    icon: ReceiptText,
    emoji: "🧾",
    label: "Tagihan",
    cssClass: "cat-bills",
    hex: "#2dd4bf",
  },
  Hiburan: {
    key: "Hiburan",
    icon: Clapperboard,
    emoji: "🎬",
    label: "Hiburan",
    cssClass: "cat-entertain",
    hex: "#f472b6",
  },
  Kesehatan: {
    key: "Kesehatan",
    icon: HeartPulse,
    emoji: "🏥",
    label: "Kesehatan",
    cssClass: "cat-health",
    hex: "#4ade80",
  },
  Transfer: {
    key: "Transfer",
    icon: ArrowLeftRight,
    emoji: "💸",
    label: "Transfer",
    cssClass: "cat-transfer",
    hex: "#94a3b8",
  },
  Pendapatan: {
    key: "Pendapatan",
    icon: Wallet,
    emoji: "💰",
    label: "Pendapatan",
    cssClass: "cat-income",
    hex: "#34d399",
  },
  Investasi: {
    key: "Investasi",
    icon: LineChart,
    emoji: "📈",
    label: "Investasi",
    cssClass: "cat-income",
    hex: "#34d399",
  },
  Lainnya: {
    key: "Lainnya",
    icon: Sparkles,
    emoji: "✨",
    label: "Lainnya",
    cssClass: "cat-other",
    hex: "#94a3b8",
  },
};

export const CATEGORY_MAP = CANONICAL_MAP;

const CATEGORY_ALIASES: Record<string, CanonicalCategory> = {
  makan: "Makan",
  "f&b": "Makan",
  kuliner: "Makan",
  "fast food": "Makan",
  "food delivery": "Makan",
  transport: "Transport",
  transportasi: "Transport",
  "transportasi umum": "Transport",
  bbm: "Transport",
  parkir: "Transport",
  tol: "Transport",
  belanja: "Belanja",
  shopping: "Belanja",
  minimarket: "Belanja",
  supermarket: "Belanja",
  "belanja online": "Belanja",
  pengiriman: "Belanja",
  tagihan: "Tagihan",
  utilitas: "Tagihan",
  listrik: "Tagihan",
  internet: "Tagihan",
  hiburan: "Hiburan",
  entertainment: "Hiburan",
  musik: "Hiburan",
  streaming: "Hiburan",
  gaming: "Hiburan",
  kesehatan: "Kesehatan",
  health: "Kesehatan",
  transfer: "Transfer",
  "transfer masuk": "Transfer",
  "transfer keluar": "Transfer",
  "transfer & biaya": "Transfer",
  pendapatan: "Pendapatan",
  income: "Pendapatan",
  "gaji & bonus": "Pendapatan",
  "refund & cashback": "Pendapatan",
  investasi: "Investasi",
  tabungan: "Investasi",
  lainnya: "Lainnya",
  other: "Lainnya",
};

const INFER_RULES: Array<{ re: RegExp; key: CanonicalCategory }> = [
  {
    re: /(makan|food|kuliner|resto|restoran|soto|seblak|solaria|fore|kopi|coffee|matcha|durian|minum|bakso|mie|ayam|snack|jajan)/i,
    key: "Makan",
  },
  {
    re: /(gojek|grab|bensin|bbm|parkir|tol|transport|oli|vario|motor|mobil|servis|bengkel)/i,
    key: "Transport",
  },
  {
    re: /(belanja|shopping|shopee|tokopedia|lazada|beli|barang|korek|laundry|indomaret|alfamart)/i,
    key: "Belanja",
  },
  {
    re: /(tagihan|pulsa|internet|wifi|listrik|air|cicilan|langganan|bpjs|asuransi)/i,
    key: "Tagihan",
  },
  {
    re: /(hiburan|film|nonton|game|gaming|spotify|netflix|fotobooth|rekreasi|travel)/i,
    key: "Hiburan",
  },
  {
    re: /(obat|halodoc|dokter|apotek|rs|klinik|medis|kesehatan)/i,
    key: "Kesehatan",
  },
  {
    re: /(transfer|\btf\b|trf|kirim|tarik|setor|dana|ovo|gopay|qris|jago|atm|admin fee|funds fee)/i,
    key: "Transfer",
  },
  {
    re: /(gaji|salary|bonus|pendapatan|income|refund|cashback|dibayar|terima)/i,
    key: "Pendapatan",
  },
  {
    re: /(investasi|saham|reksa|deposito|bibit|crypto|emas|tabungan)/i,
    key: "Investasi",
  },
];

function resolveCategoryKey(category: string, hint?: string): CanonicalCategory {
  const cat = (category ?? "").trim();
  const catLower = cat.toLowerCase();

  const canonical = Object.keys(CANONICAL_MAP).find((k) => k.toLowerCase() === catLower) as CanonicalCategory | undefined;
  if (canonical) return canonical;

  const alias = CATEGORY_ALIASES[catLower];
  if (alias) return alias;

  const combined = [catLower, (hint ?? "").toLowerCase()].join(" ").trim();
  for (const rule of INFER_RULES) {
    if (rule.re.test(combined)) return rule.key;
  }

  return "Lainnya";
}

function get(cat: string, hint?: string): CategoryMeta {
  const key = resolveCategoryKey(cat, hint);
  return CANONICAL_MAP[key];
}

interface Props {
  category: string;
  hint?: string;
  /** "pill" shows icon + label text; "icon" shows icon in a circle */
  variant?: "pill" | "icon";
  size?: "sm" | "md";
}

export function CategoryBadge({ category, hint, variant = "pill", size = "sm" }: Props) {
  const meta = get(category, hint);
  const Icon = meta.icon;

  if (variant === "icon") {
    const sz = size === "md" ? "h-9 w-9" : "h-8 w-8";
    const iconSz = size === "md" ? "h-[18px] w-[18px]" : "h-4 w-4";
    return (
      <span
        className={`inline-flex items-center justify-center rounded-xl ${sz} shrink-0`}
        style={{ background: `${meta.hex}18`, border: `1px solid ${meta.hex}28` }}
        title={meta.label}
      >
        <Icon className={iconSz} style={{ color: meta.hex }} />
      </span>
    );
  }

  const pad = size === "md" ? "px-2.5 py-1 text-xs" : "px-2 py-0.5 text-[10px]";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${pad}`}
      style={{ background: `${meta.hex}18`, color: meta.hex, border: `1px solid ${meta.hex}28` }}
    >
      <Icon className="h-3.5 w-3.5" />
      {meta.label}
    </span>
  );
}

/** Parse a raw category string into normalised meta (useful in other components) */
export function getCategoryMeta(cat: string, hint?: string): CategoryMeta {
  return get(cat, hint);
}
