"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays } from "lucide-react";
import type { TimeseriesRow } from "@/types";
import { formatRupiah } from "@/lib/utils";

interface SpendingHeatmapProps {
  timeseries: TimeseriesRow[];
}

const DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

function getIntensityColor(value: number, max: number): string {
  if (value === 0) return "rgba(255,255,255,0.04)";
  const ratio = Math.min(value / max, 1);
  if (ratio < 0.25) return "rgba(251,191,36,0.20)";
  if (ratio < 0.5)  return "rgba(251,191,36,0.45)";
  if (ratio < 0.75) return "rgba(245,158,11,0.65)";
  return "rgba(217,119,6,0.90)";
}

function getIncomeColor(value: number, max: number): string {
  if (value === 0) return "rgba(255,255,255,0.04)";
  const ratio = Math.min(value / max, 1);
  if (ratio < 0.25) return "rgba(52,211,153,0.20)";
  if (ratio < 0.5)  return "rgba(52,211,153,0.45)";
  if (ratio < 0.75) return "rgba(16,185,129,0.65)";
  return "rgba(5,150,105,0.90)";
}

export function SpendingHeatmap({ timeseries }: SpendingHeatmapProps) {
  const [tooltip, setTooltip] = useState<{ date: string; expense: number; income: number; x: number; y: number } | null>(null);
  const [mode, setMode] = useState<"expense" | "income">("expense");

  const { weeks, monthLabels, maxExpense, maxIncome } = useMemo(() => {
    if (!timeseries.length) return { weeks: [], monthLabels: [], maxExpense: 0, maxIncome: 0 };

    // build a map from date → { expense, income }
    const dateMap = new Map<string, { expense: number; income: number }>();
    for (const row of timeseries) {
      const exp = row.net_harian < 0 ? Math.abs(row.net_harian) : 0;
      const inc = row.net_harian > 0 ? row.net_harian : 0;
      dateMap.set(row.tanggal, { expense: exp, income: inc });
    }

    const dates = [...dateMap.keys()].sort();
    const first = new Date(dates[0]);
    const last  = new Date(dates[dates.length - 1]);

    // align to Sunday start of first week
    const startDate = new Date(first);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const weeksArr: Array<Array<{ date: string; expense: number; income: number } | null>> = [];
    const current = new Date(startDate);
    let week: Array<{ date: string; expense: number; income: number } | null> = [];

    while (current <= last || week.length > 0) {
      const iso = current.toISOString().split("T")[0];
      const d = dateMap.get(iso) ?? { expense: 0, income: 0 };
      const inRange = current >= first && current <= last;
      week.push(inRange ? { date: iso, ...d } : null);
      current.setDate(current.getDate() + 1);
      if (week.length === 7) {
        weeksArr.push(week);
        week = [];
      }
    }
    if (week.length) {
      while (week.length < 7) week.push(null);
      weeksArr.push(week);
    }

    // month labels: find first week index per month
    const seenMonths = new Set<string>();
    const labels: Array<{ label: string; col: number }> = [];
    weeksArr.forEach((wk, wi) => {
      for (const cell of wk) {
        if (!cell) continue;
        const d2 = new Date(cell.date);
        const key = `${d2.getFullYear()}-${d2.getMonth()}`;
        if (!seenMonths.has(key)) {
          seenMonths.add(key);
          labels.push({ label: MONTHS[d2.getMonth()], col: wi });
        }
        break;
      }
    });

    const maxExp = Math.max(...[...dateMap.values()].map((v) => v.expense));
    const maxInc = Math.max(...[...dateMap.values()].map((v) => v.income));

    return { weeks: weeksArr, monthLabels: labels, maxExpense: maxExp, maxIncome: maxInc };
  }, [timeseries]);

  const totalDays = timeseries.length;
  const spendDays = timeseries.filter((r) => r.net_harian < 0).length;

  if (!weeks.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="glass rounded-2xl border border-white/[0.06] p-5 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-slate-800">Aktivitas Keuangan</h3>
          <span className="badge badge-amber">{totalDays} hari</span>
        </div>
        <div className="flex gap-1 glass rounded-lg p-0.5">
          <button
            onClick={() => setMode("expense")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${mode === "expense" ? "bg-amber-500/20 text-amber-300" : "text-slate-400 hover:text-slate-800"}`}
          >
            Pengeluaran
          </button>
          <button
            onClick={() => setMode("income")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${mode === "income" ? "bg-emerald-500/20 text-emerald-300" : "text-slate-400 hover:text-slate-800"}`}
          >
            Pemasukan
          </button>
        </div>
      </div>

      {/* Heatmap grid */}
      <div className="overflow-x-auto pb-1">
        <div className="relative" style={{ minWidth: `${weeks.length * 14}px` }}>
          {/* Month labels */}
          <div className="flex mb-1" style={{ paddingLeft: 28 }}>
            {monthLabels.map((ml) => (
              <div
                key={`${ml.label}-${ml.col}`}
                className="text-[10px] text-slate-800 absolute"
                style={{ left: 28 + ml.col * 14 }}
              >
                {ml.label}
              </div>
            ))}
          </div>

          <div className="flex gap-[2px] mt-4">
            {/* Day labels */}
            <div className="flex flex-col gap-[2px] mr-1">
              {DAYS.map((d, i) => (
                <div
                  key={d}
                  className="text-[9px] text-slate-700 h-[11px] flex items-center"
                  style={{ visibility: i % 2 === 1 ? "visible" : "hidden" }}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Weeks */}
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[2px]">
                {week.map((cell, di) => {
                  if (!cell) {
                    return <div key={di} className="heatmap-cell opacity-0" />;
                  }
                  const val = mode === "expense" ? cell.expense : cell.income;
                  const max = mode === "expense" ? maxExpense : maxIncome;
                  const color = mode === "expense"
                    ? getIntensityColor(val, max)
                    : getIncomeColor(val, max);

                  return (
                    <div
                      key={di}
                      className="heatmap-cell cursor-pointer"
                      style={{ background: color }}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setTooltip({
                          date: cell.date,
                          expense: cell.expense,
                          income: cell.income,
                          x: rect.left,
                          y: rect.top,
                        });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-[10px] text-slate-800">
        <span>{spendDays} hari pengeluaran tercatat</span>
        <div className="flex items-center gap-1">
          <span>Rendah</span>
          {[0.1, 0.3, 0.55, 0.75, 1].map((r) => (
            <div
              key={r}
              className="heatmap-cell"
              style={{
                background: mode === "expense"
                  ? getIntensityColor(r * maxExpense, maxExpense)
                  : getIncomeColor(r * maxIncome, maxIncome),
              }}
            />
          ))}
          <span>Tinggi</span>
        </div>
      </div>

      {/* Floating tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none glass-strong rounded-lg px-3 py-2 text-xs border border-white/10 shadow-xl"
          style={{ left: tooltip.x + 14, top: tooltip.y - 8 }}
        >
          <div className="text-slate-400 mb-1">{new Date(tooltip.date).toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" })}</div>
          {tooltip.expense > 0 && (
            <div className="text-amber-400">Keluar: {formatRupiah(tooltip.expense, true)}</div>
          )}
          {tooltip.income > 0 && (
            <div className="text-emerald-400">Masuk: {formatRupiah(tooltip.income, true)}</div>
          )}
          {tooltip.expense === 0 && tooltip.income === 0 && (
            <div className="text-slate-700">Tidak ada transaksi</div>
          )}
        </div>
      )}
    </motion.div>
  );
}
