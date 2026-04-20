"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { useAnalysis } from "@/hooks/useAnalysis";
import { useTransactions } from "@/hooks/useTransactions";
import { BalanceCard } from "@/components/BalanceCard";
import { KPICards } from "@/components/KPICards";
import { TransactionList } from "@/components/TransactionList";
import { SmartInput } from "@/components/SmartInput";
import { SharePanel } from "@/components/SharePanel";
import { QuickTracker } from "@/components/QuickTracker";
import { SharedBudgetRoom } from "@/components/SharedBudgetRoom";
import { Loader2, Zap, Plus, ArrowRight, Upload, BarChart3, Wallet, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
  const { user } = useAuth();
  const { data, status, error, analyzeMe, reset } = useAnalysis();
  const { txs, loading: txLoading, save, deleteOne, clear, isCloud } = useTransactions();
  const [showSmartInput, setShowSmartInput] = useState(false);
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const [monthFilter, setMonthFilter] = useState<string>(currentMonthStr);

  useEffect(() => {
    if (user && status === "idle" && !data) {
      analyzeMe(monthFilter);
    }
  }, [user, data, status, analyzeMe, monthFilter]);

  const isEmptyCloud = !!(data && (data as any).message && (data.summary?.tx_count === 0 || data.summary?.total_expense === 0));

  return (
    <div className="space-y-6">

      {/* ── Loading ── */}
      {status === "loading" && (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-teal-500" />
          <p className="text-slate-600 animate-pulse">Memuat data keuanganmu…</p>
        </div>
      )}

      {/* ── Empty / Not logged in ── */}
      {!user && status !== "loading" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
          {/* Left: Quick Tracker */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700">Catatan Cepat</h2>
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
              txs={txs} onAddNew={() => setShowSmartInput(true)}
              onDelete={deleteOne} onClear={clear}
              isCloud={isCloud} loading={txLoading}
            />
          </div>

          {/* Right: Shortcut cards */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-700">Fitur Utama</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { href: "/import", icon: Upload, label: "Import Mutasi Bank", sub: "Analisis CSV/PDF", color: "#0f766e" },
                { href: "/laporan", icon: BarChart3, label: "Laporan", sub: "Grafik pengeluaran", color: "#7c3aed" },
                { href: "/budget", icon: Wallet, label: "Budget", sub: "Atur batas pengeluaran", color: "#0369a1" },
                { href: "/perencanaan", icon: TrendingUp, label: "Perencanaan", sub: "Forecast & AI Planner", color: "#b45309" },
              ].map((item) => (
                <Link key={item.href} href={item.href}>
                  <motion.div
                    whileHover={{ y: -2, scale: 1.01 }}
                    className="rounded-2xl p-4 cursor-pointer transition-all"
                    style={{ background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
                  >
                    <item.icon className="w-7 h-7 mb-2" style={{ color: item.color }} />
                    <p className="text-sm font-semibold text-slate-800 leading-tight">{item.label}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{item.sub}</p>
                  </motion.div>
                </Link>
              ))}
            </div>
            <p className="text-xs text-slate-500 pl-1">
              💡 <Link href="/auth/login" className="text-teal-600 underline underline-offset-2">Masuk</Link> untuk sinkronisasi data dengan Telegram bot.
            </p>
          </div>
        </div>
      )}

      {/* ── Logged in + Data ── */}
      {data && status === "success" && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            {isEmptyCloud ? (
              <div className="text-center py-16 px-4">
                <div className="text-5xl mb-4">📝</div>
                <h2 className="text-xl font-semibold text-slate-800">Belum ada transaksi bulan ini</h2>
                <p className="text-sm text-slate-600 mt-2 max-w-sm mx-auto">
                  Catat pengeluaran lewat Telegram bot, atau gunakan tombol Catat Cepat di bawah.
                </p>
                <button
                  onClick={() => setShowSmartInput(true)}
                  className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
                  style={{ background: "#0f766e" }}
                >
                  <Plus className="w-4 h-4" /> Catat Sekarang
                </button>
              </div>
            ) : (
              <>
                {/* Greeting + Month Filter */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
                    <p className="text-sm text-slate-600 mt-0.5">{data.summary.date_range}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-600">Bulan:</span>
                    <input
                      type="month"
                      value={monthFilter}
                      onChange={(e) => {
                        setMonthFilter(e.target.value);
                        analyzeMe(e.target.value || undefined);
                      }}
                      className="bg-white border focus:ring-2 focus:outline-none focus:ring-teal-500 p-1.5 text-sm rounded-lg shadow-sm font-medium text-slate-800"
                    />
                    {monthFilter && (
                      <button onClick={() => { setMonthFilter(""); analyzeMe(); }}
                        className="text-xs text-slate-500 hover:text-slate-800 underline">
                        Semua
                      </button>
                    )}
                  </div>
                </div>

                {/* KPI Cards */}
                <BalanceCard summary={data.summary} timeseries={data.timeseries} />
                <KPICards summary={data.summary} subTotal={data.sub_total_monthly} />

                {/* Recent Transactions (last 5) + Link to full list */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-slate-700">Transaksi Terbaru</h2>
                    <Link href="/transaksi" className="text-xs text-teal-600 hover:text-teal-700 flex items-center gap-1">
                      Lihat semua <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                  <TransactionList
                    transactions={(data.transactions ?? []).slice(0, 5)}
                    onDelete={async (id) => {
                      await deleteOne(id);
                      await analyzeMe(monthFilter || undefined);
                    }}
                  />
                </div>

                {/* Shared Room */}
                <SharedBudgetRoom byCategory={data.by_category} summary={data.summary} />
              </>
            )}

            <SharePanel data={data} />
          </motion.div>
        </AnimatePresence>
      )}

      {error && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-2 rounded-lg text-center">
          {error}
        </p>
      )}

      {/* FAB */}
      <motion.button
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, type: "spring" }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.93 }}
        onClick={() => setShowSmartInput(true)}
        className="fixed bottom-24 right-5 sm:right-8 md:bottom-8 z-40 w-14 h-14 rounded-full flex items-center justify-center shadow-xl"
        style={{ background: "linear-gradient(135deg, #14b8a6, #0ea5e9)" }}
        title="Catat Cepat"
      >
        <Plus className="w-6 h-6 text-white" />
      </motion.button>

      {/* Smart Input modal */}
      <AnimatePresence>
        {showSmartInput && (
          <SmartInput onClose={() => setShowSmartInput(false)} onSaved={save} />
        )}
      </AnimatePresence>
    </div>
  );
}
