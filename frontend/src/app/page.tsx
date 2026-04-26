"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTransactions } from "@/hooks/useTransactions";
import { useAnalysis } from "@/hooks/useAnalysis";
import { useDisplayMode } from "@/hooks/useDisplayMode";
import { CategoryBadge } from "@/components/CategoryBadge";
import { MotionSection } from "@/components/MotionSection";
import { motion } from "framer-motion";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  ChevronRight,
  CircleDollarSign,
  PiggyBank,
  Receipt,
  Sparkles,
  Target,
  Trash2,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { formatRupiah } from "@/lib/utils";

const CATEGORY_COLORS = ["#14b8a6", "#0ea5e9", "#f97316", "#8b5cf6", "#e11d48"];

const QUICK_ACTIONS: Array<{
  href: string;
  label: string;
  caption: string;
  icon: LucideIcon;
  tone: string;
}> = [
  {
    href: "/transaksi",
    label: "Catat Pemasukan",
    caption: "Tambah income",
    icon: ArrowDownRight,
    tone: "from-emerald-500 to-teal-500",
  },
  {
    href: "/transaksi",
    label: "Catat Pengeluaran",
    caption: "Kontrol belanja",
    icon: ArrowUpRight,
    tone: "from-rose-500 to-orange-500",
  },
  {
    href: "/laporan",
    label: "Lihat Laporan",
    caption: "Baca insight",
    icon: BarChart3,
    tone: "from-sky-500 to-indigo-500",
  },
  {
    href: "/budget",
    label: "Atur Budget",
    caption: "Set limit baru",
    icon: Target,
    tone: "from-violet-500 to-indigo-500",
  },
];

