"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { motion } from "framer-motion";
import { formatRupiah, categoryColor } from "@/lib/utils";
import type { CategoryRow } from "@/types";

interface SpendingWheelProps {
  data: CategoryRow[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as CategoryRow;
  return (
    <div className="glass-strong rounded-xl p-3 text-xs min-w-[160px]">
      <p className="font-medium text-slate-700 mb-1">{d.kategori}</p>
      <p className="text-slate-400">{formatRupiah(d.total)}</p>
      <p className="text-slate-700">{d.pct.toFixed(1)}% of total</p>
    </div>
  );
};

const RADIAN = Math.PI / 180;
const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, pct }: any) => {
  if (pct < 5) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight="600">
      {pct.toFixed(0)}%
    </text>
  );
};

export function SpendingWheel({ data }: SpendingWheelProps) {
  const top = data.slice(0, 8);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="glass rounded-2xl p-5 border border-white/[0.06] flex flex-col"
    >
      <h2 className="text-sm font-semibold text-slate-700 mb-4">Distribusi Pengeluaran</h2>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={top}
            dataKey="total"
            nameKey="kategori"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={2}
            labelLine={false}
            label={renderLabel}
          >
            {top.map((row) => (
              <Cell key={row.kategori} fill={categoryColor(row.kategori)} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => <span style={{ color: "#475569", fontSize: 11 }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Top 3 list */}
      <div className="space-y-2 mt-2">
        {top.slice(0, 3).map((row, i) => (
          <div key={row.kategori} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: categoryColor(row.kategori) }}
              />
              <span className="text-slate-800">{row.kategori}</span>
            </div>
            <span className="text-slate-700 font-mono">{formatRupiah(row.total, true)}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
