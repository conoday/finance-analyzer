"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAnalysis } from "@/hooks/useAnalysis";
import { useDisplayMode } from "@/hooks/useDisplayMode";
import { MonthlyChart } from "@/components/MonthlyChart";
import { SpendingWheel } from "@/components/SpendingWheel";
import { SpendingHeatmap } from "@/components/SpendingHeatmap";
import { StoryCards } from "@/components/StoryCards";
import { PageHero } from "@/components/PageHero";
import { MotionSection } from "@/components/MotionSection";
import { NumberTicker } from "@/components/ui/NumberTicker";
import { motion } from "framer-motion";
import { Loader2, BarChart3 } from "lucide-react";
import { cn, formatRupiah } from "@/lib/utils";

export default function LaporanPage() {
  const { user } = useAuth();
  const { data, status, analyzeMe } = useAnalysis();
  const { isShowtime } = useDisplayMode();
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const [monthFilter, setMonthFilter] = useState<string>(currentMonthStr);

  const income = data?.summary?.total_income ?? 0;
  const expense = data?.summary?.total_expense ?? 0;
  const net = data?.summary?.net_cashflow ?? 0;
  const savingsRate = income > 0 ? (net / income) * 100 : 0;
  const topCategory = data?.by_category?.[0]?.kategori ?? "Belum ada";

  useEffect(() => {
    if (user && status === "idle") analyzeMe(monthFilter);
  }, [user, status, analyzeMe, monthFilter]);

  return (
    <div className={cn("space-y-6", isShowtime ? "showtime-surface" : "")}>
      <MotionSection delay={0.02}>
        <PageHero
          icon={BarChart3}
          tone="violet"
          badge="Analytics"
          title="Laporan dan Tren Keuangan"
          subtitle="Baca pola pengeluaran, momentum pemasukan, dan cerita bulanan secara visual."
          actions={
            <div className="flex flex-wrap items-center gap-2 md:justify-end">
              <div
                className={cn(
                  "rounded-xl px-2.5 py-2",
                  isShowtime
                    ? "border border-white/[0.12] bg-white/[0.04]"
                    : "border border-slate-200 bg-white shadow-sm"
                )}
              >
                <input
                  type="month"
                  value={monthFilter}
                  onChange={(e) => {
                    setMonthFilter(e.target.value);
                    analyzeMe(e.target.value || undefined);
                  }}
                  className={cn("bg-transparent text-sm font-semibold outline-none", isShowtime ? "text-slate-100" : "text-slate-700")}
                />
              </div>
              {monthFilter && (
                <button
                  onClick={() => {
                    setMonthFilter("");
                    analyzeMe();
                  }}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-xs font-semibold transition",
                    isShowtime
                      ? "border-white/[0.12] bg-white/[0.04] text-slate-200 hover:border-violet-300/60 hover:text-violet-100"
                      : "border-slate-200 bg-white text-slate-600 hover:border-violet-200 hover:text-violet-700"
                  )}
                >
                  Semua
                </button>
              )}
            </div>
          }
        />
      </MotionSection>

      {data && (
        <MotionSection delay={0.04}>
          <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div
              className={cn(
                "rounded-2xl px-4 py-3",
                isShowtime
                  ? "oprex-panel border border-white/[0.12]"
                  : "border border-slate-200/70 bg-white/90 shadow-sm"
              )}
            >
              <p className={cn("text-[11px] font-semibold uppercase tracking-wide", isShowtime ? "text-slate-300/75" : "text-slate-500")}>Net Cashflow</p>
              <p className={cn("mt-1 text-2xl font-extrabold", net >= 0 ? (isShowtime ? "text-emerald-200" : "text-emerald-600") : isShowtime ? "text-rose-200" : "text-rose-600") }>
                {isShowtime ? (
                  <>
                    <span className="mr-1 align-middle text-base opacity-70">{net < 0 ? "-Rp" : "Rp"}</span>
                    <NumberTicker value={Math.abs(net)} />
                  </>
                ) : (
                  formatRupiah(net)
                )}
              </p>
            </div>
            <div
              className={cn(
                "rounded-2xl px-4 py-3",
                isShowtime
                  ? "oprex-panel border border-white/[0.12]"
                  : "border border-slate-200/70 bg-white/90 shadow-sm"
              )}
            >
              <p className={cn("text-[11px] font-semibold uppercase tracking-wide", isShowtime ? "text-slate-300/75" : "text-slate-500")}>Savings Rate</p>
              <p className={cn("mt-1 text-2xl font-extrabold", isShowtime ? "text-cyan-200" : "text-sky-600")}>{savingsRate.toFixed(1)}%</p>
              <p className={cn("mt-1 text-xs", isShowtime ? "text-slate-300/75" : "text-slate-500")}>Income {formatRupiah(income, true)} vs Expense {formatRupiah(expense, true)}</p>
            </div>
            <div
              className={cn(
                "rounded-2xl px-4 py-3",
                isShowtime
                  ? "oprex-panel border border-white/[0.12]"
                  : "border border-slate-200/70 bg-white/90 shadow-sm"
              )}
            >
              <p className={cn("text-[11px] font-semibold uppercase tracking-wide", isShowtime ? "text-slate-300/75" : "text-slate-500")}>Top Kategori</p>
              <p className={cn("mt-1 truncate text-2xl font-extrabold", isShowtime ? "text-violet-100" : "text-violet-700")}>{topCategory}</p>
            </div>
          </section>
        </MotionSection>
      )}

      {status === "loading" && (
        <div className="flex justify-center py-16"><Loader2 className={cn("h-8 w-8 animate-spin", isShowtime ? "text-violet-300" : "text-teal-500")} /></div>
      )}

      {data && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <MotionSection delay={0.05}>
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
              <div className="xl:col-span-2">
                <MonthlyChart data={data.monthly} />
              </div>
              <SpendingWheel data={data.by_category} />
            </div>
          </MotionSection>
          <MotionSection delay={0.08}>
            <SpendingHeatmap timeseries={data.timeseries} />
          </MotionSection>
          <MotionSection delay={0.1}>
            <StoryCards stories={data.monthly_stories} overall={data.overall_story} />
          </MotionSection>
        </motion.div>
      )}

      {!user && (
        <MotionSection delay={0.1}>
          <div
            className={cn(
              "rounded-2xl py-16 text-center",
              isShowtime
                ? "border border-white/[0.12] bg-white/[0.04] text-slate-200"
                : "border border-slate-200 bg-white/85 text-slate-500"
            )}
          >
            <BarChart3 className={cn("mx-auto mb-3 h-12 w-12", isShowtime ? "text-slate-400" : "text-slate-300")} />
            <p className="text-sm">Masuk untuk melihat laporan keuangan.</p>
          </div>
        </MotionSection>
      )}
    </div>
  );
}