export default function Dashboard() {
  const { user } = useAuth();
  const { loading: txLoading, deleteOne } = useTransactions();
  const { data, status, error, analyzeMe } = useAnalysis();
  const { isShowtime, prefersReducedMotion, motionTier } = useDisplayMode();
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const [monthFilter, setMonthFilter] = useState<string>(currentMonthStr);

  useEffect(() => {
    if (user && status === "idle" && !data) {
      analyzeMe(monthFilter);
    }
  }, [user, status, data, analyzeMe, monthFilter]);

  const totalIncome = data?.summary.total_income ?? 0;
  const totalExpense = data?.summary?.total_expense ?? 0;
  const netBalance = data?.summary?.net_cashflow ?? 0;
  const txCount = data?.summary.tx_count ?? 0;
  const savingsRate = totalIncome > 0 ? (netBalance / totalIncome) * 100 : 0;
  const recurringMonthly = data?.sub_total_monthly ?? 0;

  const topCategories = (data?.by_category ?? []).slice(0, 4);
  const recurring = (data?.subscriptions ?? []).slice(0, 4);
  const recentTx = (data?.transactions ?? []).slice(0, 6);
  const heroWords = [
    "Kendalikan",
    "performa",
    "keuangan",
    "dari",
    "satu",
    "dashboard",
    "eksekutif.",
  ];

  const isLoading = status === "loading" || txLoading;
  const isPositiveBalance = netBalance >= 0;

  return (
    <div
      className={`space-y-6 pb-10 transition-opacity duration-300 ${
        isLoading ? "pointer-events-none opacity-60" : "opacity-100"
      }`}
    >
      <MotionSection delay={0.02}>
        <section className={`relative overflow-hidden rounded-[30px] border border-teal-100/70 bg-gradient-to-br from-white via-teal-50/70 to-sky-50 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] md:p-8 ${isShowtime ? "dashboard-showtime" : "dashboard-ringkas"}`}>
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 left-8 h-44 w-44 rounded-full bg-teal-300/25 blur-3xl" />
          <div className="absolute right-[-20px] top-6 h-40 w-40 rounded-full bg-sky-300/25 blur-3xl" />
          <div className="absolute bottom-[-24px] left-1/2 h-32 w-40 -translate-x-1/2 rounded-full bg-orange-200/30 blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white/80 px-3 py-1 text-[11px] font-semibold tracking-wide text-teal-700">
                <Sparkles className="h-3.5 w-3.5" />
                Insight Keuangan Terpadu
              </span>
              <div>
                {isShowtime && !prefersReducedMotion ? (
                  <h1 className="flex flex-wrap gap-x-2 gap-y-1 text-2xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
                    {heroWords.map((word, index) => (
                      <motion.span
                        key={`${word}-${index}`}
                        initial={{ opacity: 0, y: 12, rotate: index % 2 === 0 ? -1.4 : 1.4 }}
                        animate={{ opacity: 1, y: 0, rotate: 0 }}
                        transition={{
                          duration: motionTier.context,
                          delay: Math.min(index * 0.05, 0.28),
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      >
                        {word}
                      </motion.span>
                    ))}
                  </h1>
                ) : (
                  <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
                    Kendalikan performa keuangan dari satu dashboard eksekutif.
                  </h1>
                )}
                <p className="mt-2 max-w-2xl text-sm text-slate-600 md:text-base">
                  Pantau arus kas, pola pengeluaran, dan transaksi prioritas secara real-time untuk pengambilan keputusan yang lebih presisi.
                </p>
              </div>

              <div className="flex flex-wrap items-end gap-3">
                <p
                  className={`text-4xl font-black tracking-tight md:text-5xl ${
                    isPositiveBalance ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {formatRupiah(netBalance)}
                </p>
                <span
                  className={`mb-1 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    isPositiveBalance
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {isPositiveBalance ? "Cashflow positif" : "Perlu optimasi cashflow"}
                </span>
              </div>

              <p className="text-xs font-medium text-slate-500 md:text-sm">
                Pemasukan {formatRupiah(totalIncome)} dan pengeluaran {formatRupiah(totalExpense)} pada periode aktif.
              </p>
            </div>

            <div className="w-full rounded-2xl border border-white/80 bg-white/85 p-4 shadow-sm backdrop-blur md:max-w-[320px]">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Periode Analisis
              </label>
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <Calendar className="h-4 w-4 text-slate-400" />
                <input
                  type="month"
                  value={monthFilter}
                  onChange={(e) => {
                    setMonthFilter(e.target.value);
                    analyzeMe(e.target.value || undefined);
                  }}
                  className="w-full bg-transparent text-sm font-semibold text-slate-700 outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-teal-50 px-2.5 py-2 text-center">
                  <p className="text-[10px] uppercase tracking-wide text-teal-700">Savings</p>
                  <p className="mt-1 text-xs font-bold text-teal-900">{savingsRate.toFixed(1)}%</p>
                </div>
                <div className="rounded-xl bg-sky-50 px-2.5 py-2 text-center">
                  <p className="text-[10px] uppercase tracking-wide text-sky-700">Transaksi</p>
                  <p className="mt-1 text-xs font-bold text-sky-900">{txCount}</p>
                </div>
                <div className="rounded-xl bg-amber-50 px-2.5 py-2 text-center">
                  <p className="text-[10px] uppercase tracking-wide text-amber-700">Tagihan</p>
                  <p className="mt-1 text-xs font-bold text-amber-900">{recurring.length}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {QUICK_ACTIONS.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: motionTier.context, delay: 0.08 + index * 0.06 }}
                >
                  <Link
                    href={item.href}
                    className="group block rounded-2xl border border-white/80 bg-white/85 p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md"
                  >
                    <span
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${item.tone} text-white shadow-sm transition-transform duration-300 group-hover:scale-105`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <p className="mt-3 text-sm font-bold text-slate-900">{item.label}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">{item.caption}</p>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
        </section>
      </MotionSection>

      <MotionSection delay={0.04}>
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            index={0}
            label="Pemasukan Bulan Ini"
            value={formatRupiah(totalIncome)}
            hint="Total dana yang masuk"
            icon={CircleDollarSign}
            tone="teal"
            showtime={isShowtime}
          />
          <MetricCard
            index={1}
            label="Pengeluaran Bulan Ini"
            value={formatRupiah(totalExpense)}
            hint="Semua biaya tercatat"
            icon={Wallet}
            tone="rose"
            showtime={isShowtime}
          />
          <MetricCard
            index={2}
            label="Total Cashflow"
            value={formatRupiah(netBalance)}
            hint={isPositiveBalance ? "Kondisi kas sehat" : "Perlu evaluasi belanja"}
            icon={PiggyBank}
            tone={isPositiveBalance ? "emerald" : "slate"}
            showtime={isShowtime}
          />
          <MetricCard
            index={3}
            label="Tagihan Bulanan"
            value={formatRupiah(recurringMonthly)}
            hint={`${recurring.length} langganan terdeteksi`}
            icon={Receipt}
            tone="amber"
            showtime={isShowtime}
          />
        </section>
      </MotionSection>

      <MotionSection delay={0.06}>
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 rounded-3xl border border-slate-200/70 bg-white/90 p-5 shadow-[0_12px_32px_rgba(15,23,42,0.06)] backdrop-blur md:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-lg font-bold text-slate-900">Transaksi Terbaru</p>
              <p className="text-xs text-slate-500">
                Aktivitas terbaru yang paling berpengaruh pada arus kas.
              </p>
            </div>
            <Link
              href="/transaksi"
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-teal-300 hover:text-teal-700"
            >
              Lihat semua
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {recentTx.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-5 py-10 text-center">
              <Receipt className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-sm font-semibold text-slate-700">Belum ada transaksi</p>
              <p className="mt-1 text-xs text-slate-500">
                Catat transaksi pertama kamu untuk mulai melihat insight otomatis.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentTx.map((tx, idx) => {
                const isIncome = tx.tipe === "income";
                const fallbackAmount = Math.max(tx.kredit, tx.debit);
                const amount = isIncome ? (tx.kredit || fallbackAmount) : (tx.debit || fallbackAmount);
                const label = tx.deskripsi || "Transaksi";

                return (
                  <motion.div
                    key={`${label}-${idx}`}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.26, delay: idx * 0.03 }}
                    className="flex items-center justify-between gap-3 py-3.5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <CategoryBadge category={tx.kategori || "Lainnya"} hint={label} variant="icon" size="md" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{label}</p>
                        <div className="mt-0.5 flex items-center gap-2">
                          <p className="text-xs text-slate-500">
                            {new Date(tx.tanggal || "").toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                          <CategoryBadge category={tx.kategori || "Lainnya"} hint={label} variant="pill" />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {tx.id ? (
                        <button
                          onClick={async () => {
                            if (!window.confirm(`Hapus transaksi "${label}"?`)) return;
                            await deleteOne(String(tx.id));
                            await analyzeMe(monthFilter || undefined);
                          }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-700 transition hover:bg-rose-100"
                          title="Hapus transaksi"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      ) : null}

                      <div className="text-right">
                        <span
                          className={`mb-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                            isIncome ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {isIncome ? "Income" : "Expense"}
                        </span>
                        <p className={`text-sm font-bold ${isIncome ? "text-emerald-600" : "text-slate-900"}`}>
                          {isIncome ? "+" : "-"}
                          {formatRupiah(amount)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200/70 bg-white/90 p-5 shadow-[0_12px_32px_rgba(15,23,42,0.06)] backdrop-blur">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-base font-bold text-slate-900">Top Kategori Belanja</p>
              <Link href="/laporan" className="text-xs font-semibold text-teal-700 hover:text-teal-600">
                Detail
              </Link>
            </div>

            {topCategories.length === 0 ? (
              <p className="rounded-xl bg-slate-50 px-3 py-4 text-center text-xs text-slate-500">
                Belum ada kategori pengeluaran untuk periode ini.
              </p>
            ) : (
              <div className="space-y-3.5">
                {topCategories.map((row, idx) => {
                  const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
                  const width = Math.min(100, Math.max(8, row.pct));
                  return (
                    <div key={row.kategori}>
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                          <p className="truncate text-sm font-semibold text-slate-800">{row.kategori}</p>
                        </div>
                        <p className="text-xs font-semibold text-slate-500">{row.pct.toFixed(1)}%</p>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: color }}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${width}%` }}
                          viewport={{ once: true, amount: 0.6 }}
                          transition={{ duration: 0.45, delay: 0.05 + idx * 0.06, ease: "easeOut" }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{formatRupiah(row.total)}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200/70 bg-white/90 p-5 shadow-[0_12px_32px_rgba(15,23,42,0.06)] backdrop-blur">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-base font-bold text-slate-900">Tagihan Rutin</p>
              <Link href="/laporan" className="text-xs font-semibold text-teal-700 hover:text-teal-600">
                Lihat
              </Link>
            </div>

            {recurring.length === 0 ? (
              <p className="rounded-xl bg-slate-50 px-3 py-4 text-center text-xs text-slate-500">
                Tidak ada langganan terdeteksi.
              </p>
            ) : (
              <div className="space-y-3">
                {recurring.map((sub, idx) => (
                  <div
                    key={`${sub.merchant}-${idx}`}
                    className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{sub.merchant}</p>
                      <p className="text-[11px] capitalize text-slate-500">{sub.frekuensi}</p>
                    </div>
                    <p className="text-sm font-bold text-slate-800">{formatRupiah(sub.estimated_monthly)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        </section>
      </MotionSection>

      {status === "error" && error && (
        <MotionSection delay={0.08}>
          <section className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            Gagal memuat analisis: {error}
          </section>
        </MotionSection>
      )}

      {!user && (
        <MotionSection delay={0.1}>
          <section className="rounded-2xl border border-slate-200 bg-white/85 px-4 py-4 text-center text-sm text-slate-600">
            Masuk ke akun kamu untuk melihat data transaksi cloud dan insight personal.
          </section>
        </MotionSection>
      )}
    </div>
  );
}

type MetricTone = "teal" | "rose" | "emerald" | "amber" | "slate";

function MetricCard({
  index,
  label,
  value,
  hint,
  icon: Icon,
  tone,
  showtime,
}: {
  index: number;
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  tone: MetricTone;
  showtime: boolean;
}) {
  const toneMap: Record<MetricTone, string> = {
    teal: "bg-teal-50 text-teal-700",
    rose: "bg-rose-50 text-rose-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    slate: "bg-slate-100 text-slate-700",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: showtime ? 12 : 8, scale: 0.99 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: showtime ? 0.32 : 0.24, delay: 0.04 + index * 0.04, ease: "easeOut" }}
      whileHover={{ y: -2, scale: 1.01 }}
      className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-sm backdrop-blur"
    >
      {showtime && tone === "amber" ? (
        <motion.span
          className="pointer-events-none absolute inset-0 rounded-2xl"
          animate={{ boxShadow: ["0 0 0 rgba(251,191,36,0)", "0 0 26px rgba(251,191,36,0.28)", "0 0 0 rgba(251,191,36,0)"] }}
          transition={{ duration: 2.1, repeat: Infinity, ease: "easeInOut" }}
        />
      ) : null}
      <div className="mb-3 flex items-center justify-between">
        <motion.span
          whileHover={{ rotate: -6, scale: 1.06 }}
          transition={{ type: "spring", stiffness: 320, damping: 22 }}
          className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${toneMap[tone]}`}
        >
          <Icon className="h-4 w-4" />
        </motion.span>
      </div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-extrabold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </motion.div>
  );
}
