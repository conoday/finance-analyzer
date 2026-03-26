"use client";

import { motion } from "framer-motion";
import { RefreshCw, AlertCircle } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import type { SubscriptionRow } from "@/types";

interface SubscriptionListProps {
  subs: SubscriptionRow[];
  total: number;
}

const FREQ_BADGE: Record<string, string> = {
  bulanan: "bg-blue-500/15 text-blue-400",
  mingguan: "bg-purple-500/15 text-purple-400",
  harian: "bg-orange-500/15 text-orange-400",
};

export function SubscriptionList({ subs, total }: SubscriptionListProps) {
  if (!subs || subs.length === 0) {
    return (
      <div className="glass rounded-2xl border border-white/[0.06] p-5 flex items-center justify-center">
        <p className="text-slate-600 text-sm">Tidak ada langganan terdeteksi.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="glass rounded-2xl border border-white/[0.06] p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-slate-200">Langganan Terdeteksi</h3>
        </div>
        <div className="text-xs text-slate-500">
          Total: <span className="text-cyan-400 font-mono">{formatRupiah(total, true)}/bln</span>
        </div>
      </div>

      <div className="space-y-2">
        {subs.slice(0, 6).map((sub, i) => (
          <motion.div
            key={sub.merchant}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {sub.is_known_sub && (
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-xs text-slate-300 truncate">{sub.merchant}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${FREQ_BADGE[sub.frekuensi] ?? "bg-slate-700 text-slate-400"}`}>
                    {sub.frekuensi}
                  </span>
                  <span className="text-[10px] text-slate-600">{sub.confidence}% konfiden</span>
                </div>
              </div>
            </div>
            <div className="text-right ml-3">
              <p className="text-xs text-cyan-400 font-mono">{formatRupiah(sub.estimated_monthly, true)}</p>
              <p className="text-[10px] text-slate-600">/bulan</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
