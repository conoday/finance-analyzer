"use client";

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import { motion } from "framer-motion";
import { formatRupiah } from "@/lib/utils";
import type { MonthlyRow } from "@/types";

interface MonthlyChartProps {
  data: MonthlyRow[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong rounded-xl p-3 text-xs space-y-1.5 min-w-[180px]">
      <p className="text-slate-400 mb-2 font-medium">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5" style={{ color: p.color }}>
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            {p.name}
          </span>
          <span className="font-mono text-slate-200">{formatRupiah(p.value, true)}</span>
        </div>
      ))}
    </div>
  );
};

export function MonthlyChart({ data }: MonthlyChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="glass rounded-2xl p-5 border border-white/[0.06]"
    >
      <h2 className="text-sm font-semibold text-slate-200 mb-4">Tren Bulanan</h2>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="periode" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={(v) => formatRupiah(v, true)} tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} width={70} />
          <Tooltip content={<CustomTooltip />} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
          <Area type="monotone" dataKey="income" name="Pemasukan" stroke="#22c55e" fill="url(#incomeGrad)" strokeWidth={2} dot={false} />
          <Area type="monotone" dataKey="expense" name="Pengeluaran" stroke="#ef4444" fill="url(#expenseGrad)" strokeWidth={2} dot={false} />
          <Area type="monotone" dataKey="net" name="Net" stroke="#3b82f6" fill="url(#netGrad)" strokeWidth={2} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
