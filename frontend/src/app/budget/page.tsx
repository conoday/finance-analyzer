"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAnalysis } from "@/hooks/useAnalysis";
import { BudgetTracker } from "@/components/BudgetTracker";
import { SharedBudgetRoom } from "@/components/SharedBudgetRoom";
import { PageHero } from "@/components/PageHero";
import { MotionSection } from "@/components/MotionSection";
import { motion } from "framer-motion";
import { Loader2, Wallet } from "lucide-react";

export default function BudgetPage() {
  const { user } = useAuth();
  const { data, status, analyzeMe } = useAnalysis();

  useEffect(() => {
    if (user && status === "idle") analyzeMe();
  }, [user, status, analyzeMe]);

  const [activeTab, setActiveTab] = useState<"personal" | "shared">("personal");

  return (
    <div className="space-y-6">
      <MotionSection delay={0.02}>
        <PageHero
          icon={Wallet}
          tone="blue"
          badge="Budget"
          title="Budget Personal dan Kolaborasi"
          subtitle="Atur batas pengeluaran, lalu sinkronkan progres dengan room bersama."
          actions={
            <div className="grid w-full grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-white p-1 shadow-sm md:w-[300px]">
              <button
                onClick={() => setActiveTab("personal")}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                  activeTab === "personal"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                }`}
              >
                Personal
              </button>
              <button
                onClick={() => setActiveTab("shared")}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                  activeTab === "shared"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                }`}
              >
                Shared Room
              </button>
            </div>
          }
        />
      </MotionSection>

      {status === "loading" && (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
      )}

      {data && (
        <MotionSection delay={0.06}>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="pt-1"
          >
            {activeTab === "personal" && <BudgetTracker byCategory={data.by_category} />}
            {activeTab === "shared" && <SharedBudgetRoom byCategory={data.by_category} summary={data.summary} />}
          </motion.div>
        </MotionSection>
      )}

      {!user && (
        <MotionSection delay={0.1}>
          <div className="rounded-2xl border border-slate-200 bg-white/85 py-16 text-center text-slate-500">
            <Wallet className="mx-auto mb-3 h-12 w-12 text-slate-300" />
            <p className="text-sm">Masuk untuk mengatur budget keuangan.</p>
          </div>
        </MotionSection>
      )}
    </div>
  );
}
