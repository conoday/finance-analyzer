"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, TrendingDown, TrendingUp, Zap, ChevronRight } from "lucide-react";
import { useQuickTransactions } from "@/components/SmartInput";
import type { QuickTransaction } from "@/components/SmartInput";
import { getCategoryMeta } from "@/components/CategoryBadge";
import { formatRupiah } from "@/lib/utils";
import { Icon } from "@iconify/react";

/* ── brand icon mapping for payment method ── */
const METHOD_ICON: Record<string, { icon: string; color: string }> = {
  GoPay:   { icon: "simple-icons:gojek",        color: "#00ADB4" },
  OVO:     { icon: "simple-icons:ovo",           color: "#8B5CF6" },
  Dana:    { icon: "simple-icons:dana",          color: "#108EE9" },
  BCA:     { icon: "simple-icons:bca",           color: "#005BAC" },
  Mandiri: { icon: "simple-icons:bankmandiri",   color: "#F59E0B" },
  BRI:     { icon: "simple-icons:bankbri",       color: "#00529C" },
  BNI:     { icon: "simple-icons:bankbni",       color: "#E65100" },
  QRIS:    { icon: "simple-icons:qris",          color: "#EB001B" },
  Cash:    { icon: "lucide:banknote",            color: "#4ade80" },
  Lainnya: { icon: "lucide:credit-card",         color: "#94a3b8" },
};

/* ── per-category spend aggregation ── */
function aggByCat(txs: QuickTransaction[]) {
  const map: Record<string, number> = {};
  txs.filter((t) => !t.isIncome).forEach((t) => {
    map[t.category] = (map[t.category] ?? 0) + t.amount;
  });
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
}

interface Props {
  onAddNew: () => void;
}

export function QuickTracker({ onAddNew }: Props) {
  const { txs, refresh, clear } = useQuickTransactions();
  const [confirmClear, setConfirmClear] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // refresh when component mounts
  useEffect(() => { refresh(); }, [refresh]);

  const deleteOne = useCallback((id: string) => {
    setDeletingId(id);
    setTimeout(() => {
      const updated = txs.filter((t) => t.id !== id);
      localStorage.setItem("fa_quick_transactions", JSON.stringify(updated));
      refresh();
      setDeletingId(null);
    }, 250);
  }, [txs, refresh]);

  const totalIncome  = txs.filter((t) => t.isIncome).reduce((s, t) => s + t.amount, 0);
  const totalExpense = txs.filter((t) => !t.isIncome).reduce((s, t) => s + t.amount, 0);
  const balance      = totalIncome - totalExpense;
  const topCats      = aggByCat(txs);

  if (txs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 p-8 flex flex-col items-center gap-3 text-center">
        <Zap className="w-8 h-8 text-slate-700" />
        <p className="text-sm text-slate-500">Belum ada catatan.</p>
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
      {/* ── Summary strip ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Pemasukan",    value: totalIncome,  color: "#34d399", icon: <TrendingUp className="w-3.5 h-3.5" /> },
          { label: "Pengeluaran",  value: totalExpense, color: "#fb7185", icon: <TrendingDown className="w-3.5 h-3.5" /> },
          { label: "Saldo",        value: balance,      color: balance >= 0 ? "#34d399" : "#fb7185", icon: null },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl px-3 py-3"
            style={{ background: "#111827", border: "1px solid #1f2937" }}
          >
            <p className="text-[10px] text-slate-500 mb-1 flex items-center gap-1">
              {item.icon}{item.label}
            </p>
            <p className="text-sm font-bold font-mono" style={{ color: item.color }}>
              {item.value >= 0 ? "" : "−"}{formatRupiah(Math.abs(item.value), true)}
            </p>
          </div>
        ))}
      </div>

      {/* ── Category breakdown ── */}
      {topCats.length > 0 && (
        <div
          className="rounded-xl px-4 py-3 space-y-2"
          style={{ background: "#111827", border: "1px solid #1f2937" }}
        >
          <p className="text-xs font-medium text-slate-400 mb-2">Pengeluaran per Kategori</p>
          {topCats.map(([cat, amount]) => {
            const meta = getCategoryMeta(cat);
            const pct = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
            return (
              <div key={cat} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <span>{meta.emoji}</span>{cat}
                  </span>
                  <span className="font-mono text-slate-400">{formatRupiah(amount, true)}</span>
                </div>
                <div className="h-1 rounded-full bg-white/5">
                  <div
                    className="h-1 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: meta.hex }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Transaction list ── */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: "1px solid #1f2937" }}
      >
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
          <p className="text-xs font-medium text-slate-400">{txs.length} transaksi dicatat</p>
          <div className="flex items-center gap-2">
            <button
              onClick={onAddNew}
              className="text-[10px] font-medium px-2.5 py-1 rounded-lg transition-colors"
              style={{ background: "rgba(20,184,166,0.12)", color: "#2dd4bf" }}
            >
              + Tambah
            </button>
            {!confirmClear ? (
              <button
                onClick={() => setConfirmClear(true)}
                className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors px-1"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => { clear(); setConfirmClear(false); }}
                  className="text-[10px] text-red-400 hover:text-red-300 font-medium"
                >Hapus semua</button>
                <button
                  onClick={() => setConfirmClear(false)}
                  className="text-[10px] text-slate-500 hover:text-slate-300"
                >Batal</button>
              </div>
            )}
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto divide-y divide-white/[0.04]">
          <AnimatePresence>
            {txs.map((tx) => {
              const meta    = getCategoryMeta(tx.category);
              const mIcon   = METHOD_ICON[tx.method] ?? METHOD_ICON["Lainnya"];
              const isDeleting = deletingId === tx.id;
              return (
                <motion.div
                  key={tx.id}
                  initial={false}
                  animate={{ opacity: isDeleting ? 0 : 1, x: isDeleting ? 20 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.02] group"
                  style={{ background: "#111827" }}
                >
                  {/* Category icon */}
                  <span
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
                    style={{ background: `${meta.hex}15` }}
                  >
                    {meta.emoji}
                  </span>

                  {/* Description + meta */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-200 truncate">{tx.desc}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-slate-600">
                        {new Date(tx.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                      </span>
                      <span className="text-slate-700">·</span>
                      <Icon icon={mIcon.icon} className="w-2.5 h-2.5" style={{ color: mIcon.color }} />
                      <span className="text-[10px] text-slate-600">{tx.method}</span>
                    </div>
                  </div>

                  {/* Amount + delete */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className="text-xs font-bold font-mono"
                      style={{ color: tx.isIncome ? "#34d399" : "#fb7185" }}
                    >
                      {tx.isIncome ? "+" : "−"}{formatRupiah(tx.amount, true)}
                    </span>
                    <button
                      onClick={() => deleteOne(tx.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-700 hover:text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Upgrade teaser ── */}
      <div
        className="rounded-xl px-4 py-3 flex items-center justify-between"
        style={{ background: "linear-gradient(135deg, #0c1f2e, #0d1f1e)", border: "1px solid #1e3a3a" }}
      >
        <div>
          <p className="text-xs font-semibold text-teal-400">🔒 Simpan permanen — Segera Hadir</p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Saat ini tersimpan di browser. Login untuk sinkronisasi antar perangkat.
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
      </div>
    </div>
  );
}
