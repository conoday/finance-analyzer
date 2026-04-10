"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAnalysis } from "@/hooks/useAnalysis";
import { Header } from "@/components/Header";
import { UploadZone } from "@/components/UploadZone";
import { KPICards } from "@/components/KPICards";
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
import { Loader2, FileUp, Zap } from "lucide-react";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "aktivitas", label: "Aktivitas" },
  { id: "spending", label: "Pengeluaran" },
  { id: "forecast", label: "Forecast" },
  { id: "health", label: "Health" },
  { id: "simulator", label: "Simulator" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function Home() {
  const { data, status, error, analyze, reset } = useAnalysis();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [showDonasi, setShowDonasi] = useState(false);

  return (
    <div className="relative min-h-screen bg-mesh overflow-x-hidden">
      {/* Dot grid overlay */}
      <div className="fixed inset-0 dot-grid pointer-events-none opacity-30" />

      <Header hasData={!!data} onReset={reset} onDonasi={() => setShowDonasi(true)} />

      <main className="relative z-10 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pb-28">
        <AnimatePresence mode="wait">
          {/* ── Upload / idle state ── */}
          {!data && status !== "loading" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center justify-center pt-20 gap-8"
            >
              {/* Hero */}
              <div className="text-center space-y-4 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-amber-500/20 text-xs text-amber-400/80 mb-2">
                  <Zap className="w-3 h-3" />
                  100% gratis · Tidak perlu daftar · Data tidak dikirim ke server
                </div>
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gradient-warm">
                  Finance Analyzer
                </h1>
                <p className="text-slate-400 text-base max-w-md mx-auto leading-relaxed">
                  Upload mutasi rekening CSV/Excel dan dapatkan insight mendalam — heatmap pengeluaran,
                  skor kesehatan keuangan, prediksi, dan laporan siap kirim ke WhatsApp.
                </p>
                <div className="flex items-center justify-center gap-4 pt-1 text-xs text-slate-600">
                  <span className="flex items-center gap-1.5"><FileUp className="w-3 h-3" /> CSV / Excel / PDF</span>
                  <span>·</span>
                  <span>BCA · Mandiri · BRI · BNI · GoPay · OVO</span>
                </div>
              </div>

              <UploadZone onFile={analyze} />

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-400 text-sm bg-red-950/40 border border-red-800/50 px-4 py-2 rounded-lg max-w-md text-center"
                >
                  {error}
                </motion.p>
              )}
            </motion.div>
          )}

          {/* ── Loading state ── */}
          {status === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center pt-48 gap-6"
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-2 border-amber-500/30 animate-ping absolute inset-0" />
                <Loader2 className="w-16 h-16 text-amber-400 animate-spin" />
              </div>
              <p className="text-slate-400 text-lg animate-pulse">Menganalisis transaksi Anda...</p>
            </motion.div>
          )}

          {/* ── Dashboard ── */}
          {data && status === "success" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="pt-8 space-y-5"
            >
              {/* KPI strip */}
              <KPICards summary={data.summary} subTotal={data.sub_total_monthly} />

              {/* Tab bar */}
              <div className="flex gap-0.5 glass rounded-xl p-1 w-full overflow-x-auto">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={[
                      "flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
                      activeTab === tab.id
                        ? "bg-amber-500/15 text-amber-300"
                        : "text-slate-400 hover:text-slate-200 hover:bg-white/5",
                    ].join(" ")}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab panels */}
              <AnimatePresence mode="wait">
                {activeTab === "overview" && (
                  <TabPanel key="overview">
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                      <div className="xl:col-span-2">
                        <MonthlyChart data={data.monthly} />
                      </div>
                      <SpendingWheel data={data.by_category} />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      <TopMerchants merchants={data.top_merchants} income={data.income_src} />
                      <SubscriptionList subs={data.subscriptions} total={data.sub_total_monthly} />
                    </div>
                  </TabPanel>
                )}

                {activeTab === "aktivitas" && (
                  <TabPanel key="aktivitas">
                    <SpendingHeatmap timeseries={data.timeseries} />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      <TopMerchants merchants={data.top_merchants} income={data.income_src} />
                      <SubscriptionList subs={data.subscriptions} total={data.sub_total_monthly} />
                    </div>
                  </TabPanel>
                )}

                {activeTab === "spending" && (
                  <TabPanel key="spending">
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

              {/* Floating share + donate bar */}
              <SharePanel data={data} onDonasi={() => setShowDonasi(true)} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Donation modal — works from header & share panel */}
        <AnimatePresence>
          {showDonasi && <DonasiModal onClose={() => setShowDonasi(false)} />}
        </AnimatePresence>
      </main>
    </div>
  );
}

function TabPanel({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      {children}
    </motion.div>
  );
}

