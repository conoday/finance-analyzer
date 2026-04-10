"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Zap, Check } from "lucide-react";
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

/* ─── Parse "Ngopi 25rb" / "50 rebu" / "2 miliar" → structured ─── */

/** Parse number string: "50.000"→50000, "1,5"→1.5, "50,000"→50000 */
function parseNumStr(s: string): number {
  if (/^\d{1,3}(\.\d{3})+$/.test(s)) return parseInt(s.replace(/\./g, ""), 10);
  if (/^\d{1,3}(,\d{3})+$/.test(s))  return parseInt(s.replace(/,/g, ""), 10);
  return parseFloat(s.replace(/,/g, ".")) || 0;
}

/**
 * Robust IDR parser:
 * 50rb | 50 ribu | 50 rebu | 50rbu | 50k
 * 1.5jt | 2 juta | 500jt
 * 1 miliar | 2.5 milyar
 * 3 triliun | 1.2 trilyun
 * 50.000 | 50,000 | 1.234.567
 */
function parseIDR(raw: string): number {
  const lo = raw.toLowerCase();
  const m = lo.match(/(\d[\d.,]*)\s*(triliun|trilyun|miliar|milyar|juta|jt|ribu|rebu|rbu|rb|k)\b/);
  if (m) {
    const num = parseNumStr(m[1]);
    const u   = m[2];
    if (["triliun", "trilyun"].includes(u)) return Math.round(num * 1e12);
    if (["miliar",  "milyar" ].includes(u)) return Math.round(num * 1e9);
    if (["juta",    "jt"     ].includes(u)) return Math.round(num * 1e6);
    /* ribu | rebu | rbu | rb | k */         return Math.round(num * 1e3);
  }
  const plain = lo.match(/(\d[\d.,]*)/);
  if (!plain) return 0;
  return parseNumStr(plain[1]);
}

