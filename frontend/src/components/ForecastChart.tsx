"use client";

import {
  ComposedChart, Area, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";
import { formatRupiah } from "@/lib/utils";
import type { TimeseriesRow, ForecastRow } from "@/types";

interface ForecastChartProps {
  timeseries: TimeseriesRow[];
  forecast: ForecastRow[];
}

export function ForecastChart({ timeseries, forecast }: ForecastChartProps) {
  // Merge actual + forecast for display
  const actual = timeseries.map((d) => ({
    date: d.tanggal,
    kumulatif: d.kumulatif,
  }));
  const fc = forecast.map((d) => ({
    date: d.tanggal,
    forecast: d.predicted_kumulatif,
    lower: d.lower,
    upper: d.upper,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="glass-strong rounded-xl p-3 text-xs space-y-1">
        <p className="text-slate-400">{label}</p>
        {payload.map((p: any) => (
          <div key={p.dataKey} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-slate-300">{p.name}:</span>
            <span className="font-mono text-slate-100">{formatRupiah(p.value, true)}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass rounded-2xl p-5 border border-white/[0.06]"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-200">Saldo Kumulatif & Proyeksi</h2>
        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-blue-400 rounded" />Aktual</span>
          <span className="flex items-center gap-1"><span className="w-4 h-0.5 border-t-2 border-dashed border-indigo-400 rounded" />Proyeksi</span>
        </div>
      </div>

      {/* Actual */}
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={actual} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={(v) => formatRupiah(v, true)} tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} width={72} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="kumulatif" name="Saldo" stroke="#3b82f6" fill="url(#actualGrad)" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Forecast */}
      {fc.length > 0 && (
        <div className="mt-4">
          <h3 className="text-xs text-slate-500 mb-2 font-medium">Proyeksi Ke Depan</h3>
          <ResponsiveContainer width="100%" height={180}>
            <ComposedChart data={fc} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="bandGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => formatRupiah(v, true)} tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} width={72} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="upper" name="Batas Atas" stroke="none" fill="url(#bandGrad)" dot={false} legendType="none" />
              <Area type="monotone" dataKey="lower" name="Batas Bawah" stroke="none" fill="#08090e" dot={false} legendType="none" />
              <Line type="monotone" dataKey="forecast" name="Proyeksi" stroke="#6366f1" strokeWidth={2} dot={false} strokeDasharray="5 3" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}
