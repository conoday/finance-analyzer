"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Wallet, Hash, CreditCard } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import type { Summary } from "@/types";

interface KPICardsProps {
  summary: Summary;
  subTotal: number;
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function KPICards({ summary, subTotal }: KPICardsProps) {
  const net = summary.net_cashflow;
  const netPositive = net >= 0;

  const cards = [
    {
      label: "Total Pemasukan",
      value: formatRupiah(summary.total_income, true),
      sub: `${summary.income_count} transaksi`,
      icon: TrendingUp,
      color: "text-emerald-400",
      bg: "from-emerald-500/10 to-emerald-600/5",
      border: "border-emerald-500/15",
      glow: "glow-green",
    },
    {
      label: "Total Pengeluaran",
      value: formatRupiah(summary.total_expense, true),
      sub: `${summary.expense_count} transaksi`,
      icon: TrendingDown,
      color: "text-red-400",
      bg: "from-red-500/10 to-red-600/5",
      border: "border-red-500/15",
      glow: "glow-red",
    },
    {
      label: "Net Cash Flow",
      value: (netPositive ? "+" : "") + formatRupiah(net, true),
      sub: summary.date_range,
      icon: Wallet,
      color: netPositive ? "text-blue-400" : "text-orange-400",
      bg: netPositive ? "from-blue-500/10 to-blue-600/5" : "from-orange-500/10 to-orange-600/5",
      border: netPositive ? "border-blue-500/15" : "border-orange-500/15",
      glow: netPositive ? "glow-blue" : "",
    },
    {
      label: "Total Transaksi",
      value: `${summary.tx_count}`,
      sub: `Rata-rata ${formatRupiah(summary.avg_expense, true)}/tx`,
      icon: Hash,
      color: "text-purple-400",
      bg: "from-purple-500/10 to-purple-600/5",
      border: "border-purple-500/15",
      glow: "glow-purple",
    },
    {
      label: "Biaya Langganan",
      value: formatRupiah(subTotal, true),
      sub: "estimasi per bulan",
      icon: CreditCard,
      color: "text-cyan-400",
      bg: "from-cyan-500/10 to-cyan-600/5",
      border: "border-cyan-500/15",
      glow: "",
    },
  ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"
    >
      {cards.map((c) => (
        <motion.div
          key={c.label}
          variants={item}
          className={[
            "glass rounded-xl p-4 border flex flex-col gap-3",
            c.border,
          ].join(" ")}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">{c.label}</span>
            <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${c.bg} flex items-center justify-center`}>
              <c.icon className={`w-3.5 h-3.5 ${c.color}`} />
            </div>
          </div>
          <div>
            <div className={`text-xl font-bold ${c.color} leading-none`}>{c.value}</div>
            <div className="text-[11px] text-slate-600 mt-1">{c.sub}</div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