function parseInput(raw: string): Partial<QuickTransaction> {
  const text = raw.trim();
  const lo   = text.toLowerCase();
  const amount = parseIDR(text);

  /**
   * Brand + keyword → category. Order matters (first match wins).
   * Brands are listed explicitly so user can just type the brand name.
   */
  let category = "Lainnya";
  const rules: [RegExp, string][] = [
    // ── Makan & Minum
    [/(starbucks|sbux|kopi.?kenangan|kenangan|chatime|gong.?cha|javis|excelso|j\.?co\b|upnormal|gobar|ngopi|kopi\b|makan|nasi|bakso|mie\b|boba|sate\b|burger|geprek|pizza|warung|gofood|grabfood|shopeefood|go.?food|grab.?food|mcd\b|mcdo|mcdonald|kfc\b|dunkin|sarapan|minum\b|minuman|resto\b|restoran|cafe\b|kafe|dinner|lunch|snack|jajan|nongkrong|kopdar|ayam\b|seafood|sushi|ramen|martabak|gorengan|indomie|warteg|kantin|pecel|padang|es\s)/i, "Makan"],
    // ── Transport (specific combo first so "grabfood" doesn't land here)
    [/(grab.?(car|motor|bike|express|taxi)|kendaraan|gojek\b|ojek\b|ojol|bensin|pertalite|pertamax|dexlite|revvo|ngisi\b|bbm\b|parkir|tol\b|busway|transjakarta|commuter|commuterline|krl\b|mrt\b|lrt\b|kereta|damri|tiket\s|pesawat|blue.?bird|maxim|indriver)/i, "Transport"],
    // ── Belanja (e-commerce + retail)
    [/(shopee|tokopedia|lazada|blibli|bukalapak|tiktok.?shop|jd\.id|berrybenka|zalora|sociolla|indomaret|alfamart|alfamidi|lawson|circle.?k|familymart|minimarket|supermarket|hypermart|carrefour|transmart|lottemart|beli\b|baju|celana|sepatu|tas\b|barang|elektronik|laptop|hp\b|gadget|fashion|outfit)/i, "Belanja"],
    // ── Tagihan / Utilitas
    [/(listrik|pln\b|tagihan|pdam|air\s|internet|telkom|indihome|myindihome|cicilan|cicil|angsuran|kpr\b|kredit\b|wifi|langganan|paket.?data|pulsa|mytelkomsel|myxl|tri\b|axis\b|by\.u|smartfren)/i, "Tagihan"],
    // ── Hiburan
    [/(netflix|spotify|youtube.?premium|disney|hbo|prime\b|viu|vidio|mola|genflix|catchplay|bioskop|cinema|nonton|film\b|game\b|gaming|steam|valorant|mobile.?legend|pubg|genshin)/i, "Hiburan"],
    // ── Kesehatan
    [/(dokter|obat\b|apotek|rs\b|rumah.?sakit|bpjs|vitamin|klinik|halodoc|alodokter|kimia.?farma|guardian|century|check.?up|faskes|medis|laborat)/i, "Kesehatan"],
    // ── Transfer (e-wallet/bank used as verb "kirim/setor/tarik")
    [/(transfer|kirim\b|setor|tarik\b|flip\b|jenius|jago\b|seabank|gopay|ovo\b|dana\b|qris\b|bca\b|mandiri|bri\b|bni\b)/i, "Transfer"],
    // ── Pendapatan
    [/(gaji|salary|bonus|thr\b|freelance|client|invoice|upah|proyek|dapat\b|masuk\b|terima\b|dibayar|fee\b|komisi|revenue|profit)/i, "Pendapatan"],
    // ── Investasi
    [/(saham|investasi|reksadana|reksa|crypto|bitcoin|eth\b|tabungan|deposito|bibit\b|bareksa|ajaib\b|pluang|indodax|tokocrypto|pintu\b)/i, "Investasi"],
    // ── Grab generic fallback
    [/(grab\b)/i, "Transport"],
  ];

  for (const [re, cat] of rules) {
    if (re.test(lo)) { category = cat; break; }
  }

  const meta = getCategoryMeta(category);

  // Strip amount tokens from description
  const desc = text
    .replace(/\b(\d[\d.,]*)\s*(triliun|trilyun|miliar|milyar|juta|jt|ribu|rebu|rbu|rb|k)\b/gi, "")
    .replace(/\b\d[\d.,]+\b/g, "")
    .replace(/\s+/g, " ")
    .trim() || text.split(/\d/)[0].trim() || text;

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

/* ─── Payment methods — text badges (Simple Icons has no Indonesian brands) ─── */
const METHODS: { label: string; abbr: string; color: string; bg: string }[] = [
  { label: "Cash",    abbr: "💵",  color: "#4ade80", bg: "#052e16" },
  { label: "GoPay",   abbr: "GP",  color: "#00ADB4", bg: "#022c22" },
  { label: "OVO",     abbr: "OV",  color: "#c4b5fd", bg: "#2e1065" },
  { label: "Dana",    abbr: "DN",  color: "#60a5fa", bg: "#0c1a6e" },
  { label: "BCA",     abbr: "BC",  color: "#5aadff", bg: "#0f2352" },
  { label: "Mandiri", abbr: "MD",  color: "#fbbf24", bg: "#3a1800" },
  { label: "BRI",     abbr: "BR",  color: "#60a5fa", bg: "#0f1f4a" },
  { label: "BNI",     abbr: "BN",  color: "#fb923c", bg: "#431407" },
  { label: "QRIS",    abbr: "QR",  color: "#f87171", bg: "#450a0a" },
  { label: "Lainnya", abbr: "??",  color: "#94a3b8", bg: "#1e293b" },
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
                        ? { background: `${m.bg}`, color: m.color, border: `1px solid ${m.color}55` }
                        : { background: "#1f2937", color: "#6b7280", border: "1px solid #374151" }
                    }
                  >
                    <span
                      className="w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center shrink-0"
                      style={{ background: active ? m.color + "33" : "#374151", color: active ? m.color : "#6b7280" }}
                    >
                      {m.abbr}
                    </span>
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
