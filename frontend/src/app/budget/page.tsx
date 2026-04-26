"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAnalysis } from "@/hooks/useAnalysis";
import { useDisplayMode } from "@/hooks/useDisplayMode";
import { BudgetTracker } from "@/components/BudgetTracker";
import { SharedBudgetRoom } from "@/components/SharedBudgetRoom";
import { PageHero } from "@/components/PageHero";
import { MotionSection } from "@/components/MotionSection";
import { NumberTicker } from "@/components/ui/NumberTicker";
import { motion } from "framer-motion";
import { Loader2, Wallet } from "lucide-react";
import { cn, formatRupiah } from "@/lib/utils";

export default function BudgetPage() {
  const { user } = useAuth();
  const { data, status, analyzeMe } = useAnalysis();
  const { isShowtime } = useDisplayMode();

  useEffect(() => {
    if (user && status === "idle") analyzeMe();
  }, [user, status, analyzeMe]);

  const [activeTab, setActiveTab] = useState<"personal" | "shared">("personal");

  const totalExpense = data?.summary?.total_expense ?? 0;
  const txCount = data?.summary?.tx_count ?? 0;
  const categoryCount = data?.by_category?.length ?? 0;

  return (
    <div className={cn("space-y-6", isShowtime ? "showtime-surface" : "")}>
      <MotionSection delay={0.02}>
        <PageHero
          icon={Wallet}
          tone="blue"
          badge="Budget"
          title="Budget Personal dan Kolaborasi"
          subtitle="Atur batas pengeluaran, lalu sinkronkan progres dengan room bersama."
          actions={
            <div
              className={cn(
                "grid w-full grid-cols-2 gap-2 rounded-xl p-1 md:w-[300px]",
                isShowtime
                  ? "border border-white/[0.12] bg-white/[0.04]"
                  : "border border-slate-200 bg-white shadow-sm"
              )}
            >
              <button
                onClick={() => setActiveTab("personal")}
                className={cn("rounded-lg px-4 py-2 text-sm font-semibold transition-all", 
                  activeTab === "personal"
                    ? isShowtime
                      ? "bg-emerald-400/20 text-emerald-100 shadow-sm"
                      : "bg-slate-900 text-white shadow-sm"
                    : isShowtime
                      ? "text-slate-300/80 hover:bg-white/[0.08] hover:text-slate-100"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                )}
              >
                Personal
              </button>
              <button
                onClick={() => setActiveTab("shared")}
                className={cn("rounded-lg px-4 py-2 text-sm font-semibold transition-all", 
                  activeTab === "shared"
                    ? isShowtime
                      ? "bg-cyan-400/20 text-cyan-100 shadow-sm"
                      : "bg-slate-900 text-white shadow-sm"
                    : isShowtime
                      ? "text-slate-300/80 hover:bg-white/[0.08] hover:text-slate-100"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                )}
              >
                Shared Room
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
                Pengeluaran Tercatat
              </p>
              <p className={cn("mt-1 text-2xl font-extrabold", isShowtime ? "text-rose-200" : "text-rose-600")}>
                {isShowtime ? (
                  <>
                    <span className="mr-1 align-middle text-base opacity-70">Rp</span>
                    <NumberTicker value={totalExpense} />
                  </>
                ) : (
                  formatRupiah(totalExpense)
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
              <p className={cn("text-[11px] font-semibold uppercase tracking-wide", isShowtime ? "text-slate-300/75" : "text-slate-500")}>Kategori Aktif</p>
              <p className={cn("mt-1 text-2xl font-extrabold", isShowtime ? "text-cyan-200" : "text-sky-600")}>{categoryCount}</p>
            </div>
            <div
              className={cn(
                "rounded-2xl px-4 py-3",
                isShowtime
                  ? "oprex-panel border border-white/[0.12]"
                  : "border border-slate-200/70 bg-white/90 shadow-sm"
              )}
            >
              <p className={cn("text-[11px] font-semibold uppercase tracking-wide", isShowtime ? "text-slate-300/75" : "text-slate-500")}>Jumlah Transaksi</p>
              <p className={cn("mt-1 text-2xl font-extrabold", isShowtime ? "text-emerald-200" : "text-emerald-600")}>{txCount}</p>
            </div>
          </section>
        </MotionSection>
      )}

      {status === "loading" && (
        <div className="flex justify-center py-16"><Loader2 className={cn("h-8 w-8 animate-spin", isShowtime ? "text-cyan-300" : "text-blue-500")} /></div>
      )}

      {data && (
        <MotionSection delay={0.06}>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className={cn(
              "rounded-3xl pt-1",
              isShowtime
                ? "oprex-panel border border-white/[0.12] p-3"
                : ""
            )}
          >
            {activeTab === "personal" && <BudgetTracker byCategory={data.by_category} />}
            {activeTab === "shared" && <SharedBudgetRoom byCategory={data.by_category} summary={data.summary} />}
          </motion.div>
        </MotionSection>
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
            <Wallet className={cn("mx-auto mb-3 h-12 w-12", isShowtime ? "text-slate-400" : "text-slate-300")} />
            <p className="text-sm">Masuk untuk mengatur budget keuangan.</p>
          </div>
        </MotionSection>
      )}
    </div>
  );
}
