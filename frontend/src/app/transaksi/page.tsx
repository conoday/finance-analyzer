"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAnalysis } from "@/hooks/useAnalysis";
import { useTransactions } from "@/hooks/useTransactions";
import { useDisplayMode } from "@/hooks/useDisplayMode";
import { TransactionList } from "@/components/TransactionList";
import { TopMerchants } from "@/components/TopMerchants";
import { SubscriptionList } from "@/components/SubscriptionList";
import { SmartInput } from "@/components/SmartInput";
import { PageHero } from "@/components/PageHero";
import { MotionSection } from "@/components/MotionSection";
import { NumberTicker } from "@/components/ui/NumberTicker";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Plus, Receipt } from "lucide-react";
import { cn, formatRupiah } from "@/lib/utils";

export default function TransaksiPage() {
  const { user } = useAuth();
  const { data, status, analyzeMe } = useAnalysis();
  const { save, deleteOne } = useTransactions();
  const { isShowtime } = useDisplayMode();
  const [showSmartInput, setShowSmartInput] = useState(false);
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const [monthFilter, setMonthFilter] = useState<string>(currentMonthStr);

  const txCount = data?.summary?.tx_count ?? 0;
  const income = data?.summary?.total_income ?? 0;
  const expense = data?.summary?.total_expense ?? 0;

  useEffect(() => {
    if (user && status === "idle") analyzeMe(monthFilter);
  }, [user, status, analyzeMe, monthFilter]);

  return (
    <div className={cn("space-y-6", isShowtime ? "showtime-surface" : "")}>
      <MotionSection delay={0.02}>
        <PageHero
          icon={Receipt}
          tone="teal"
          badge="Transactions"
          title="Pusat Transaksi Harian"
          subtitle="Lacak arus pemasukan dan pengeluaran dengan timeline yang lebih jelas."
          actions={
            <div className="flex flex-wrap items-center gap-2 md:justify-end">
              <div
                className={cn(
                  "flex items-center gap-2 rounded-xl px-2.5 py-2",
                  isShowtime
                    ? "border border-white/[0.12] bg-white/[0.04]"
                    : "border border-slate-200 bg-white shadow-sm"
                )}
              >
                <span className={cn("text-[11px] font-semibold uppercase tracking-wide", isShowtime ? "text-slate-300/75" : "text-slate-500")}>
                  Periode
                </span>
                <input
                  type="month"
                  value={monthFilter}
                  onChange={(e) => {
                    setMonthFilter(e.target.value);
                    analyzeMe(e.target.value || undefined);
                  }}
                  className={cn("bg-transparent text-sm font-semibold outline-none", isShowtime ? "text-slate-100" : "text-slate-700")}
                />
              </div>
              {monthFilter && (
                <button
                  onClick={() => {
                    setMonthFilter("");
                    analyzeMe();
                  }}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-xs font-semibold transition",
                    isShowtime
                      ? "border-white/[0.12] bg-white/[0.04] text-slate-200 hover:border-emerald-300/60 hover:text-emerald-100"
                      : "border-slate-200 bg-white text-slate-600 hover:border-teal-200 hover:text-teal-700"
                  )}
                >
                  Semua
                </button>
              )}
              <button
                onClick={() => setShowSmartInput(true)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-white transition",
                  isShowtime ? "bg-emerald-500 hover:bg-emerald-400" : "bg-teal-600 hover:bg-teal-500"
                )}
              >
                <Plus className="h-3.5 w-3.5" />
                Catat Cepat
              </button>
            </div>
          }
        />
      </MotionSection>

      {data && (
        <MotionSection delay={0.04}>
          <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div
              className={cn(
                "rounded-2xl px-4 py-3",
                isShowtime
                  ? "oprex-panel border border-white/[0.12]"
                  : "border border-slate-200/70 bg-white/90 shadow-sm"
              )}
            >
              <p className={cn("text-[11px] font-semibold uppercase tracking-wide", isShowtime ? "text-slate-300/75" : "text-slate-500")}>
                Total Transaksi
              </p>
              <p className={cn("mt-1 text-2xl font-extrabold", isShowtime ? "text-slate-100" : "text-slate-900")}>{txCount}</p>
            </div>
            <div
              className={cn(
                "rounded-2xl px-4 py-3",
                isShowtime
                  ? "oprex-panel border border-white/[0.12]"
                  : "border border-slate-200/70 bg-white/90 shadow-sm"
              )}
            >
              <p className={cn("text-[11px] font-semibold uppercase tracking-wide", isShowtime ? "text-slate-300/75" : "text-slate-500")}>
                Pemasukan
              </p>
              <p className={cn("mt-1 text-2xl font-extrabold", isShowtime ? "text-emerald-200" : "text-emerald-600")}>
                {isShowtime ? (
                  <>
                    <span className="mr-1 align-middle text-base opacity-70">Rp</span>
                    <NumberTicker value={income} />
                  </>
                ) : (
                  formatRupiah(income)
                )}
              </p>
            </div>
            <div
              className={cn(
                "rounded-2xl px-4 py-3",
                isShowtime
                  ? "oprex-panel border border-white/[0.12]"
                  : "border border-slate-200/70 bg-white/90 shadow-sm"
              )}
            >
              <p className={cn("text-[11px] font-semibold uppercase tracking-wide", isShowtime ? "text-slate-300/75" : "text-slate-500")}>
                Pengeluaran
              </p>
              <p className={cn("mt-1 text-2xl font-extrabold", isShowtime ? "text-rose-200" : "text-rose-600")}>
                {isShowtime ? (
                  <>
                    <span className="mr-1 align-middle text-base opacity-70">Rp</span>
                    <NumberTicker value={expense} />
                  </>
                ) : (
                  formatRupiah(expense)
                )}
              </p>
            </div>
          </section>
        </MotionSection>
      )}

      {status === "loading" && (
        <div className="flex justify-center py-16"><Loader2 className={cn("h-8 w-8 animate-spin", isShowtime ? "text-emerald-300" : "text-teal-500")} /></div>
      )}

      {data && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <MotionSection delay={0.05}>
            <div
              className={cn(
                "rounded-3xl p-4",
                isShowtime
                  ? "oprex-panel border border-white/[0.12]"
                  : "border border-slate-200/70 bg-white/90 shadow-[0_12px_32px_rgba(15,23,42,0.06)]"
              )}
            >
              <TransactionList
                transactions={data.transactions ?? []}
                onDelete={async (id) => {
                  await deleteOne(id);
                  await analyzeMe(monthFilter || undefined);
                }}
              />
            </div>
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
          <div
            className={cn(
              "rounded-2xl py-16 text-center",
              isShowtime
                ? "border border-white/[0.12] bg-white/[0.04] text-slate-200"
                : "border border-slate-200 bg-white/85 text-slate-500"
            )}
          >
            <Receipt className={cn("mx-auto mb-3 h-12 w-12", isShowtime ? "text-slate-400" : "text-slate-300")} />
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
