"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTransactions } from "@/hooks/useTransactions";
import { useAnalysis } from "@/hooks/useAnalysis";
import { useDisplayMode } from "@/hooks/useDisplayMode";
import { CategoryBadge } from "@/components/CategoryBadge";
import { MotionSection } from "@/components/MotionSection";
import { NumberTicker } from "@/components/ui/NumberTicker";
import { Sparkline } from "@/components/ui/Sparkline";
import { TiltCard } from "@/components/ui/TiltCard";
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
import { cn, formatRupiah } from "@/lib/utils";

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

function buildSparklineData(value: number, trend: "up" | "down" | "flat" = "up") {
  const safeValue = Math.max(1, Math.abs(value));
  const profile =
    trend === "down"
      ? [0.92, 0.88, 0.83, 0.77, 0.72, 0.66, 0.61, 0.56]
      : trend === "flat"
        ? [0.66, 0.68, 0.67, 0.69, 0.7, 0.69, 0.71, 0.7]
        : [0.44, 0.5, 0.58, 0.64, 0.7, 0.77, 0.84, 0.92];

  return profile.map((ratio, index) => {
    const drift = trend === "down" ? -(index + 1) * (safeValue * 0.01) : (index + 1) * (safeValue * 0.01);
    return { value: Math.max(1, safeValue * ratio + drift) };
  });
}

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
  const isPositiveBalance = netBalance >= 0;

  const topCategories = (data?.by_category ?? []).slice(0, 4);
  const recurring = (data?.subscriptions ?? []).slice(0, 4);
  const recentTx = (data?.transactions ?? []).slice(0, 6);
  const incomeSparkline = buildSparklineData(totalIncome || 1, "up");
  const expenseSparkline = buildSparklineData(totalExpense || 1, "down");
  const cashflowSparkline = buildSparklineData(Math.abs(netBalance) || 1, isPositiveBalance ? "up" : "down");
  const recurringSparkline = buildSparklineData(recurringMonthly || 1, recurringMonthly > 0 ? "up" : "flat");
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

  return (
    <div
      className={`space-y-6 pb-10 transition-opacity duration-300 ${
        isLoading ? "pointer-events-none opacity-60" : "opacity-100"
      }`}
    >
      <MotionSection delay={0.02}>
        <section
          className={cn(
            "relative overflow-hidden rounded-[30px] p-6 md:p-8",
            isShowtime
              ? "oprex-panel border border-white/[0.12] bg-[#070b12]/85 text-slate-100"
              : "border border-teal-100/70 bg-gradient-to-br from-white via-teal-50/70 to-sky-50 shadow-[0_24px_60px_rgba(15,23,42,0.08)]"
          )}
        >
        <div className="pointer-events-none absolute inset-0">
          <div
            className={cn(
              "absolute -top-20 left-8 h-44 w-44 rounded-full blur-3xl",
              isShowtime ? "bg-emerald-400/20" : "bg-teal-300/25"
            )}
          />
          <div
            className={cn(
              "absolute right-[-20px] top-6 h-40 w-40 rounded-full blur-3xl",
              isShowtime ? "bg-cyan-400/20" : "bg-sky-300/25"
            )}
          />
          <div
            className={cn(
              "absolute bottom-[-24px] left-1/2 h-32 w-40 -translate-x-1/2 rounded-full blur-3xl",
              isShowtime ? "bg-red-400/20" : "bg-orange-200/30"
            )}
          />
        </div>

        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <span
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide",
                  isShowtime ? "oprex-pill" : "border border-teal-200 bg-white/80 text-teal-700"
                )}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Insight Keuangan Terpadu
              </span>
              <div>
                {isShowtime && !prefersReducedMotion ? (
                  <h1 className="oprex-heading flex flex-wrap gap-x-2 gap-y-1 text-2xl font-extrabold tracking-tight md:text-4xl">
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
                  <h1 className={cn("text-2xl font-extrabold tracking-tight md:text-4xl", isShowtime ? "oprex-heading" : "text-slate-900")}>
                    Kendalikan performa keuangan dari satu dashboard eksekutif.
                  </h1>
                )}
                <p className={cn("mt-2 max-w-2xl text-sm md:text-base", isShowtime ? "oprex-muted" : "text-slate-600")}>
                  Pantau arus kas, pola pengeluaran, dan transaksi prioritas secara real-time untuk pengambilan keputusan yang lebih presisi.
                </p>
              </div>

              <div className="flex flex-wrap items-end gap-3">
                <p
                  className={cn(
                    "text-4xl font-black tracking-tight md:text-5xl",
                    isPositiveBalance ? (isShowtime ? "text-emerald-300" : "text-emerald-600") : isShowtime ? "text-rose-300" : "text-rose-600"
                  )}
                >
                  {isShowtime ? (
                    <>
                      <span className="mr-1 align-middle text-2xl opacity-70 md:text-3xl">
                        {netBalance < 0 ? "-Rp" : "Rp"}
                      </span>
                      <NumberTicker value={Math.abs(netBalance)} />
                    </>
                  ) : (
                    formatRupiah(netBalance)
                  )}
                </p>
                <span
                  className={cn(
                    "mb-1 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold",
                    isPositiveBalance
                      ? isShowtime
                        ? "bg-emerald-400/15 text-emerald-200"
                        : "bg-emerald-100 text-emerald-700"
                      : isShowtime
                        ? "bg-rose-400/15 text-rose-200"
                        : "bg-rose-100 text-rose-700"
                  )}
                >
                  {isPositiveBalance ? "Cashflow positif" : "Perlu optimasi cashflow"}
                </span>
              </div>

              <p className={cn("text-xs font-medium md:text-sm", isShowtime ? "oprex-muted" : "text-slate-500")}>
                Pemasukan {formatRupiah(totalIncome)} dan pengeluaran {formatRupiah(totalExpense)} pada periode aktif.
              </p>
            </div>

            <div
              className={cn(
                "w-full rounded-2xl p-4 md:max-w-[320px]",
                isShowtime
                  ? "oprex-panel-soft border border-white/[0.12]"
                  : "border border-white/80 bg-white/85 shadow-sm backdrop-blur"
              )}
            >
              <label className={cn("mb-1 block text-xs font-semibold uppercase tracking-wider", isShowtime ? "oprex-muted" : "text-slate-500")}>
                Periode Analisis
              </label>
              <div
                className={cn(
                  "mb-4 flex items-center gap-2 rounded-xl px-3 py-2",
                  isShowtime ? "border border-white/[0.12] bg-black/20" : "border border-slate-200 bg-slate-50"
                )}
              >
                <Calendar className={cn("h-4 w-4", isShowtime ? "text-slate-300" : "text-slate-400")} />
                <input
                  type="month"
                  value={monthFilter}
                  onChange={(e) => {
                    setMonthFilter(e.target.value);
                    analyzeMe(e.target.value || undefined);
                  }}
                  className={cn(
                    "w-full bg-transparent text-sm font-semibold outline-none",
                    isShowtime ? "text-slate-100" : "text-slate-700"
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className={cn("rounded-xl px-2.5 py-2 text-center", isShowtime ? "border border-white/10 bg-emerald-400/10" : "bg-teal-50")}>
                  <p className={cn("text-[10px] uppercase tracking-wide", isShowtime ? "text-emerald-100/80" : "text-teal-700")}>Savings</p>
                  <p className={cn("mt-1 text-xs font-bold", isShowtime ? "text-emerald-100" : "text-teal-900")}>{savingsRate.toFixed(1)}%</p>
                </div>
                <div className={cn("rounded-xl px-2.5 py-2 text-center", isShowtime ? "border border-white/10 bg-cyan-400/10" : "bg-sky-50")}>
                  <p className={cn("text-[10px] uppercase tracking-wide", isShowtime ? "text-cyan-100/80" : "text-sky-700")}>Transaksi</p>
                  <p className={cn("mt-1 text-xs font-bold", isShowtime ? "text-cyan-100" : "text-sky-900")}>{txCount}</p>
                </div>
                <div className={cn("rounded-xl px-2.5 py-2 text-center", isShowtime ? "border border-white/10 bg-red-400/10" : "bg-amber-50")}>
                  <p className={cn("text-[10px] uppercase tracking-wide", isShowtime ? "text-rose-100/80" : "text-amber-700")}>Tagihan</p>
                  <p className={cn("mt-1 text-xs font-bold", isShowtime ? "text-rose-100" : "text-amber-900")}>{recurring.length}</p>
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
                  <TiltCard
                    enabled={isShowtime}
                    glow={isShowtime}
                    className={cn(
                      "h-full",
                      isShowtime ? "border border-white/[0.12] bg-white/[0.04]" : "border border-transparent"
                    )}
                  >
                    <Link
                      href={item.href}
                      className={cn(
                        "group block rounded-2xl p-3 transition-all",
                        isShowtime
                          ? "h-full border border-white/10 bg-black/25 hover:border-white/30"
                          : "border border-white/80 bg-white/85 shadow-sm hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md"
                      )}
                    >
                      <span
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${item.tone} text-white shadow-sm transition-transform duration-300 group-hover:scale-105`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <p className={cn("mt-3 text-sm font-bold", isShowtime ? "text-slate-50" : "text-slate-900")}>{item.label}</p>
                      <p className={cn("mt-0.5 text-[11px]", isShowtime ? "text-slate-300/80" : "text-slate-500")}>{item.caption}</p>
                    </Link>
                  </TiltCard>
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
            sparkData={incomeSparkline}
            showtime={isShowtime}
          />
          <MetricCard
            index={1}
            label="Pengeluaran Bulan Ini"
            value={formatRupiah(totalExpense)}
            hint="Semua biaya tercatat"
            icon={Wallet}
            tone="rose"
            sparkData={expenseSparkline}
            showtime={isShowtime}
          />
          <MetricCard
            index={2}
            label="Total Cashflow"
            value={formatRupiah(netBalance)}
            hint={isPositiveBalance ? "Kondisi kas sehat" : "Perlu evaluasi belanja"}
            icon={PiggyBank}
            tone={isPositiveBalance ? "emerald" : "slate"}
            sparkData={cashflowSparkline}
            showtime={isShowtime}
          />
          <MetricCard
            index={3}
            label="Tagihan Bulanan"
            value={formatRupiah(recurringMonthly)}
            hint={`${recurring.length} langganan terdeteksi`}
            icon={Receipt}
            tone="amber"
            sparkData={recurringSparkline}
            showtime={isShowtime}
          />
        </section>
      </MotionSection>

      <MotionSection delay={0.06}>
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div
          className={cn(
            "xl:col-span-2 rounded-3xl p-5 md:p-6",
            isShowtime
              ? "oprex-panel border border-white/[0.12]"
              : "border border-slate-200/70 bg-white/90 shadow-[0_12px_32px_rgba(15,23,42,0.06)] backdrop-blur"
          )}
        >
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className={cn("text-lg font-bold", isShowtime ? "text-slate-100" : "text-slate-900")}>Transaksi Terbaru</p>
              <p className={cn("text-xs", isShowtime ? "text-slate-300/75" : "text-slate-500")}>
                Aktivitas terbaru yang paling berpengaruh pada arus kas.
              </p>
            </div>
            <Link
              href="/transaksi"
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition",
                isShowtime
                  ? "border border-white/[0.12] bg-white/5 text-slate-200 hover:border-emerald-300/60 hover:text-emerald-100"
                  : "border border-slate-200 text-slate-600 hover:border-teal-300 hover:text-teal-700"
              )}
            >
              Lihat semua
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {recentTx.length === 0 ? (
            <div
              className={cn(
                "rounded-2xl border border-dashed px-5 py-10 text-center",
                isShowtime ? "border-white/15 bg-black/20" : "border-slate-200 bg-slate-50/80"
              )}
            >
              <Receipt className={cn("mx-auto h-8 w-8", isShowtime ? "text-slate-400" : "text-slate-300")} />
              <p className={cn("mt-2 text-sm font-semibold", isShowtime ? "text-slate-100" : "text-slate-700")}>Belum ada transaksi</p>
              <p className={cn("mt-1 text-xs", isShowtime ? "text-slate-300/75" : "text-slate-500")}>
                Catat transaksi pertama kamu untuk mulai melihat insight otomatis.
              </p>
            </div>
          ) : (
            <div className={cn("divide-y", isShowtime ? "divide-white/10" : "divide-slate-100")}>
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
                        <p className={cn("truncate text-sm font-semibold", isShowtime ? "text-slate-100" : "text-slate-900")}>{label}</p>
                        <div className="mt-0.5 flex items-center gap-2">
                          <p className={cn("text-xs", isShowtime ? "text-slate-300/75" : "text-slate-500")}>
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
                          className={cn(
                            "inline-flex h-8 w-8 items-center justify-center rounded-lg border transition",
                            isShowtime
                              ? "border-rose-300/30 bg-rose-400/10 text-rose-200 hover:bg-rose-400/20"
                              : "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                          )}
                          title="Hapus transaksi"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      ) : null}

                      <div className="text-right">
                        <span
                          className={`mb-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                            isIncome
                              ? isShowtime
                                ? "bg-emerald-400/15 text-emerald-200"
                                : "bg-emerald-100 text-emerald-700"
                              : isShowtime
                                ? "bg-rose-400/15 text-rose-200"
                                : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {isIncome ? "Income" : "Expense"}
                        </span>
                        <p
                          className={`text-sm font-bold ${
                            isIncome
                              ? isShowtime
                                ? "text-emerald-200"
                                : "text-emerald-600"
                              : isShowtime
                                ? "text-slate-100"
                                : "text-slate-900"
                          }`}
                        >
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
          <div
            className={cn(
              "rounded-3xl p-5",
              isShowtime
                ? "oprex-panel border border-white/[0.12]"
                : "border border-slate-200/70 bg-white/90 shadow-[0_12px_32px_rgba(15,23,42,0.06)] backdrop-blur"
            )}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className={cn("text-base font-bold", isShowtime ? "text-slate-100" : "text-slate-900")}>Top Kategori Belanja</p>
              <Link
                href="/laporan"
                className={cn("text-xs font-semibold", isShowtime ? "text-emerald-200 hover:text-emerald-100" : "text-teal-700 hover:text-teal-600")}
              >
                Detail
              </Link>
            </div>

            {topCategories.length === 0 ? (
              <p className={cn("rounded-xl px-3 py-4 text-center text-xs", isShowtime ? "border border-white/10 bg-black/20 text-slate-300/80" : "bg-slate-50 text-slate-500")}>
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
                          <p className={cn("truncate text-sm font-semibold", isShowtime ? "text-slate-100" : "text-slate-800")}>{row.kategori}</p>
                        </div>
                        <p className={cn("text-xs font-semibold", isShowtime ? "text-slate-300/80" : "text-slate-500")}>{row.pct.toFixed(1)}%</p>
                      </div>
                      <div className={cn("h-2 overflow-hidden rounded-full", isShowtime ? "bg-white/10" : "bg-slate-100")}>
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: color }}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${width}%` }}
                          viewport={{ once: true, amount: 0.6 }}
                          transition={{ duration: 0.45, delay: 0.05 + idx * 0.06, ease: "easeOut" }}
                        />
                      </div>
                      <p className={cn("mt-1 text-xs", isShowtime ? "text-slate-300/75" : "text-slate-500")}>{formatRupiah(row.total)}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div
            className={cn(
              "rounded-3xl p-5",
              isShowtime
                ? "oprex-panel border border-white/[0.12]"
                : "border border-slate-200/70 bg-white/90 shadow-[0_12px_32px_rgba(15,23,42,0.06)] backdrop-blur"
            )}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className={cn("text-base font-bold", isShowtime ? "text-slate-100" : "text-slate-900")}>Tagihan Rutin</p>
              <Link
                href="/laporan"
                className={cn("text-xs font-semibold", isShowtime ? "text-emerald-200 hover:text-emerald-100" : "text-teal-700 hover:text-teal-600")}
              >
                Lihat
              </Link>
            </div>

            {recurring.length === 0 ? (
              <p className={cn("rounded-xl px-3 py-4 text-center text-xs", isShowtime ? "border border-white/10 bg-black/20 text-slate-300/80" : "bg-slate-50 text-slate-500")}>
                Tidak ada langganan terdeteksi.
              </p>
            ) : (
              <div className="space-y-3">
                {recurring.map((sub, idx) => (
                  <div
                    key={`${sub.merchant}-${idx}`}
                    className={cn(
                      "flex items-center justify-between rounded-xl px-3 py-2.5",
                      isShowtime ? "border border-white/10 bg-white/[0.03]" : "border border-slate-100"
                    )}
                  >
                    <div className="min-w-0">
                      <p className={cn("truncate text-sm font-semibold", isShowtime ? "text-slate-100" : "text-slate-900")}>{sub.merchant}</p>
                      <p className={cn("text-[11px] capitalize", isShowtime ? "text-slate-300/75" : "text-slate-500")}>{sub.frekuensi}</p>
                    </div>
                    <p className={cn("text-sm font-bold", isShowtime ? "text-cyan-100" : "text-slate-800")}>
                      {formatRupiah(sub.estimated_monthly)}
                    </p>
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
          <section
            className={cn(
              "rounded-2xl px-4 py-3 text-sm",
              isShowtime
                ? "border border-rose-300/30 bg-rose-400/[0.12] text-rose-100"
                : "border border-rose-200 bg-rose-50 text-rose-700"
            )}
          >
            Gagal memuat analisis: {error}
          </section>
        </MotionSection>
      )}

      {!user && (
        <MotionSection delay={0.1}>
          <section
            className={cn(
              "rounded-2xl px-4 py-4 text-center text-sm",
              isShowtime
                ? "border border-white/[0.12] bg-white/[0.04] text-slate-200"
                : "border border-slate-200 bg-white/85 text-slate-600"
            )}
          >
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
  sparkData,
  showtime,
}: {
  index: number;
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  tone: MetricTone;
  sparkData: Array<{ value: number }>;
  showtime: boolean;
}) {
  const toneMap: Record<MetricTone, string> = {
    teal: "bg-teal-50 text-teal-700",
    rose: "bg-rose-50 text-rose-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    slate: "bg-slate-100 text-slate-700",
  };

  const toneMapShowtime: Record<MetricTone, string> = {
    teal: "bg-emerald-400/12 text-emerald-200 border border-emerald-300/25",
    rose: "bg-rose-400/12 text-rose-200 border border-rose-300/25",
    emerald: "bg-green-400/12 text-green-200 border border-green-300/25",
    amber: "bg-amber-400/12 text-amber-200 border border-amber-300/25",
    slate: "bg-slate-400/12 text-slate-200 border border-slate-300/25",
  };

  const sparkToneMap: Record<MetricTone, string> = {
    teal: "#00ff94",
    rose: "#ff5f5f",
    emerald: "#4ade80",
    amber: "#fbbf24",
    slate: "#94a3b8",
  };

  return (
    <TiltCard
      enabled={showtime}
      glow={showtime}
      className={cn(
        "h-full",
        showtime ? "oprex-panel border border-white/[0.12] oprex-card-highlight" : "border border-transparent"
      )}
    >
      <motion.div
        initial={{ opacity: 0, y: showtime ? 12 : 8, scale: 0.99 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: showtime ? 0.32 : 0.24, delay: 0.04 + index * 0.04, ease: "easeOut" }}
        whileHover={{ y: -2, scale: 1.01 }}
        className={cn(
          "relative h-full overflow-hidden rounded-2xl p-4",
          showtime ? "border border-white/[0.12] bg-black/20" : "border border-slate-200/70 bg-white/90 shadow-sm backdrop-blur"
        )}
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
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-xl",
              showtime ? toneMapShowtime[tone] : toneMap[tone]
            )}
          >
            <Icon className="h-4 w-4" />
          </motion.span>
        </div>
        <p className={cn("text-xs font-semibold uppercase tracking-wide", showtime ? "text-slate-300/80" : "text-slate-500")}>{label}</p>
        <p className={cn("mt-1 text-lg font-extrabold", showtime ? "text-slate-100" : "text-slate-900")}>{value}</p>
        <p className={cn("mt-1 text-xs", showtime ? "text-slate-300/75" : "text-slate-500")}>{hint}</p>
        {showtime && sparkData.length > 0 ? (
          <div className="mt-4 h-11 opacity-80 transition-opacity duration-300 group-hover:opacity-100">
            <Sparkline data={sparkData} color={sparkToneMap[tone]} className="h-full w-full" />
          </div>
        ) : null}
      </motion.div>
    </TiltCard>
  );
}
