"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Zap, Check } from "lucide-react";
import { Icon } from "@iconify/react";
import { getCategoryMeta } from "@/components/CategoryBadge";
import { formatRupiah } from "@/lib/utils";

/* ─── Types ─── */
export interface QuickTransaction {
  id: string;
  desc: string;
  amount: number;
  category: string;
  emoji: string;
  method: string;
  date: string;
  isIncome: boolean;
  raw: string;
}

/* ─── Parse "Ngopi 25rb" → structured ─── */
function parseInput(raw: string): Partial<QuickTransaction> {
  const text = raw.trim();

  // Amount extraction: 25rb, 25k, 25.000, 25,000, 25jt, 25m, 1.5jt
  const amountRe = /([\d.,]+)\s*(rb|k|ribu|jt|juta|m\b)?/i;
  const amountMatch = text.match(amountRe);
  let amount = 0;
  if (amountMatch) {
    amount = parseFloat(amountMatch[1].replace(/,/g, ".").replace(/\.(?=.*\.)/g, ""));
    const unit = amountMatch[2]?.toLowerCase();
    if (unit === "rb" || unit === "k" || unit === "ribu") amount *= 1_000;
    if (unit === "jt" || unit === "juta") amount *= 1_000_000;
    if (unit === "m") amount *= 1_000_000;
  }

  // Category detection
  const lo = text.toLowerCase();
  let category = "Lainnya";

  const rules: [RegExp, string][] = [
    [/(kopi|makan|nasi|bakso|mie|boba|sate|burger|pizza|warung|go.?food|grab.?food|mcd|kfc|sarapan|minum|resto|cafe|dinner|lunch|snack|jajan)/i, "Makan"],
    [/(gojek|grab|ojek|bensin|parkir|tol|bus|mrt|krl|taxi|ngisi|bbm|pertalite|pertamax|motor|kereta|tiket|pesawat)/i, "Transport"],
    [/(shopee|tokopedia|lazada|blibli|beli|baju|celana|sepatu|tas|barang|elektronik|laptop|hp|gadget)/i, "Belanja"],
    [/(listrik|pln|tagihan|pdam|air|internet|telkom|indihome|cicilan|cicil|kpr|wifi|langganan|paket)/i, "Tagihan"],
    [/(netflix|spotify|nonton|bioskop|film|game|main|disney|youtube|hbo|prime)/i, "Hiburan"],
    [/(dokter|obat|apotek|rs |rumah sakit|bpjs|vitamin|klinik|check.?up|faskes)/i, "Kesehatan"],
    [/(transfer|kirim|bca|mandiri|bri|bni|gopay|ovo|dana|qris|bayar|tagih|setor)/i, "Transfer"],
    [/(gaji|salary|bonus|thr|freelance|client|invoice|upah|proyek|dapat|masuk|terima)/i, "Pendapatan"],
  ];

  for (const [re, cat] of rules) {
    if (re.test(lo)) { category = cat; break; }
  }

  const meta = getCategoryMeta(category);

  // Description: remove amount token
  const desc = text
    .replace(/([\d.,]+\s*(rb|k|ribu|jt|juta|m\b)?)/gi, "")
    .replace(/\s+/g, " ")
    .trim() || text;

  return {
    desc: desc.slice(0, 60),
    amount,
    category,
    emoji: meta.emoji,
    isIncome: category === "Pendapatan",
  };
}

/* ─── Local storage helpers ─── */
const LS_KEY = "fa_quick_transactions";

function loadLocal(): QuickTransaction[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]");
  } catch { return []; }
}

function saveLocal(txs: QuickTransaction[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(txs.slice(0, 200)));
}

/* ─── Payment methods with brand icon + color ─── */
const METHODS: { label: string; icon: string; color: string }[] = [
  { label: "Cash",    icon: "lucide:banknote",            color: "#4ade80" },
  { label: "GoPay",   icon: "simple-icons:gojek",         color: "#00ADB4" },
  { label: "OVO",     icon: "simple-icons:ovo",           color: "#8B5CF6" },
  { label: "Dana",    icon: "simple-icons:dana",          color: "#108EE9" },
  { label: "BCA",     icon: "simple-icons:bca",           color: "#005BAC" },
  { label: "Mandiri", icon: "simple-icons:bankmandiri",   color: "#F59E0B" },
  { label: "BRI",     icon: "simple-icons:bankbri",       color: "#00529C" },
  { label: "BNI",     icon: "simple-icons:bankbni",       color: "#E65100" },
  { label: "QRIS",    icon: "simple-icons:qris",          color: "#EB001B" },
  { label: "Lainnya", icon: "lucide:credit-card",         color: "#94a3b8" },
];

/* ─── Canonical category list (no duplicates) ─── */
const CATEGORY_LIST = [
  "Makan", "Transport", "Belanja", "Tagihan",
  "Hiburan", "Kesehatan", "Transfer", "Pendapatan", "Investasi", "Lainnya",
];

/* ─── SmartInput Component ─── */
interface SmartInputProps {
  onClose: () => void;
  onSaved?: (tx: QuickTransaction) => void;
}

