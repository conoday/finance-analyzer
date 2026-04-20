"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAnalysis } from "@/hooks/useAnalysis";
import { useTransactions } from "@/hooks/useTransactions";
import { TransactionList } from "@/components/TransactionList";
import { TopMerchants } from "@/components/TopMerchants";
import { SubscriptionList } from "@/components/SubscriptionList";
import { SmartInput } from "@/components/SmartInput";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Plus, Receipt } from "lucide-react";

export default function TransaksiPage() {
  const { user } = useAuth();
  const { data, status, analyzeMe } = useAnalysis();
  const { save, deleteOne } = useTransactions();
  const [showSmartInput, setShowSmartInput] = useState(false);
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
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(20,184,166,0.12)" }}>
            <Receipt className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Transaksi</h1>
            <p className="text-xs text-slate-500">Semua riwayat pemasukan & pengeluaran</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
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
          <button
            onClick={() => setShowSmartInput(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white transition-all hover:scale-105"
            style={{ background: "#0f766e" }}
          >
            <Plus className="w-3.5 h-3.5" /> Catat
          </button>
        </div>
      </div>

      {status === "loading" && (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-teal-500" /></div>
      )}

      {data && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <TransactionList
            transactions={data.transactions ?? []}
            onDelete={async (id) => {
              await deleteOne(id);
              await analyzeMe(monthFilter || undefined);
            }}
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <TopMerchants merchants={data.top_merchants} income={data.income_src} />
            <SubscriptionList subs={data.subscriptions} total={data.sub_total_monthly} />
          </div>
        </motion.div>
      )}

      {!user && (
        <div className="text-center py-16 text-slate-500">
          <Receipt className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-sm">Masuk untuk melihat riwayat transaksi lengkap.</p>
        </div>
      )}

      <AnimatePresence>
        {showSmartInput && <SmartInput onClose={() => setShowSmartInput(false)} onSaved={save} />}
      </AnimatePresence>
    </div>
  );
}
