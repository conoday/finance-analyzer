"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, TrendingDown, TrendingUp, Zap, Cloud, HardDrive, Download, Calendar } from "lucide-react";
import type { QuickTransaction } from "@/components/SmartInput";
import { getCategoryMeta } from "@/components/CategoryBadge";
import { formatRupiah } from "@/lib/utils";

/* ── text-badge mapping for payment method ── */
const METHOD_BADGE: Record<string, { abbr: string; color: string; bg: string }> = {
  GoPay:   { abbr: "GP",  color: "#0f766e", bg: "#ccfbf1" },
  OVO:     { abbr: "OV",  color: "#7c3aed", bg: "#ede9fe" },
  Dana:    { abbr: "DN",  color: "#1d4ed8", bg: "#dbeafe" },
  BCA:     { abbr: "BC",  color: "#1d4ed8", bg: "#dbeafe" },
  Mandiri: { abbr: "MD",  color: "#b45309", bg: "#fef3c7" },
  BRI:     { abbr: "BR",  color: "#1d4ed8", bg: "#dbeafe" },
  BNI:     { abbr: "BN",  color: "#c2410c", bg: "#ffedd5" },
  QRIS:    { abbr: "QR",  color: "#b91c1c", bg: "#fee2e2" },
  Cash:    { abbr: "CS",  color: "#15803d", bg: "#dcfce7" },
  Lainnya: { abbr: "??",  color: "#475569", bg: "#f1f5f9" },
};

type Period = "7d" | "30d" | "all";

function filterByPeriod(txs: QuickTransaction[], period: Period): QuickTransaction[] {
  if (period === "all") return txs;
  const cutoff = Date.now() - (period === "7d" ? 7 : 30) * 86_400_000;
  return txs.filter((t) => new Date(t.date).getTime() >= cutoff);
}

function aggByCat(txs: QuickTransaction[]) {
  const map: Record<string, number> = {};
  txs.filter((t) => !t.isIncome).forEach((t) => {
    map[t.category] = (map[t.category] ?? 0) + t.amount;
  });
  return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5);
}

