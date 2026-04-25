"use client";

import { useAnalysis } from "@/hooks/useAnalysis";
import { UploadZone } from "@/components/UploadZone";
import { BalanceCard } from "@/components/BalanceCard";
import { TransactionList } from "@/components/TransactionList";
import { MonthlyChart } from "@/components/MonthlyChart";
import { SpendingWheel } from "@/components/SpendingWheel";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Upload, RefreshCw, Info } from "lucide-react";

export default function ImportPage() {
  const { data, status, error, analyze, reset } = useAnalysis();

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(20,184,166,0.12)" }}>
            <Upload className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Import Mutasi Bank</h1>
            <p className="text-xs text-slate-500">Analisis CSV/PDF mutasi bank secara instan</p>
          </div>
        </div>
        {data && (
          <button onClick={reset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Upload Baru
          </button>
        )}
      </div>

      {/* Info Box */}
      <div className="rounded-xl p-4 flex gap-3 text-sm" style={{ background: "rgba(20,184,166,0.06)", border: "1px solid rgba(20,184,166,0.18)" }}>
        <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
        <div className="text-slate-700">
          <strong>Analisis One-Shot:</strong> Data ini <strong>tidak disimpan</strong> ke database.
          Hanya untuk analisis sementara. Untuk mencatat transaksi permanen, gunakan{" "}
          <strong>Catat Cepat (+ )</strong> atau kirim lewat <strong>Telegram bot</strong>.
        </div>
      </div>

      {/* Upload Zone (only show when no data) */}
      {!data && status !== "loading" && (
        <div className="rounded-2xl p-6 space-y-4" style={{ background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          <p className="text-sm font-semibold text-slate-700">Pilih atau seret file mutasi bank kamu:</p>
          <UploadZone onFile={analyze} />
          <div className="flex flex-wrap gap-1.5">
            {["BCA", "Mandiri", "BRI", "BNI", "GoPay", "OVO", "Dana"].map((b) => (
              <span key={b} className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: "#f1f5f9", color: "#475569" }}>{b}</span>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {status === "loading" && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-teal-500" />
          <p className="text-slate-600 animate-pulse">Menganalisis file mutasi…</p>
        </div>
      )}

      {error && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-2 rounded-lg text-center">{error}</p>
      )}

      {/* Results */}
      {data && status === "success" && (
        <AnimatePresence>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <BalanceCard summary={data.summary} timeseries={data.timeseries} />
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
              <div className="xl:col-span-2"><MonthlyChart data={data.monthly} /></div>
              <SpendingWheel data={data.by_category} />
            </div>
            <TransactionList transactions={data.transactions ?? []} />
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
