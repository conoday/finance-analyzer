"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAnalysis } from "@/hooks/useAnalysis";
import { ForecastChart } from "@/components/ForecastChart";
import { HealthGauge } from "@/components/HealthGauge";
import { SimulatorPanel } from "@/components/SimulatorPanel";
import { AIPlanner } from "@/components/AIPlanner";
import { PageHero } from "@/components/PageHero";
import { motion } from "framer-motion";
import { Loader2, TrendingUp } from "lucide-react";

export default function PerencanaanPage() {
  const { user } = useAuth();
  const { data, status, analyzeMe } = useAnalysis();

  useEffect(() => {
    if (user && status === "idle") analyzeMe();
  }, [user, status, analyzeMe]);

  return (
    <div className="space-y-6">
      <PageHero
        icon={TrendingUp}
        tone="amber"
        badge="Planning"
        title="Perencanaan Keuangan Proaktif"
        subtitle="Gabungkan forecast, simulasi, dan rekomendasi AI untuk keputusan yang lebih mantap."
      />

      {status === "loading" && (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-teal-500" /></div>
      )}

      {data && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <HealthGauge report={data.health_report} />
          <ForecastChart timeseries={data.timeseries} forecast={data.forecast} />
          <SimulatorPanel data={data} />
          <AIPlanner prefillIncome={data.summary.total_income} prefillExpense={data.summary.total_expense} />
        </motion.div>
      )}

      {!user && (
        <div className="rounded-2xl border border-slate-200 bg-white/85 py-16 text-center text-slate-500">
          <TrendingUp className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-sm">Masuk untuk menggunakan fitur perencanaan keuangan.</p>
        </div>
      )}
    </div>
  );
}
