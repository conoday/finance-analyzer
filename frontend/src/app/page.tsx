"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { useAnalysis } from "@/hooks/useAnalysis";
import { useTransactions } from "@/hooks/useTransactions";
import { Header } from "@/components/Header";
import { UploadZone } from "@/components/UploadZone";
import { BalanceCard } from "@/components/BalanceCard";
import { KPICards } from "@/components/KPICards";
import { TransactionList } from "@/components/TransactionList";
import { SmartInput } from "@/components/SmartInput";
import { MonthlyChart } from "@/components/MonthlyChart";
import { SpendingWheel } from "@/components/SpendingWheel";
import { ForecastChart } from "@/components/ForecastChart";
import { HealthGauge } from "@/components/HealthGauge";
import { TopMerchants } from "@/components/TopMerchants";
import { SubscriptionList } from "@/components/SubscriptionList";
import { StoryCards } from "@/components/StoryCards";
import { SimulatorPanel } from "@/components/SimulatorPanel";
import { SpendingHeatmap } from "@/components/SpendingHeatmap";
import { SharePanel, DonasiModal } from "@/components/SharePanel";
import { QuickTracker } from "@/components/QuickTracker";
import { BudgetTracker } from "@/components/BudgetTracker";
import { SharedBudgetRoom } from "@/components/SharedBudgetRoom";
import { AssetDebtTracker } from "@/components/AssetDebtTracker";
import { SplitBill } from "@/components/SplitBill";
import { AIPlanner } from "@/components/AIPlanner";
import { Loader2, Zap, Sparkles, BookOpen, Plus } from "lucide-react";