export function SmartInput({ onClose, onSaved }: SmartInputProps) {
  const [raw, setRaw] = useState("");
  const [parsed, setParsed] = useState<Partial<QuickTransaction>>({});
  const [method, setMethod] = useState("Cash");
  const [manualCategory, setManualCategory] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [saved, setSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Re-parse on every keystroke
  useEffect(() => {
    if (raw.trim().length > 0) {
      const p = parseInput(raw);
      setParsed(p);
      if (!manualCategory) setManualCategory(p.category ?? "Lainnya");
    } else {
      setParsed({});
    }
  }, [raw]);

  const effectiveCategory = manualCategory || parsed.category || "Lainnya";
  const meta = getCategoryMeta(effectiveCategory);

  const handleSave = useCallback(() => {
    if (!parsed.amount || parsed.amount <= 0) return;
    const tx: QuickTransaction = {
      id: Date.now().toString(),
      desc: parsed.desc ?? raw,
      amount: parsed.amount,
      category: effectiveCategory,
      emoji: meta.emoji,
      method,
      date,
      isIncome: effectiveCategory === "Pendapatan",
      raw,
    };
    const existing = loadLocal();
    saveLocal([tx, ...existing]);
    onSaved?.(tx);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setRaw("");
      setParsed({});
      setManualCategory("");
      inputRef.current?.focus();
    }, 900);
  }, [parsed, raw, effectiveCategory, meta, method, date, onSaved]);

  // Enter to save
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") onClose();
  };

  const hasAmount = (parsed.amount ?? 0) > 0;

  return (
    <motion.div
      key="smart-input-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        transition={{ duration: 0.18 }}
        className="w-full max-w-md rounded-xl overflow-hidden"
        style={{ background: "#111827", border: "1px solid #1f2937" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
            <Zap className="w-3.5 h-3.5 text-teal-400" />
            Catat Cepat
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Description + amount row */}
          <div className="space-y-1">
            <label className="text-xs text-slate-500">Keterangan</label>
            <input
              ref={inputRef}
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              onKeyDown={onKey}
              placeholder="Ngopi 25rb  ·  Gaji 5jt  ·  Bensin 100rb"
              className="w-full rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none transition-colors"
              style={{ background: "#1f2937", border: "1px solid #374151" }}
            />
          </div>

          {/* Amount preview */}
          <AnimatePresence>
            {hasAmount && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div
                  className="flex items-center justify-between rounded-lg px-3 py-2.5"
                  style={{ background: "#1f2937", border: "1px solid #374151" }}
                >
                  <span className="text-xs text-slate-500">Nominal terdeteksi</span>
                  <span
                    className="text-sm font-bold font-mono"
                    style={{ color: parsed.isIncome ? "#34d399" : "#fb7185" }}
                  >
                    {parsed.isIncome ? "+" : "−"}{formatRupiah(parsed.amount ?? 0, true)}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Category + Date row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-500">Kategori</label>
              <select
                value={effectiveCategory}
                onChange={(e) => setManualCategory(e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 text-sm text-slate-200 outline-none appearance-none cursor-pointer"
                style={{ background: "#1f2937", border: "1px solid #374151" }}
              >
                {CATEGORY_LIST.map((cat) => {
                  const m = getCategoryMeta(cat);
                  return (
                    <option key={cat} value={cat}>
                      {m.emoji} {cat}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-500">Tanggal</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 text-sm text-slate-200 outline-none cursor-pointer"
                style={{ background: "#1f2937", border: "1px solid #374151" }}
              />
            </div>
          </div>

          {/* Payment method */}
          <div className="space-y-2">
            <label className="text-xs text-slate-500">Metode Bayar</label>
            <div className="flex flex-wrap gap-1.5">
              {METHODS.map((m) => {
                const active = method === m.label;
                return (
                  <button
                    key={m.label}
                    onClick={() => setMethod(m.label)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    style={
                      active
                        ? { background: `${m.color}22`, color: m.color, border: `1px solid ${m.color}55` }
                        : { background: "#1f2937", color: "#6b7280", border: "1px solid #374151" }
                    }
                  >
                    <Icon
                      icon={m.icon}
                      className="w-3.5 h-3.5 shrink-0"
                      style={{ color: active ? m.color : "#6b7280" }}
                    />
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={!hasAmount || saved}
            className="w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-40"
            style={
              saved
                ? { background: "#065f46", color: "#34d399", border: "1px solid #047857" }
                : { background: "#0f766e", color: "#ccfbf1", border: "1px solid #0d9488" }
            }
          >
            {saved ? (
              <><Check className="w-4 h-4" /> Tersimpan!</>
            ) : (
              <><Zap className="w-4 h-4" /> Simpan Transaksi</>
            )}
          </button>

          <p className="text-center text-[10px] text-slate-700">
            Enter untuk simpan · Esc untuk tutup · Disimpan lokal di browser
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Hook to access local quick transactions ─── */
export function useQuickTransactions() {
  const [txs, setTxs] = useState<QuickTransaction[]>([]);

  useEffect(() => {
    setTxs(loadLocal());
  }, []);

  const refresh = useCallback(() => setTxs(loadLocal()), []);
  const clear = useCallback(() => { localStorage.removeItem(LS_KEY); setTxs([]); }, []);

  return { txs, refresh, clear };
}
