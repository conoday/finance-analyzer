"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAnalysis } from "@/hooks/useAnalysis";
import { BudgetTracker } from "@/components/BudgetTracker";
import { SharedBudgetRoom } from "@/components/SharedBudgetRoom";
import { motion } from "framer-motion";
import { Loader2, Wallet } from "lucide-react";

export default function BudgetPage() {
  const { user } = useAuth();
  const { data, status, analyzeMe } = useAnalysis();

  useEffect(() => {
    if (user && status === "idle") analyzeMe();
  }, [user, status, analyzeMe]);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(3,105,161,0.12)" }}>
          <Wallet className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Budget & Shared Room</h1>
          <p className="text-xs text-slate-500">Atur batas pengeluaran & pantau bersama pasangan/grup</p>
        </div>
      </div>

      {status === "loading" && (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-teal-500" /></div>
      )}

      {data && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <BudgetTracker byCategory={data.by_category} />
          <SharedBudgetRoom byCategory={data.by_category} summary={data.summary} />
        </motion.div>
      )}

      {!user && (
        <div className="text-center py-16 text-slate-500">
          <Wallet className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-sm">Masuk untuk mengatur budget keuangan.</p>
        </div>
      )}
    </div>
  );
}