function exportCSV(txs: QuickTransaction[], period: Period) {
  const header = "Tanggal,Deskripsi,Kategori,Metode,Jumlah,Tipe";
  const rows = txs.map((t) => [
    t.date,
    `"${t.desc.replace(/"/g, '""')}"`,
    t.category,
    t.method,
    t.amount,
    t.isIncome ? "Pemasukan" : "Pengeluaran",
  ].join(","));
  const csv  = "\uFEFF" + [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `oprexduit-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

interface Props {
  txs:       QuickTransaction[];
  onAddNew:  () => void;
  onDelete:  (id: string) => void;
  onClear:   () => void;
  isCloud?:  boolean;
  loading?:  boolean;
}

export function QuickTracker({ txs, onAddNew, onDelete, onClear, isCloud = false, loading = false }: Props) {
  const [period, setPeriod]             = useState<Period>("7d");
  const [confirmClear, setConfirmClear] = useState(false);
  const [deletingId, setDeletingId]     = useState<string | null>(null);

  const filtered     = useMemo(() => filterByPeriod(txs, period), [txs, period]);
  const totalIncome  = useMemo(() => filtered.filter((t) => t.isIncome).reduce((s, t) => s + t.amount, 0), [filtered]);
  const totalExpense = useMemo(() => filtered.filter((t) => !t.isIncome).reduce((s, t) => s + t.amount, 0), [filtered]);
  const balance      = totalIncome - totalExpense;
  const topCats      = useMemo(() => aggByCat(filtered), [filtered]);

  const handleDelete = useCallback((id: string) => {
    setDeletingId(id);
    setTimeout(() => { onDelete(id); setDeletingId(null); }, 250);
  }, [onDelete]);

  const PERIOD_OPTS: { key: Period; label: string }[] = [
    { key: "7d",  label: "7 Hari" },
    { key: "30d", label: "30 Hari" },
    { key: "all", label: "Semua" },
  ];

  if (!loading && txs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 p-8 flex flex-col items-center gap-3 text-center">
        <Zap className="w-8 h-8 text-slate-400" />
        <p className="text-sm text-slate-700">Belum ada catatan.</p>
        <button
          onClick={onAddNew}
          className="mt-1 px-4 py-2 rounded-lg text-xs font-medium transition-colors"
          style={{ background: "#0f766e", color: "#ccfbf1" }}
        >
          + Catat Transaksi Pertama
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Period filter + Export ── */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 p-0.5 rounded-lg" style={{ background: "#f1f5f9", border: "1px solid #e2e8f0" }}>
          <Calendar className="w-3 h-3 text-slate-800 ml-1.5" />
          {PERIOD_OPTS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setPeriod(opt.key)}
              className="px-2.5 py-1 rounded-md text-[11px] font-medium transition-all"
              style={period === opt.key ? { background: "#0f766e", color: "#ccfbf1" } : { color: "#64748b" }}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => exportCSV(filtered, period)}
          disabled={filtered.length === 0}
          title="Export CSV (bisa dibuka di Excel)"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors disabled:opacity-30"
          style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}
        >
          <Download className="w-3 h-3" />
          Export
        </button>
      </div>

      {/* ── Summary strip ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Pemasukan",   value: totalIncome,  color: "#34d399", icon: <TrendingUp className="w-3.5 h-3.5" /> },
          { label: "Pengeluaran", value: totalExpense, color: "#fb7185", icon: <TrendingDown className="w-3.5 h-3.5" /> },
          { label: "Saldo",       value: balance,      color: balance >= 0 ? "#34d399" : "#fb7185", icon: null },
        ].map((item) => (
          <div key={item.label} className="rounded-xl px-3 py-3" style={{ background: "#ffffff", border: "1px solid #e2e8f0" }}>
            <p className="text-[10px] text-slate-700 mb-1 flex items-center gap-1">{item.icon}{item.label}</p>
            <p className="text-sm font-bold font-mono" style={{ color: item.color }}>
              {item.value >= 0 ? "" : "-"}{formatRupiah(Math.abs(item.value), true)}
            </p>
          </div>
        ))}
      </div>

      {/* ── Category breakdown ── */}
      {topCats.length > 0 && (
        <div className="rounded-xl px-4 py-3 space-y-2" style={{ background: "#ffffff", border: "1px solid #e2e8f0" }}>
          <p className="text-xs font-medium text-slate-800 mb-2">Pengeluaran per Kategori</p>
          {topCats.map(([cat, amount]) => {
            const meta = getCategoryMeta(cat);
            const pct  = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
            return (
              <div key={cat} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <span>{meta.emoji}</span>{cat}
                  </span>
                  <span className="font-mono text-slate-700">{formatRupiah(amount, true)}</span>
                </div>
                <div className="h-1 rounded-full bg-slate-200">
                  <div className="h-1 rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: meta.hex }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Transaction list ── */}
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #e2e8f0" }}>
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100" style={{ background: "#f8fafc" }}>
          <p className="text-xs font-medium text-slate-800 flex items-center gap-1.5">
            {isCloud
              ? <><Cloud className="w-3 h-3 text-teal-500" /> {filtered.length} transaksi</>
              : <><HardDrive className="w-3 h-3 text-slate-400" /> {filtered.length} transaksi</>
            }
            {period !== "all" && <span className="text-slate-400"> &middot; {period === "7d" ? "7" : "30"} hari terakhir</span>}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onAddNew}
              className="text-[10px] font-medium px-2.5 py-1 rounded-lg transition-colors"
              style={{ background: "rgba(20,184,166,0.12)", color: "#2dd4bf" }}
            >
              + Tambah
            </button>
            {!confirmClear ? (
              <button onClick={() => setConfirmClear(true)} className="text-[10px] text-slate-800 hover:text-slate-400 transition-colors px-1" title="Hapus semua">
                <Trash2 className="w-3 h-3" />
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button onClick={() => { onClear(); setConfirmClear(false); }} className="text-[10px] text-red-400 hover:text-red-300 font-medium">Hapus semua</button>
                <button onClick={() => setConfirmClear(false)} className="text-[10px] text-slate-700 hover:text-slate-700">Batal</button>
              </div>
            )}
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
          <AnimatePresence>
            {filtered.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-700" style={{ background: "#f8fafc" }}>
                Tidak ada transaksi dalam periode ini.
              </div>
            ) : filtered.map((tx) => {
              const meta      = getCategoryMeta(tx.category);
              const mBadge    = METHOD_BADGE[tx.method] ?? METHOD_BADGE["Lainnya"];
              const isDeleting = deletingId === tx.id;
              return (
                <motion.div
                  key={tx.id}
                  initial={false}
                  animate={{ opacity: isDeleting ? 0 : 1, x: isDeleting ? 20 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 group"
                  style={{ background: "#ffffff" }}
                >
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0" style={{ background: `${meta.hex}18` }}>
                    {meta.emoji}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-800 truncate">{tx.desc}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-slate-700">
                        {new Date(tx.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                      </span>
                      <span className="text-slate-300">&middot;</span>
                      <span className="text-[8px] font-bold w-3.5 h-3.5 rounded flex items-center justify-center" style={{ background: mBadge.bg, color: mBadge.color }}>
                        {mBadge.abbr}
                      </span>
                      <span className="text-[10px] text-slate-700">{tx.method}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold font-mono" style={{ color: tx.isIncome ? "#059669" : "#e11d48" }}>
                      {tx.isIncome ? "+" : "-"}{formatRupiah(tx.amount, true)}
                    </span>
                    <button onClick={() => handleDelete(tx.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Storage indicator ── */}
      {isCloud ? (
        <div className="rounded-xl px-4 py-3 flex items-center gap-2" style={{ background: "linear-gradient(135deg, #f0fdf4, #ecfdf5)", border: "1px solid #a7f3d0" }}>
          <Cloud className="w-4 h-4 text-teal-500 shrink-0" />
          <p className="text-[11px] text-teal-700 font-medium">Tersinkronisasi ke cloud &mdash; aman di semua perangkat</p>
        </div>
      ) : (
        <div className="rounded-xl px-4 py-3 flex items-center gap-2" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
          <HardDrive className="w-4 h-4 text-slate-400 shrink-0" />
          <p className="text-[11px] text-slate-700">
            Tersimpan di browser ini &mdash;{" "}
            <a href="/auth/login" className="text-teal-600 hover:underline font-medium">Login</a>
            {" "}untuk simpan permanen
          </p>
        </div>
      )}
    </div>
  );
}

