"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Sparkles } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import type { Summary, TimeseriesRow } from "@/types";

type Period = "harian" | "mingguan" | "bulanan";

/** Derive net / income / expense for a given period window from timeseries */
function periodStats(timeseries: TimeseriesRow[], period: Period, summary: Summary) {
  if (!timeseries.length) return { income: summary.total_income, expense: summary.total_expense, net: summary.net_cashflow };

  const today = new Date(timeseries[timeseries.length - 1].tanggal);
  const daysBack = period === "harian" ? 1 : period === "mingguan" ? 7 : 30;
  const cutoff = new Date(today);
  cutoff.setDate(today.getDate() - daysBack);

  const rows = timeseries.filter((r) => new Date(r.tanggal) >= cutoff);
  const net = rows.reduce((s, r) => s + r.net_harian, 0);

  // Rough ratio approach for income/expense from period net
  const ratio = summary.total_income > 0 ? summary.total_expense / summary.total_income : 1;
  const income = net >= 0 ? net / (1 - ratio) : 0;
  const expense = income - net;

  return {
    income: income > 0 ? income : summary.total_income,
    expense: expense > 0 ? expense : summary.total_expense,
    net,
  };
}

interface BalanceCardProps {
  summary: Summary;
  timeseries: TimeseriesRow[];
}

export function BalanceCard({ summary, timeseries }: BalanceCardProps) {
  const [period, setPeriod] = useState<Period>("bulanan");
  const stats = periodStats(timeseries, period, summary);
  const isPositive = stats.net >= 0;

  const savingsRate =
    summary.total_income > 0
      ? Math.round((summary.net_cashflow / summary.total_income) * 100)
      : 0;

  const PERIODS: { id: Period; label: string }[] = [
    { id: "harian",   label: "Hari ini" },
    { id: "mingguan", label: "7 Hari" },
    { id: "bulanan",  label: "Bulanan" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative overflow-hidden rounded-2xl p-6 balance-card"
    >
      {/* Background orbs */}
      <div
        className="pointer-events-none absolute -top-14 -right-14 w-52 h-52 rounded-full opacity-25"
        style={{ background: "radial-gradient(circle at center, #14b8a6, transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-12 -left-12 w-40 h-40 rounded-full opacity-15"
        style={{ background: "radial-gradient(circle at center, #8b5cf6, transparent 70%)" }}
      />

      <div className="relative z-10">
        {/* Header row */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-teal-400 opacity-80" />
            <span className="text-xs font-medium text-slate-400 tracking-wide uppercase">Arus Kas Bersih</span>
          </div>

          {/* Period toggle */}
          <div
            className="flex items-center gap-0.5 rounded-lg p-0.5"
            style={{ background: "rgba(0,0,0,0.30)" }}
          >
            {PERIODS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={[
                  "px-2.5 py-1 rounded-md text-[10px] font-medium transition-all",
                  period === p.id
                    ? "bg-teal-500 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-300",
                ].join(" ")}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main balance number */}
        <div className="mb-1">
          <div
            className={`text-4xl sm:text-5xl font-bold font-mono tracking-tight ${
              isPositive ? "text-teal-300" : "text-rose-300"
            }`}
          >
            {isPositive ? "+" : ""}
            {formatRupiah(stats.net)}
          </div>
        </div>

        {/* Trend indicator */}
        <div
          className={`inline-flex items-center gap-1.5 mb-6 text-sm font-medium ${
            isPositive ? "text-teal-400" : "text-rose-400"
          }`}
        >
          {isPositive ? (
            <ArrowUpRight className="w-4 h-4" />
          ) : (
            <ArrowDownRight className="w-4 h-4" />
          )}
          <span>
            {isPositive ? "Surplus " : "Defisit "}
            {period === "bulanan"
              ? "bulan ini"
              : period === "mingguan"
              ? "7 hari terakhir"
              : "hari ini"}
          </span>
          {savingsRate !== 0 && (
            <span
              className="ml-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={{
                background: savingsRate >= 20 ? "rgba(20,184,166,0.18)" : "rgba(148,163,184,0.12)",
                color: savingsRate >= 20 ? "#2dd4bf" : "#94a3b8",
              }}
            >
              {savingsRate}% savings
            </span>
          )}
        </div>

        {/* Income / Expense split */}
        <div className="grid grid-cols-2 gap-3">
          <div
            className="rounded-xl p-3.5"
            style={{
              background: "rgba(16,185,129,0.08)",
              border: "1px solid rgba(16,185,129,0.15)",
            }}
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Pemasukan
              </span>
            </div>
            <div className="text-lg font-bold font-mono text-emerald-300">
              {formatRupiah(stats.income, true)}
            </div>
            <div className="text-[10px] text-slate-600 mt-0.5">
              {summary.income_count} transaksi
            </div>
          </div>

          <div
            className="rounded-xl p-3.5"
            style={{
              background: "rgba(244,63,94,0.08)",
              border: "1px solid rgba(244,63,94,0.15)",
            }}
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Pengeluaran
              </span>
            </div>
            <div className="text-lg font-bold font-mono text-rose-300">
              {formatRupiah(stats.expense, true)}
            </div>
            <div className="text-[10px] text-slate-600 mt-0.5">
              {summary.expense_count} transaksi
            </div>
          </div>
        </div>

        {/* Date range strip */}
        <div className="mt-4 pt-3.5 border-t border-white/5 flex items-center justify-between">
          <span className="text-[11px] text-slate-600">{summary.date_range}</span>
          <span className="text-[11px] text-slate-600">{summary.tx_count} total tx</span>
        </div>
      </div>
    </motion.div>
  );
}
