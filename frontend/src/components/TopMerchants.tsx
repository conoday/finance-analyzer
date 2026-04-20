"use client";

import { motion } from "framer-motion";
import { Store, ArrowDownLeft } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import type { MerchantRow, IncomeSrcRow } from "@/types";

interface TopMerchantsProps {
  merchants: MerchantRow[];
  income: IncomeSrcRow[];
}

export function TopMerchants({ merchants, income }: TopMerchantsProps) {
  const top = merchants.slice(0, 6);
  const topInc = income.slice(0, 4);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="glass rounded-2xl border border-white/[0.06] p-5 space-y-5"
    >
      {/* Merchants */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Store className="w-4 h-4 text-orange-400" />
          <h3 className="text-sm font-semibold text-slate-700">Top Merchant</h3>
        </div>
        <div className="space-y-2">
          {top.map((m, i) => {
            const maxVal = top[0]?.total_debit || 1;
            return (
              <div key={m.deskripsi} className="relative">
                <div
                  className="absolute inset-y-0 left-0 bg-orange-500/8 rounded-lg transition-all"
                  style={{ width: `${(m.total_debit / maxVal) * 100}%` }}
                />
                <div className="relative flex items-center justify-between px-3 py-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-800 w-4">{i + 1}</span>
                    <span className="text-slate-700 truncate max-w-[160px]">{m.deskripsi}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-orange-600 font-mono">{formatRupiah(m.total_debit, true)}</div>
                    <div className="text-[10px] text-slate-800">{m.jumlah_transaksi}x</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Income sources */}
      {topInc.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-slate-700">Sumber Pemasukan</h3>
          </div>
          <div className="space-y-2">
            {topInc.map((s) => (
              <div key={s.deskripsi} className="flex items-center justify-between text-xs px-1">
                <span className="text-slate-800 truncate max-w-[180px]">{s.deskripsi}</span>
                <span className="text-emerald-600 font-mono">{formatRupiah(s.total_kredit, true)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
