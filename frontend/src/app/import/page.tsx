"use client";

import { useAnalysis } from "@/hooks/useAnalysis";
import { UploadZone } from "@/components/UploadZone";
import { BalanceCard } from "@/components/BalanceCard";
import { TransactionList } from "@/components/TransactionList";
import { MonthlyChart } from "@/components/MonthlyChart";
import { SpendingWheel } from "@/components/SpendingWheel";
import { PageHero } from "@/components/PageHero";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Upload, RefreshCw, Info } from "lucide-react";

export default function ImportPage() {
  const { data, status, error, analyze, reset } = useAnalysis();

  return (
    <div className="space-y-6">
      <PageHero
        icon={Upload}
        tone="teal"
        badge="Import"
        title="Import Mutasi dan Analisis Instan"
        subtitle="Upload CSV/PDF mutasi bank untuk melihat ringkasan finansial tanpa menyimpan data ke database."
        actions={
          data ? (
            <button
              onClick={reset}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-teal-200 hover:text-teal-700"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Upload Baru
            </button>
          ) : (
            <p className="rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-700">
              Mode one-shot: data tidak disimpan permanen.
            </p>
          )
        }
      />

      <div className="flex gap-3 rounded-2xl border border-teal-200/60 bg-teal-50/70 px-4 py-3 text-sm text-slate-700">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
        <p>
          Analisis ini hanya sementara. Untuk pencatatan harian, gunakan catat transaksi biasa atau integrasi Telegram bot.
        </p>
      </div>

      {!data && status !== "loading" && (
        <section className="rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-[0_12px_32px_rgba(15,23,42,0.06)] backdrop-blur">
          <p className="mb-4 text-sm font-semibold text-slate-700">Pilih atau seret file mutasi bank kamu:</p>
          <UploadZone onFile={analyze} />
          <div className="mt-4 flex flex-wrap gap-1.5">
            {["BCA", "Mandiri", "BRI", "BNI", "GoPay", "OVO", "Dana"].map((bank) => (
              <span
                key={bank}
                className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-500"
              >
                {bank}
              </span>
            ))}
          </div>
        </section>
      )}

      {status === "loading" && (
        <section className="rounded-3xl border border-slate-200/70 bg-white/90 px-6 py-20 text-center shadow-[0_12px_32px_rgba(15,23,42,0.06)] backdrop-blur">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-teal-500" />
          <p className="mt-3 text-sm font-medium text-slate-600">Menganalisis file mutasi...</p>
        </section>
      )}

      {error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-center text-sm text-rose-600">
          {error}
        </p>
      )}

      {data && status === "success" && (
        <AnimatePresence>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <BalanceCard summary={data.summary} timeseries={data.timeseries} />
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
              <div className="xl:col-span-2">
                <MonthlyChart data={data.monthly} />
              </div>
              <SpendingWheel data={data.by_category} />
            </div>
            <TransactionList transactions={data.transactions ?? []} />
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
