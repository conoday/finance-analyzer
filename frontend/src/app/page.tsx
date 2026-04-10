"use client";

import { useState } from "react";
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
import { Loader2, Zap, Sparkles, BookOpen, Plus } from "lucide-react";

const TABS = [
  { id: "transaksi",  label: "Transaksi" },
  { id: "ringkasan",  label: "Ringkasan" },
  { id: "pengeluaran",label: "Pengeluaran" },
  { id: "forecast",   label: "Forecast" },
  { id: "health",     label: "Health" },
  { id: "simulator",  label: "Simulator" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function Home() {
  const { data, status, error, analyze, reset } = useAnalysis();
  const { txs, loading: txLoading, save, deleteOne, clear, isCloud } = useTransactions();
  const [activeTab, setActiveTab] = useState<TabId>("transaksi");
  const [showDonasi, setShowDonasi] = useState(false);
  const [showSmartInput, setShowSmartInput] = useState(false);

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
              className="flex flex-col items-center justify-center pt-16 gap-8"
            >
              <div className="text-center space-y-4 max-w-xl">
                <div
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs mb-2"
                  style={{ color: "#2dd4bf", border: "1px solid rgba(20,184,166,0.20)" }}
                >
                  <Sparkles className="w-3 h-3" />
                  100% gratis · Data tidak dikirim ke server · Tidak perlu daftar
                </div>

                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gradient-teal">
                  OprexDuit
                </h1>
                <p className="text-slate-400 text-base max-w-md mx-auto leading-relaxed">
                  Catat pengeluaran harian, analisis mutasi bank, dan pantau
                  kesehatan keuanganmu dalam satu tempat.
                </p>
                <div className="flex items-center justify-center gap-3 pt-1 text-xs text-slate-600 flex-wrap">
                  <span>CSV / Excel / PDF</span>
                  <span className="text-slate-700">·</span>
                  <span>BCA · Mandiri · BRI · BNI</span>
                  <span className="text-slate-700">·</span>
                  <span>GoPay · OVO · Dana</span>
                </div>
              </div>

              <UploadZone onFile={analyze} />

              {/* Quick tracker — always show manual transactions */}
              <div className="w-full max-w-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
                    <BookOpen className="w-4 h-4" />
                    Catatan Manual
                  </div>
                  <button
                    onClick={() => setShowSmartInput(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    style={{ background: "rgba(20,184,166,0.10)", color: "#2dd4bf", border: "1px solid rgba(20,184,166,0.18)" }}
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

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-400 text-sm bg-red-950/40 border border-red-800/50 px-4 py-2 rounded-lg max-w-md text-center"
                >
                  {error}
                </motion.p>
              )}
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
              <p className="text-slate-400 text-lg animate-pulse">Menganalisis transaksi Anda…</p>
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
              {/* Greeting */}
              <div>
                <h2 className="text-xl font-semibold text-slate-100">
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
              </AnimatePresence>

              {/* Share panel (floating bottom center) */}
              <SharePanel data={data} onDonasi={() => setShowDonasi(true)} />
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

