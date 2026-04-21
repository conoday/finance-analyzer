"use client";

import { useEffect, useState } from "react";
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

  const [activeTab, setActiveTab] = useState<"personal" | "shared">("personal");

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(3,105,161,0.12)" }}>
            <Wallet className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Budget & Kolaborasi</h1>
            <p className="text-sm text-slate-500">Atur batas pengeluaran & pantau bersama grup</p>
          </div>
        </div>
        
        {/* Toggle / Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab("personal")}
            className={`flex-1 sm:flex-none px-6 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === "personal" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Personal
          </button>
          <button
            onClick={() => setActiveTab("shared")}
            className={`flex-1 sm:flex-none px-6 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === "shared" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Shared Room
          </button>
        </div>
      </div>

      {status === "loading" && (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
      )}

      {data && (
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="pt-2"
        >
          {activeTab === "personal" && <BudgetTracker byCategory={data.by_category} />}
          {activeTab === "shared" && <SharedBudgetRoom byCategory={data.by_category} summary={data.summary} />}
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