const TABS = [
  { id: "transaksi",  label: "Transaksi" },
  { id: "ringkasan",  label: "Ringkasan" },
  { id: "pengeluaran",label: "Pengeluaran" },
  { id: "budget",     label: "Budget" },
  { id: "shared",     label: "Shared 👥" },
  { id: "forecast",   label: "Forecast" },
  { id: "health",     label: "Health" },
  { id: "simulator",  label: "Simulator" },
  { id: "aset",       label: "Aset & Hutang" },
  { id: "split-bill", label: "Split Bill" },
  { id: "ai-planner", label: "AI Planner ✨" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function Home() {
  const { user } = useAuth();
  const { data, status, error, analyze, analyzeMe, reset } = useAnalysis();
  const { txs, loading: txLoading, save, deleteOne, clear, isCloud } = useTransactions();
  const [activeTab, setActiveTab] = useState<TabId>("transaksi");
  const [showDonasi, setShowDonasi] = useState(false);
  const [showSmartInput, setShowSmartInput] = useState(false);

  // Sync Cloud Data automatically
  useEffect(() => {
    if (user && !data && status === "idle") {
      analyzeMe();
    }
  }, [user, data, status, analyzeMe]);

  // True jika backend mengembalikan empty analysis (0 transaksi)
  const isEmptyCloud = !!(data && (data as any).message && (data.summary?.tx_count === 0 || data.summary?.total_expense === 0));


  return (
    <div className="relative min-h-screen bg-mesh overflow-x-hidden">
      {/* Dot grid overlay */}
      <div className="fixed inset-0 dot-grid pointer-events-none opacity-25" />

      <Header hasData={!!data} onReset={reset} onDonasi={() => setShowDonasi(true)} />

      <main className="relative z-10 max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pb-28">
        <AnimatePresence mode="wait">

          {/* ── Upload / idle ── */}
          {!data && status !== "loading" && (
            <motion.section
              key="upload"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4 }}
              className="pt-10 w-full"
            >
              {/* ── Hero row ── */}
              <div className="flex flex-col items-center text-center gap-2 mb-8">
                <div
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-1"
                  style={{ background: "rgba(20,184,166,0.10)", color: "#0f766e", border: "1px solid rgba(20,184,166,0.22)" }}
                >
                  <Sparkles className="w-3 h-3" />
                  100% gratis &middot; Data tidak dikirim ke server
                </div>
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight" style={{ color: "#0f172a" }}>
                  Oprex<span style={{ color: "#0f766e" }}>Duit</span>
                </h1>
                <p className="text-slate-500 text-base max-w-md leading-relaxed">
                  Catat pengeluaran harian, analisis mutasi bank, dan pantau kesehatan keuanganmu.
                </p>
              </div>

              {/* ── Main layout: 2 column on desktop ── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">

                {/* ── Left: Upload ── */}
                <div className="space-y-4">
                  {/* Upload card */}
                  <div className="rounded-2xl p-5 space-y-3" style={{ background: "#ffffff", border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(20,184,166,0.12)" }}>
                        <Plus className="w-4 h-4 text-teal-600" />
                      </div>
                      <p className="text-sm font-semibold text-slate-700">Analisis Mutasi Bank</p>
                    </div>
                    <UploadZone onFile={analyze} />
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {["BCA", "Mandiri", "BRI", "BNI", "GoPay", "OVO", "Dana"].map((b) => (
                        <span key={b} className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: "#f1f5f9", color: "#475569" }}>{b}</span>
                      ))}
                    </div>
                  </div>

                  {/* Preview KPI strip (teaser) */}
                  <div className="rounded-2xl p-4 space-y-3" style={{ background: "linear-gradient(135deg, rgba(20,184,166,0.09) 0%, rgba(139,92,246,0.06) 100%)", border: "1px solid rgba(20,184,166,0.18)" }}>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Setelah upload, kamu akan lihat</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: "Arus Kas Bersih", value: "Rp —", sub: "bulan ini", color: "#0f766e" },
                        { label: "Total Pengeluaran", value: "Rp —", sub: "per bulan", color: "#e11d48" },
                        { label: "Savings Rate", value: "—%", sub: "target 20%", color: "#7c3aed" },
                        { label: "Langganan", value: "Rp —", sub: "estimasi tetap", color: "#0369a1" },
                      ].map((kpi) => (
                        <div key={kpi.label} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.75)", border: "1px solid rgba(255,255,255,0.8)" }}>
                          <p className="text-[10px] text-slate-500 leading-tight">{kpi.label}</p>
                          <p className="text-sm font-bold font-mono mt-0.5" style={{ color: kpi.color }}>{kpi.value}</p>
                          <p className="text-[9px] text-slate-400">{kpi.sub}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ── Right: Quick Tracker ── */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <BookOpen className="w-4 h-4 text-teal-600" />
                      Catatan Manual
                    </div>
                    <button
                      onClick={() => setShowSmartInput(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                      style={{ background: "rgba(20,184,166,0.10)", color: "#0f766e", border: "1px solid rgba(20,184,166,0.22)" }}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      Catat Cepat
                    </button>
                  </div>
                  <QuickTracker
                    txs={txs}
                    onAddNew={() => setShowSmartInput(true)}
                    onDelete={deleteOne}
                    onClear={clear}
                    isCloud={isCloud}
                    loading={txLoading}
                  />
                </div>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-6 text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-2 rounded-lg max-w-md mx-auto text-center"
                >
                  {error}
                </motion.p>
              )}

              {/* ── Shared Budget Room (accessible before upload) ── */}
              <div className="mt-8 max-w-5xl mx-auto">
                <SharedBudgetRoom byCategory={undefined} summary={undefined} />
              </div>
            </motion.section>
          )}

          {/* ── Loading ── */}
          {status === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center pt-48 gap-6"
            >
              <div className="relative">
                <div
                  className="w-16 h-16 rounded-full border-2 animate-ping absolute inset-0"
                  style={{ borderColor: "rgba(20,184,166,0.30)" }}
                />
                <Loader2 className="w-16 h-16 animate-spin" style={{ color: "#14b8a6" }} />
              </div>
              <p className="text-slate-500 text-lg animate-pulse">Menganalisis transaksi Anda…</p>
            </motion.div>
          )}

          {/* ── Dashboard ── */}
          {data && status === "success" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="pt-6 space-y-5"
            >
              {/* Empty state — user baru, belum ada transaksi */}
              {isEmptyCloud ? (
                <div className="text-center py-16 px-4">
                  <div className="text-5xl mb-4">📝</div>
                  <h2 className="text-xl font-semibold text-slate-800">Belum ada transaksi</h2>
                  <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
                    Catat pengeluaran pertamamu lewat Telegram atau form catat cepat di bawah, lalu kembali ke sini untuk melihat dashboard analisismu.
                  </p>
                  <button
                    onClick={reset}
                    className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
                    style={{ background: "#0f766e" }}
                  >
                    Mulai Catat
                  </button>
                </div>
              ) : (
              <>
              {/* Greeting */}
              <div>
                <h2 className="text-xl font-semibold text-slate-800">
                  Hei! 👋 Berikut ringkasan keuanganmu.
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">{data.summary.date_range}</p>
              </div>

              {/* Hero: BalanceCard */}
              <BalanceCard summary={data.summary} timeseries={data.timeseries} />

              {/* Secondary KPI strip */}
              <KPICards summary={data.summary} subTotal={data.sub_total_monthly} />

              {/* Tab bar */}
              <div className="flex gap-0.5 glass rounded-xl p-1 w-full overflow-x-auto scrollbar-none">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`tab-pill flex-1 sm:flex-none ${activeTab === tab.id ? "active" : ""}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab panels */}
              <AnimatePresence mode="wait">
                {activeTab === "transaksi" && (
                  <TabPanel key="transaksi">
                    <TransactionList transactions={data.transactions ?? []} />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-2">
                      <TopMerchants merchants={data.top_merchants} income={data.income_src} />
                      <SubscriptionList subs={data.subscriptions} total={data.sub_total_monthly} />
                    </div>
                  </TabPanel>
                )}

                {activeTab === "ringkasan" && (
                  <TabPanel key="ringkasan">
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                      <div className="xl:col-span-2">
                        <MonthlyChart data={data.monthly} />
                      </div>
                      <SpendingWheel data={data.by_category} />
                    </div>
                    <SpendingHeatmap timeseries={data.timeseries} />
                  </TabPanel>
                )}

                {activeTab === "pengeluaran" && (
                  <TabPanel key="pengeluaran">
                    <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
                      <div className="xl:col-span-3">
                        <MonthlyChart data={data.monthly} />
                      </div>
                      <div className="xl:col-span-2">
                        <SpendingWheel data={data.by_category} />
                      </div>
                    </div>
                    <StoryCards stories={data.monthly_stories} overall={data.overall_story} />
                  </TabPanel>
                )}

                {activeTab === "budget" && (
                  <TabPanel key="budget">
                    <BudgetTracker byCategory={data.by_category} />
                  </TabPanel>
                )}

                {activeTab === "shared" && (
                  <TabPanel key="shared">
                    <SharedBudgetRoom
                      byCategory={data.by_category}
                      summary={data.summary}
                    />
                  </TabPanel>
                )}

                {activeTab === "forecast" && (
                  <TabPanel key="forecast">
                    <ForecastChart timeseries={data.timeseries} forecast={data.forecast} />
                  </TabPanel>
                )}

                {activeTab === "health" && (
                  <TabPanel key="health">
                    <HealthGauge report={data.health_report} />
                  </TabPanel>
                )}

                {activeTab === "simulator" && (
                  <TabPanel key="simulator">
                    <SimulatorPanel data={data} />
                  </TabPanel>
                )}

                {activeTab === "aset" && (
                  <TabPanel key="aset">
                    <AssetDebtTracker />
                  </TabPanel>
                )}

                {activeTab === "split-bill" && (
                  <TabPanel key="split-bill">
                    <SplitBill />
                  </TabPanel>
                )}

                {activeTab === "ai-planner" && (
                  <TabPanel key="ai-planner">
                    <AIPlanner
                      prefillIncome={data.summary.total_income}
                      prefillExpense={data.summary.total_expense}
                    />
                  </TabPanel>
                )}
              </AnimatePresence>

              {/* Share panel (floating bottom center) */}
              <SharePanel data={data} onDonasi={() => setShowDonasi(true)} />
              </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Donation modal */}
        <AnimatePresence>
          {showDonasi && <DonasiModal onClose={() => setShowDonasi(false)} />}
        </AnimatePresence>
      </main>

      {/* ── FAB: Catat Cepat (always visible) ── */}
      <motion.button
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, type: "spring" }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.93 }}
        onClick={() => setShowSmartInput(true)}
        className="fixed bottom-24 right-5 sm:right-8 z-40 w-14 h-14 rounded-full flex items-center justify-center btn-fab shadow-xl"
        style={{ background: "linear-gradient(135deg, #14b8a6, #0ea5e9)" }}
        title="Catat Cepat"
      >
        <Plus className="w-6 h-6 text-white" />
      </motion.button>

      {/* Smart Input modal */}
      <AnimatePresence>
        {showSmartInput && (
          <SmartInput
            onClose={() => setShowSmartInput(false)}
            onSaved={save}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function TabPanel({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="space-y-5"
    >
      {children}
    </motion.div>
  );
}

