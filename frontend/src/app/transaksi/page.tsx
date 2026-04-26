"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAnalysis } from "@/hooks/useAnalysis";
import { useTransactions } from "@/hooks/useTransactions";
import { TransactionList } from "@/components/TransactionList";
import { TopMerchants } from "@/components/TopMerchants";
import { SubscriptionList } from "@/components/SubscriptionList";
import { SmartInput } from "@/components/SmartInput";
import { PageHero } from "@/components/PageHero";
import { MotionSection } from "@/components/MotionSection";
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
    <div className="space-y-6">
      <MotionSection delay={0.02}>
        <PageHero
          icon={Receipt}
          tone="teal"
          badge="Transactions"
          title="Pusat Transaksi Harian"
          subtitle="Lacak arus pemasukan dan pengeluaran dengan timeline yang lebih jelas."
          actions={
            <div className="flex flex-wrap items-center gap-2 md:justify-end">
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-2 shadow-sm">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Periode</span>
                <input
                  type="month"
                  value={monthFilter}
                  onChange={(e) => {
                    setMonthFilter(e.target.value);
                    analyzeMe(e.target.value || undefined);
                  }}
                  className="bg-transparent text-sm font-semibold text-slate-700 outline-none"
                />
              </div>
              {monthFilter && (
                <button
                  onClick={() => {
                    setMonthFilter("");
                    analyzeMe();
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-teal-200 hover:text-teal-700"
                >
                  Semua
                </button>
              )}
              <button
                onClick={() => setShowSmartInput(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-teal-500"
              >
                <Plus className="h-3.5 w-3.5" />
                Catat Cepat
              </button>
            </div>
          }
        />
      </MotionSection>

      {status === "loading" && (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-teal-500" /></div>
      )}

      {data && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <MotionSection delay={0.05}>
            <TransactionList
              transactions={data.transactions ?? []}
              onDelete={async (id) => {
                await deleteOne(id);
                await analyzeMe(monthFilter || undefined);
              }}
            />
          </MotionSection>

          <MotionSection delay={0.07}>
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <TopMerchants merchants={data.top_merchants} income={data.income_src} />
              <SubscriptionList subs={data.subscriptions} total={data.sub_total_monthly} />
            </div>
          </MotionSection>
        </motion.div>
      )}

      {!user && (
        <MotionSection delay={0.1}>
          <div className="rounded-2xl border border-slate-200 bg-white/85 py-16 text-center text-slate-500">
            <Receipt className="mx-auto mb-3 h-12 w-12 text-slate-300" />
            <p className="text-sm">Masuk untuk melihat riwayat transaksi lengkap.</p>
          </div>
        </MotionSection>
      )}

      <AnimatePresence>
        {showSmartInput && <SmartInput onClose={() => setShowSmartInput(false)} onSaved={save} />}
      </AnimatePresence>
    </div>
  );
}
