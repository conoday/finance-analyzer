import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format number as Indonesian Rupiah */
export function formatRupiah(amount: number, compact = false): string {
  if (compact) {
    if (Math.abs(amount) >= 1_000_000_000) {
      return `Rp ${(amount / 1_000_000_000).toFixed(1)}M`;
    }
    if (Math.abs(amount) >= 1_000_000) {
      return `Rp ${(amount / 1_000_000).toFixed(1)}jt`;
    }
    if (Math.abs(amount) >= 1_000) {
      return `Rp ${(amount / 1_000).toFixed(0)}rb`;
    }
  }
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** percent string */
export function pct(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/** Normalize camelCase / snake_case to Title Case label */
export function toLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/** Grade -> Tailwind color class */
export function gradeColor(grade: string): string {
  const map: Record<string, string> = {
    "A+": "text-emerald-400",
    A: "text-emerald-400",
    "A-": "text-green-400",
    "B+": "text-cyan-400",
    B: "text-cyan-400",
    "B-": "text-blue-400",
    "C+": "text-yellow-400",
    C: "text-yellow-400",
    "C-": "text-orange-400",
    D: "text-red-400",
    F: "text-red-600",
  };
  return map[grade] ?? "text-slate-400";
}

/** Mood emoji from monthly story */
export const MOOD_EMOJI: Record<string, string> = {
  great: "🌟",
  good: "😊",
  neutral: "😐",
  warning: "⚠️",
  bad: "😟",
  critical: "🚨",
};

const CATEGORY_COLORS: Record<string, string> = {
  Makanan: "#f97316",
  Transportasi: "#3b82f6",
  Belanja: "#a855f7",
  Hiburan: "#ec4899",
  Kesehatan: "#22c55e",
  Pendidikan: "#eab308",
  Tagihan: "#14b8a6",
  Tabungan: "#6366f1",
  Investasi: "#0ea5e9",
  Transfer: "#64748b",
  Lainnya: "#94a3b8",
};

export function categoryColor(name: string): string {
  return CATEGORY_COLORS[name] ?? "#8b5cf6";
}
