"use client";

import { motion } from "framer-motion";
import { gradeColor } from "@/lib/utils";
import type { HealthReport } from "@/types";

interface HealthGaugeProps {
  report: HealthReport | null;
}

export function HealthGauge({ report }: HealthGaugeProps) {
  if (!report) {
    return (
      <div className="glass rounded-2xl border border-white/[0.06] p-12 flex items-center justify-center">
        <p className="text-slate-500 text-sm">Health score tidak tersedia.</p>
      </div>
    );
  }
  const score = report.overall;
  const circumference = 2 * Math.PI * 60;
  const offset = circumference * (1 - score / 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="grid grid-cols-1 lg:grid-cols-3 gap-6"
    >
      {/* Score circle */}
      <div className="glass rounded-2xl border border-white/[0.06] p-8 flex flex-col items-center gap-4">
        <h2 className="text-sm font-semibold text-slate-700">Financial Health Score</h2>
        <div className="relative w-40 h-40">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
            {/* Background ring */}
            <circle cx="70" cy="70" r="60" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
            {/* Score arc */}
            <motion.circle
              cx="70" cy="70" r="60"
              fill="none"
              stroke={score >= 70 ? "#22c55e" : score >= 50 ? "#eab308" : "#ef4444"}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className={`text-4xl font-bold ${gradeColor(report.grade)}`}
            >
              {report.grade}
            </motion.span>
            <span className="text-sm text-slate-500">{score.toFixed(0)}/100</span>
          </div>
        </div>
        <p className="text-center text-slate-700 text-sm font-medium">{report.headline}</p>
      </div>

      {/* Dimensions */}
      <div className="glass rounded-2xl border border-white/[0.06] p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Dimensi Kesehatan</h3>
        <div className="space-y-3">
          {report.dimensions.map((dim) => (
            <div key={dim.name} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">{dim.name}</span>
                <span className={`font-medium ${dim.score >= 70 ? "text-emerald-400" : dim.score >= 50 ? "text-yellow-400" : "text-red-400"}`}>
                  {dim.score.toFixed(0)}
                </span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${dim.score}%` }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className={`h-full rounded-full ${dim.score >= 70 ? "bg-emerald-400" : dim.score >= 50 ? "bg-yellow-400" : "bg-red-400"}`}
                />
              </div>
              <p className="text-[11px] text-slate-600">{dim.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="glass rounded-2xl border border-white/[0.06] p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Saran Perbaikan</h3>
        <ul className="space-y-3">
          {report.tips.map((tip, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-start gap-2 text-xs text-slate-400"
            >
              <span className="mt-0.5 w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">
                {i + 1}
              </span>
              {tip}
            </motion.li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}
