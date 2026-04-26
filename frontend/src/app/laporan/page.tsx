"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAnalysis } from "@/hooks/useAnalysis";
import { MonthlyChart } from "@/components/MonthlyChart";
import { SpendingWheel } from "@/components/SpendingWheel";
import { SpendingHeatmap } from "@/components/SpendingHeatmap";
import { StoryCards } from "@/components/StoryCards";
import { PageHero } from "@/components/PageHero";
import { MotionSection } from "@/components/MotionSection";
import { motion } from "framer-motion";
import { Loader2, BarChart3 } from "lucide-react";

export default function LaporanPage() {
  const { user } = useAuth();
  const { data, status, analyzeMe } = useAnalysis();
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const [monthFilter, setMonthFilter] = useState<string>(currentMonthStr);

  useEffect(() => {
    if (user && status === "idle") analyzeMe(monthFilter);
  }, [user, status, analyzeMe, monthFilter]);

  return (
    <div className="space-y-6">
      <MotionSection delay={0.02}>
        <PageHero
          icon={BarChart3}
          tone="violet"
          badge="Analytics"
          title="Laporan dan Tren Keuangan"
          subtitle="Baca pola pengeluaran, momentum pemasukan, dan cerita bulanan secara visual."
          actions={
            <div className="flex flex-wrap items-center gap-2 md:justify-end">
              <div className="rounded-xl border border-slate-200 bg-white px-2.5 py-2 shadow-sm">
                <input
                  type="month"
                  value={monthFilter}
                  onChange={(e) => {
                    setMonthFilter(e.target.value);
                    analyzeMe(e.target.value || undefined);
                  }}
                  className="bg-transparent text-sm font-semibold text-slate-700 outline-none"
                />
              </div>
              {monthFilter && (
                <button
                  onClick={() => {
                    setMonthFilter("");
                    analyzeMe();
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-violet-200 hover:text-violet-700"
                >
                  Semua
                </button>
              )}
            </div>
          }
        />
      </MotionSection>

      {status === "loading" && (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-teal-500" /></div>
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
          <div className="rounded-2xl border border-slate-200 bg-white/85 py-16 text-center text-slate-500">
            <BarChart3 className="mx-auto mb-3 h-12 w-12 text-slate-300" />
            <p className="text-sm">Masuk untuk melihat laporan keuangan.</p>
          </div>
        </MotionSection>
      )}
    </div>
  );
}
