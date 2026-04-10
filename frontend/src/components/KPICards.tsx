"use client";

import { motion } from "framer-motion";
import { PiggyBank, Hash, TrendingDown, CreditCard } from "lucide-react";
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
      className="grid grid-cols-2 lg:grid-cols-4 gap-3"
    >
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
    </motion.div>
  );
}
