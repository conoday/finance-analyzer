"use client";

/* ──────────────────────────────────────────
   CategoryBadge — icon + tinted pill per category
   ─────────────────────────────────────────── */

export interface CategoryMeta {
  emoji: string;
  label: string;
  cssClass: string;   // matches .cat-* in globals.css
  hex: string;        // for inline styles when needed
}

export const CATEGORY_MAP: Record<string, CategoryMeta> = {
  Makan:        { emoji: "🍔", label: "Makan",       cssClass: "cat-food",      hex: "#fb923c" },
  "F&B":        { emoji: "🍔", label: "F&B",         cssClass: "cat-food",      hex: "#fb923c" },
  Transport:    { emoji: "🚗", label: "Transport",   cssClass: "cat-transport", hex: "#38bdf8" },
  Transportasi: { emoji: "🚗", label: "Transportasi",cssClass: "cat-transport", hex: "#38bdf8" },
  Belanja:      { emoji: "🛒", label: "Belanja",     cssClass: "cat-shopping",  hex: "#c084fc" },
  Shopping:     { emoji: "🛒", label: "Shopping",    cssClass: "cat-shopping",  hex: "#c084fc" },
  Tagihan:      { emoji: "📱", label: "Tagihan",     cssClass: "cat-bills",     hex: "#2dd4bf" },
  Utilitas:     { emoji: "📱", label: "Utilitas",    cssClass: "cat-bills",     hex: "#2dd4bf" },
  Hiburan:      { emoji: "🎮", label: "Hiburan",     cssClass: "cat-entertain", hex: "#f472b6" },
  Entertainment:{ emoji: "🎮", label: "Entertainment",cssClass:"cat-entertain", hex: "#f472b6" },
  Kesehatan:    { emoji: "💊", label: "Kesehatan",   cssClass: "cat-health",    hex: "#4ade80" },
  Health:       { emoji: "💊", label: "Health",      cssClass: "cat-health",    hex: "#4ade80" },
  Transfer:     { emoji: "💸", label: "Transfer",    cssClass: "cat-transfer",  hex: "#94a3b8" },
  Pendapatan:   { emoji: "💰", label: "Pendapatan",  cssClass: "cat-income",    hex: "#34d399" },
  Income:       { emoji: "💰", label: "Income",      cssClass: "cat-income",    hex: "#34d399" },
  Investasi:    { emoji: "📈", label: "Investasi",   cssClass: "cat-income",    hex: "#34d399" },
  Lainnya:      { emoji: "⚡", label: "Lainnya",     cssClass: "cat-other",     hex: "#94a3b8" },
  Other:        { emoji: "⚡", label: "Other",       cssClass: "cat-other",     hex: "#94a3b8" },
};

function get(cat: string): CategoryMeta {
  return (
    CATEGORY_MAP[cat] ??
    Object.values(CATEGORY_MAP).find(
      (v) => v.label.toLowerCase() === cat.toLowerCase()
    ) ?? CATEGORY_MAP["Lainnya"]
  );
}

interface Props {
  category: string;
  /** "pill" shows emoji + label text; "icon" shows just the emoji in a circle */
  variant?: "pill" | "icon";
  size?: "sm" | "md";
}

export function CategoryBadge({ category, variant = "pill", size = "sm" }: Props) {
  const meta = get(category);

  if (variant === "icon") {
    const sz = size === "md" ? "w-9 h-9 text-lg" : "w-7 h-7 text-sm";
    return (
      <span
        className={`inline-flex items-center justify-center rounded-xl ${sz} shrink-0`}
        style={{ background: `${meta.hex}18`, border: `1px solid ${meta.hex}28` }}
        title={meta.label}
      >
        {meta.emoji}
      </span>
    );
  }

  const pad = size === "md" ? "px-2.5 py-1 text-xs" : "px-2 py-0.5 text-[10px]";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${pad}`}
      style={{ background: `${meta.hex}18`, color: meta.hex, border: `1px solid ${meta.hex}28` }}
    >
      <span>{meta.emoji}</span>
      {meta.label}
    </span>
  );
}

/** Parse a raw category string into normalised meta (useful in other components) */
export function getCategoryMeta(cat: string): CategoryMeta {
  return get(cat);
}
