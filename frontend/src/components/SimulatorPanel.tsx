"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { Sliders, Play, TrendingDown, TrendingUp } from "lucide-react";
import { useSimulator } from "@/hooks/useAnalysis";
import { formatRupiah, categoryColor } from "@/lib/utils";
import type { AnalysisResult } from "@/types";

interface SimulatorPanelProps {
  data: AnalysisResult;
}

export function SimulatorPanel({ data }: SimulatorPanelProps) {
  const { result, loading, error, simulate } = useSimulator(data);
  const [horizon, setHorizon] = useState(6);
  const [adjustments, setAdjustments] = useState<Record<string, number>>({});

  const categories = data.by_category.slice(0, 8);

  const handleSlider = (cat: string, val: number) => {
    setAdjustments((prev) => ({ ...prev, [cat]: val }));
  };

  const handleRun = () => {
    simulate(adjustments, horizon);
  };

  const totalSaving = result?.impact?.total_saving ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 lg:grid-cols-3 gap-6"
    >
      {/* Controls */}
      <div className="glass rounded-2xl border border-white/[0.06] p-5 space-y-5">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-semibold text-slate-200">Simulasi Penghematan</h3>
        </div>

        {/* Horizon */}
        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-2">
            <span>Horizon Proyeksi</span>
            <span className="text-purple-400 font-medium">{horizon} bulan</span>
          </div>
          <input
            type="range"
            min={1}
            max={12}
            value={horizon}
            onChange={(e) => setHorizon(Number(e.target.value))}
            className="w-full accent-purple-500"
          />
          <div className="flex justify-between text-[10px] text-slate-800 mt-1">
            <span>1 bln</span>
            <span>12 bln</span>
          </div>
        </div>

        {/* Category sliders */}
        <div className="space-y-4">
          <p className="text-xs text-slate-700">Atur target penghematan per kategori (% pengurangan):</p>
          {categories.map((cat) => {
            const pct = adjustments[cat.kategori] ?? 0;
            return (
              <div key={cat.kategori}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: categoryColor(cat.kategori) }} />
                    {cat.kategori}
                  </span>
                  <span className={`font-medium ${pct > 0 ? "text-emerald-400" : "text-slate-800"}`}>
                    {pct > 0 ? `-${pct}%` : "0%"}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={80}
                  step={5}
                  value={pct}
                  onChange={(e) => handleSlider(cat.kategori, Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>
            );
          })}
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleRun}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-all disabled:opacity-50"
        >
          <Play className="w-4 h-4" />
          {loading ? "Menghitung..." : "Jalankan Simulasi"}
        </motion.button>

        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>

      {/* Results */}
      <div className="lg:col-span-2 space-y-4">
        {result ? (
          <>
            {/* Impact summary */}
            <div className="glass rounded-2xl border border-emerald-500/15 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-200">Estimasi Dampak Penghematan</h3>
                <div className={`flex items-center gap-1.5 text-sm font-bold ${totalSaving >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {totalSaving >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {formatRupiah(Math.abs(totalSaving), true)} / {horizon} bln
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Hemat / Bulan", value: result.impact.monthly_saving, suffix: "" },
                    { label: `Total ${horizon} Bulan`, value: result.impact.total_saving, suffix: "" },
                    { label: "Pengurangan", value: result.impact.pct_reduction, suffix: "%" },
                  ].map(({ label, value, suffix }) => (
                    <div key={label} className="bg-white/[0.03] rounded-lg p-3 text-xs text-center">
                      <p className="text-slate-700 mb-1">{label}</p>
                      <p className="text-emerald-400 font-bold text-base">
                        {suffix === "%" ? `${value}%` : formatRupiah(value, true)}
                      </p>
                    </div>
                  ))}
                </div>
            </div>

            {/* Projection chart */}
            <div className="glass rounded-2xl border border-white/[0.06] p-5">
              <h3 className="text-sm font-semibold text-slate-200 mb-4">Proyeksi Saldo Kumulatif</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={result.projection} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="simGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a855f7" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="bulan" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => formatRupiah(v, true)} tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} width={72} />
                  <Tooltip
                    formatter={(val: number) => formatRupiah(val)}
                    contentStyle={{ background: "rgba(10,12,18,0.9)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, fontSize: 12 }}
                  />
                  <Area type="monotone" dataKey="projected_cumulative" name="Saldo" stroke="#a855f7" fill="url(#simGrad)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <div className="glass rounded-2xl border border-white/[0.06] p-12 flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Sliders className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-slate-300 font-medium">Simulasikan masa depan keuangan Anda</p>
              <p className="text-slate-800 text-sm mt-1">Atur slider penghematan lalu klik "Jalankan Simulasi"</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
