"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAnalysis } from "@/hooks/useAnalysis";
import { MonthlyChart } from "@/components/MonthlyChart";
import { SpendingWheel } from "@/components/SpendingWheel";
import { SpendingHeatmap } from "@/components/SpendingHeatmap";
import { StoryCards } from "@/components/StoryCards";
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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(124,58,237,0.12)" }}>
            <BarChart3 className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Laporan & Analitik</h1>
            <p className="text-xs text-slate-500">Visualisasi pengeluaran & tren keuangan</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-600">Bulan:</span>
          <input
            type="month" value={monthFilter}
            onChange={(e) => { setMonthFilter(e.target.value); analyzeMe(e.target.value || undefined); }}
            className="bg-white border focus:ring-2 focus:outline-none focus:ring-teal-500 p-1.5 text-sm rounded-lg shadow-sm font-medium text-slate-800"
          />
          {monthFilter && (
            <button onClick={() => { setMonthFilter(""); analyzeMe(); }}
              className="text-xs text-slate-500 hover:text-slate-800 underline">Semua</button>
          )}
        </div>
      </div>

      {status === "loading" && (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-teal-500" /></div>
      )}

      {data && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <div className="xl:col-span-2">
              <MonthlyChart data={data.monthly} />
            </div>
            <SpendingWheel data={data.by_category} />
          </div>
          <SpendingHeatmap timeseries={data.timeseries} />
          <StoryCards stories={data.monthly_stories} overall={data.overall_story} />
        </motion.div>
      )}

      {!user && (
        <div className="text-center py-16 text-slate-500">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-sm">Masuk untuk melihat laporan keuangan.</p>
        </div>
      )}
    </div>
  );
}
