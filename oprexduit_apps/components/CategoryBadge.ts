// Shared category utilities for consistent colors and emojis across all screens

interface CategoryMeta {
  color: string;
  emoji: string;
}

const CATEGORY_MAP: Record<string, CategoryMeta> = {
  Makan:        { color: "#fb923c", emoji: "🍔" },
  "F&B":        { color: "#fb923c", emoji: "🍔" },
  Transport:    { color: "#38bdf8", emoji: "🚗" },
  Transportasi: { color: "#38bdf8", emoji: "🚗" },
  Belanja:      { color: "#c084fc", emoji: "🛒" },
  Shopping:     { color: "#c084fc", emoji: "🛒" },
  Tagihan:      { color: "#2dd4bf", emoji: "📱" },
  Utilitas:     { color: "#2dd4bf", emoji: "📱" },
  Hiburan:      { color: "#f472b6", emoji: "🎮" },
  Entertainment:{ color: "#f472b6", emoji: "🎮" },
  Kesehatan:    { color: "#4ade80", emoji: "💊" },
  Health:       { color: "#4ade80", emoji: "💊" },
  Transfer:     { color: "#94a3b8", emoji: "💸" },
  Pendapatan:   { color: "#34d399", emoji: "💰" },
  Income:       { color: "#34d399", emoji: "💰" },
  Investasi:    { color: "#34d399", emoji: "📈" },
  Lainnya:      { color: "#94a3b8", emoji: "⚡" },
  Other:        { color: "#94a3b8", emoji: "⚡" },
};

function resolveCategory(raw: string): CategoryMeta {
  if (!raw) return CATEGORY_MAP["Lainnya"];
  if (CATEGORY_MAP[raw]) return CATEGORY_MAP[raw];
  
  // Fuzzy/substring matching
  const low = raw.toLowerCase();
  if (low.includes("makan") || low.includes("food") || low.includes("minum") || low.includes("snack")) return CATEGORY_MAP["Makan"];
  if (low.includes("pulsa") || low.includes("internet") || low.includes("tagihan") || low.includes("listrik")) return CATEGORY_MAP["Tagihan"];
  if (low.includes("gojek") || low.includes("grab") || low.includes("bensin") || low.includes("parkir")) return CATEGORY_MAP["Transport"];
  if (low.includes("belanja") || low.includes("shopee") || low.includes("tokopedia")) return CATEGORY_MAP["Belanja"];
  if (low.includes("amal") || low.includes("donasi") || low.includes("sedekah")) return { color: "#14b8a6", emoji: "🤝" };
  if (low.includes("obat") || low.includes("dokter") || low.includes("apotek")) return CATEGORY_MAP["Kesehatan"];
  if (low.includes("gaji") || low.includes("salary") || low.includes("bonus")) return CATEGORY_MAP["Pendapatan"];

  return CATEGORY_MAP["Lainnya"];
}

export function getCategoryColor(raw: string): string {
  return resolveCategory(raw).color;
}

export function getCategoryEmoji(raw: string): string {
  return resolveCategory(raw).emoji;
}
