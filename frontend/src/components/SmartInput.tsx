"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, ChevronDown, Check, Hash, Calendar, CreditCard } from "lucide-react";
import { getCategoryMeta, CATEGORY_MAP } from "@/components/CategoryBadge";
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

/* ─── Payment methods ─── */
const METHODS = ["Cash", "GoPay", "OVO", "Dana", "BCA", "Mandiri", "BRI", "BNI", "QRIS", "Lainnya"];

/* ─── Category suggestions ─── */
const CATEGORY_LIST = Object.keys(CATEGORY_MAP).filter(
  (k) => !["F&B", "Shopping", "Health", "Entertainment", "Income", "Other"].includes(k)
);

/* ─── SmartInput Component ─── */
interface SmartInputProps {
  onClose: () => void;
  onSaved?: (tx: QuickTransaction) => void;
}

export function SmartInput({ onClose, onSaved }: SmartInputProps) {
  const [raw, setRaw] = useState("");
  const [parsed, setParsed] = useState<Partial<QuickTransaction>>({});
  const [method, setMethod] = useState("Cash");
  const [showAdvanced, setShowAdvanced] = useState(false);
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center smart-input-overlay px-4 pb-6 sm:pb-0"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 380, damping: 30 }}
        className="w-full max-w-lg rounded-2xl p-5 space-y-4"
        style={{ background: "#080f1c", border: "1px solid rgba(20,184,166,0.20)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-teal-400" />
            <span className="text-sm font-semibold text-slate-200">Catat Cepat</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Main input */}
        <div className="smart-input-box rounded-xl px-4 py-3.5">
          <input
            ref={inputRef}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            onKeyDown={onKey}
            placeholder='Ngopi 25rb  ·  Gaji 5jt  ·  Bensin 100rb'
            className="w-full bg-transparent text-lg text-slate-100 placeholder-slate-600 outline-none"
          />
        </div>

        {/* Live parse preview */}
        <AnimatePresence>
          {hasAmount && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 flex-wrap"
            >
              {/* Emoji + category chip */}
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium"
                style={{ background: `${meta.hex}18`, color: meta.hex, border: `1px solid ${meta.hex}28` }}
              >
                {meta.emoji} {effectiveCategory}
              </span>

              {/* Amount chip */}
              <span
                className="inline-flex items-center rounded-full px-3 py-1.5 text-sm font-bold font-mono"
                style={{
                  background: parsed.isIncome ? "rgba(16,185,129,0.14)" : "rgba(244,63,94,0.12)",
                  color: parsed.isIncome ? "#34d399" : "#fb7185",
                  border: `1px solid ${parsed.isIncome ? "rgba(16,185,129,0.24)" : "rgba(244,63,94,0.22)"}`,
                }}
              >
                {parsed.isIncome ? "+" : "-"}
                {formatRupiah(parsed.amount ?? 0, true)}
              </span>

              {/* Method chip */}
              <span className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs text-slate-400"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <CreditCard className="w-3 h-3" /> {method}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Method pills */}
        <div>
          <p className="text-[10px] text-slate-600 mb-2 uppercase tracking-wider">Metode Bayar</p>
          <div className="flex gap-1.5 flex-wrap">
            {METHODS.map((m) => (
              <button
                key={m}
                onClick={() => setMethod(m)}
                className="px-2.5 py-1 rounded-lg text-xs transition-all"
                style={
                  method === m
                    ? { background: "rgba(20,184,166,0.18)", color: "#2dd4bf", border: "1px solid rgba(20,184,166,0.30)" }
                    : { background: "rgba(255,255,255,0.04)", color: "#64748b", border: "1px solid rgba(255,255,255,0.06)" }
                }
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Advanced toggle */}
        <button
          onClick={() => setShowAdvanced((p) => !p)}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? "rotate-180" : ""}`}
          />
          Advanced
        </button>

        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 overflow-hidden"
            >
              {/* Category override */}
              <div>
                <p className="text-[10px] text-slate-600 mb-2 uppercase tracking-wider flex items-center gap-1">
                  <Hash className="w-3 h-3" /> Kategori
                </p>
                <div className="flex gap-1.5 flex-wrap">
                  {CATEGORY_LIST.map((cat) => {
                    const m = getCategoryMeta(cat);
                    return (
                      <button
                        key={cat}
                        onClick={() => setManualCategory(cat)}
                        className="px-2.5 py-1 rounded-lg text-xs transition-all"
                        style={
                          effectiveCategory === cat
                            ? { background: `${m.hex}22`, color: m.hex, border: `1px solid ${m.hex}35` }
                            : { background: "rgba(255,255,255,0.04)", color: "#64748b", border: "1px solid rgba(255,255,255,0.06)" }
                        }
                      >
                        {m.emoji} {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Date */}
              <div>
                <p className="text-[10px] text-slate-600 mb-2 uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Tanggal
                </p>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="rounded-lg px-3 py-2 text-xs text-slate-300 outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Save button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          disabled={!hasAmount || saved}
          className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-40"
          style={
            saved
              ? { background: "rgba(16,185,129,0.25)", color: "#34d399", border: "1px solid rgba(16,185,129,0.30)" }
              : { background: "rgba(20,184,166,0.20)", color: "#2dd4bf", border: "1px solid rgba(20,184,166,0.30)" }
          }
        >
          {saved ? (
            <><Check className="w-4 h-4" /> Tersimpan!</>
          ) : (
            <><Zap className="w-4 h-4" /> Simpan Transaksi</>
          )}
        </motion.button>

        <p className="text-center text-[10px] text-slate-700">
          Enter untuk simpan · Esc untuk tutup · Disimpan lokal di browser
        </p>
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
