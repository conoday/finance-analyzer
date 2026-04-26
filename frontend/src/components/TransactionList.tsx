"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Receipt, Trash2 } from "lucide-react";
import { CategoryBadge } from "@/components/CategoryBadge";
import { formatRupiah } from "@/lib/utils";
import type { TransactionRow } from "@/types";

const PAGE_SIZE = 12;

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  } catch {
    return dateStr;
  }
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

interface TransactionListProps {
  transactions: TransactionRow[];
  onDelete?: (id: string, desc: string) => void;
}

export function TransactionList({ transactions, onDelete }: TransactionListProps) {
  const [expanded, setExpanded] = useState(false);

  if (!transactions || transactions.length === 0) return null;

  const sorted = [...transactions].sort(
    (a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
  );

  const visible = expanded ? sorted : sorted.slice(0, PAGE_SIZE);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Receipt className="w-4 h-4 text-teal-400/60" />
          <h3 className="text-sm font-semibold text-slate-800">Riwayat Transaksi</h3>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{ background: "rgba(20,184,166,0.12)", color: "#2dd4bf" }}
          >
            {transactions.length}
          </span>
        </div>
        {transactions.length > PAGE_SIZE && (
          <button
            onClick={() => setExpanded((p) => !p)}
            className="flex items-center gap-1 text-xs text-slate-700 hover:text-teal-400 transition-colors"
          >
            {expanded ? (
              <><ChevronUp className="w-3.5 h-3.5" /> Tampilkan sedikit</>
            ) : (
              <><ChevronDown className="w-3.5 h-3.5" /> Lihat semua</>
            )}
          </button>
        )}
      </div>

      {/* Cards */}
      <div className="space-y-1.5">
        <AnimatePresence initial={false}>
          {visible.map((tx, i) => {
            const isIncome = tx.kredit > 0 && tx.debit === 0;
            const amount = isIncome ? tx.kredit : tx.debit;

            return (
              <motion.div
                key={tx.id ?? `${tx.tanggal}-${tx.deskripsi}-${i}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.3) }}
                className="tx-card flex items-center gap-3 rounded-xl px-4 py-3"
              >
                {/* Category icon */}
                <CategoryBadge category={tx.kategori ?? "Lainnya"} hint={tx.deskripsi} variant="icon" />

                {/* Description + category */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-slate-800 truncate leading-snug">
                      {truncate(tx.deskripsi, 36)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-slate-800">{formatDate(tx.tanggal)}</span>
                    <CategoryBadge category={tx.kategori ?? "Lainnya"} hint={tx.deskripsi} variant="pill" />
                  </div>
                </div>

                {/* Amount & Actions */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className={`text-sm font-bold font-mono tabular-nums ${isIncome ? "income-text" : "expense-text"}`}>
                    {isIncome ? "+" : "-"}
                    {formatRupiah(amount, true)}
                  </div>
                  {onDelete && tx.id ? (
                    <button
                      onClick={() => {
                        if (window.confirm(`Hapus transaksi "${tx.deskripsi}"?`)) {
                          onDelete(String(tx.id), tx.deskripsi);
                        }
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100"
                      title="Hapus Transaksi"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span className="hidden md:inline">Hapus</span>
                    </button>
                  ) : null}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Show more / less button */}
      {transactions.length > PAGE_SIZE && (
        <button
          onClick={() => setExpanded((p) => !p)}
          className="w-full py-2.5 rounded-xl text-xs text-slate-700 hover:text-teal-400 transition-colors"
          style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)" }}
        >
          {expanded
            ? `Tampilkan lebih sedikit`
            : `Lihat ${transactions.length - PAGE_SIZE} transaksi lainnya`}
        </button>
      )}
    </div>
  );
}
