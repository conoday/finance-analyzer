"use client";

import { motion } from "framer-motion";
import { PiggyBank, Hash, TrendingDown, CreditCard, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import type { Summary } from "@/types";

interface KPICardsProps {
  summary: Summary;
  subTotal: number;
}

export function KPICards({ summary, subTotal }: KPICardsProps) {
  const savingsRate =
    summary.total_income > 0
      ? Math.round((summary.net_cashflow / summary.total_income) * 100)
      : 0;

  const expensePct =
    summary.total_income > 0
      ? Math.min(Math.round((summary.total_expense / summary.total_income) * 100), 100)
      : 0;

  const metrics = [
    {
      label: "Savings Rate",
      value: `${savingsRate}%`,
      sub: savingsRate >= 20 ? "🎯 Target tercapai" : `Target 20%`,
      icon: PiggyBank,
      accent: savingsRate >= 20 ? "#2dd4bf" : savingsRate >= 10 ? "#fbbf24" : "#fb7185",
    },
    {
      label: "Total Transaksi",
      value: `${summary.tx_count}`,
      sub: summary.date_range,
      icon: Hash,
      accent: "#818cf8",
    },
    {
      label: "Rata-rata Pengeluaran",
      value: formatRupiah(summary.avg_expense, true),
      sub: "per transaksi",
      icon: TrendingDown,
      accent: "#fb923c",
    },
    {
      label: "Langganan/bulan",
      value: formatRupiah(subTotal, true),
      sub: "estimasi tetap",
      icon: CreditCard,
      accent: "#38bdf8",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.4 }}
      className="space-y-3"
    >
      {/* Income vs Expense bar */}
      <div className="glass rounded-xl p-4 border border-white/[0.06]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Pemasukan vs Pengeluaran</span>
          <span
            className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full"
            style={{
              background: savingsRate >= 0 ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
              color: savingsRate >= 0 ? "#4ade80" : "#f87171",
            }}
          >
            {savingsRate >= 0 ? "+" : ""}{savingsRate}% savings
          </span>
        </div>
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <ArrowUpRight className="w-3.5 h-3.5 text-green-400 shrink-0" />
            <span className="text-xs text-slate-400 truncate">Masuk</span>
            <span className="text-sm font-bold font-mono text-green-400 ml-1">{formatRupiah(summary.total_income, true)}</span>
          </div>
          <div className="flex items-center gap-1.5 min-w-0 ml-auto">
            <span className="text-sm font-bold font-mono text-red-400 mr-1">{formatRupiah(summary.total_expense, true)}</span>
            <span className="text-xs text-slate-400 truncate">Keluar</span>
            <ArrowDownRight className="w-3.5 h-3.5 text-red-400 shrink-0" />
          </div>
        </div>
        {/* Stacked bar */}
        <div className="relative h-3 rounded-full overflow-hidden" style={{ background: "rgba(34,197,94,0.15)" }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${expensePct}%` }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="absolute left-0 top-0 h-full rounded-full"
            style={{
              background:
                expensePct >= 95
                  ? "linear-gradient(90deg, #ef4444, #f97316)"
                  : expensePct >= 80
                  ? "linear-gradient(90deg, #f59e0b, #fb923c)"
                  : "linear-gradient(90deg, #14b8a6, #22c55e)",
            }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-500 mt-1">
          <span>{expensePct}% terpakai</span>
          <span>Net {formatRupiah(summary.net_cashflow, true)}</span>
        </div>
      </div>

      {/* KPI metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="glass rounded-xl p-4 flex items-start gap-3"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: `${m.accent}16`, border: `1px solid ${m.accent}28` }}
            >
              <m.icon className="w-4 h-4" style={{ color: m.accent }} />
            </div>
            <div className="min-w-0">
              <div
                className="text-lg font-bold leading-none font-mono tabular-nums"
                style={{ color: m.accent }}
              >
                {m.value}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 leading-snug truncate">{m.label}</div>
              <div className="text-[10px] text-slate-700 mt-0.5 truncate">{m.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
