"use client";

/**
 * AIPlanner.tsx
 * AI Financial Planner — masukkan tujuan keuangan, dapatkan rencana personal dari AI.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Target, AlertTriangle, CheckCircle2,
  Loader2, ChevronDown, ChevronUp, RefreshCw, DollarSign,
  Calendar, Lightbulb,
} from "lucide-react";
import { formatRupiah } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://oprexduit.onrender.com";

// ── Types ─────────────────────────────────────────────────────────────────

interface PlannerResult {
  headline: string;
  health_score: number;        // 0-100
  savings_rate_now: number;    // %
  savings_rate_target: number; // %
  monthly_savings_needed: number;
  tips: string[];
  warn: string[];
  milestones: { label: string; months: number; amount: number }[];
  budget_allocation: { category: string; pct: number; color: string }[];
}

const GOAL_PRESETS = [
  "Dana darurat 6 bulan",
  "Beli rumah",
  "Liburan ke luar negeri",
  "Dana pendidikan anak",
  "Investasi saham / reksadana",
  "Pensiun dini (FIRE)",
  "Beli kendaraan",
  "Lunasi hutang lebih cepat",
];

const COLOR_PALETTE = [
  "#14b8a6","#6366f1","#f59e0b","#ec4899",
  "#22c55e","#3b82f6","#f97316","#8b5cf6",
];

function ScoreRing({ score }: { score: number }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 70 ? "#14b8a6" : score >= 40 ? "#f59e0b" : "#e11d48";

  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 90 90">
        <circle cx="45" cy="45" r={r} fill="none" stroke="#e2e8f0" strokeWidth="7" />
        <circle cx="45" cy="45" r={r} fill="none" stroke={color} strokeWidth="7"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <div className="text-center">
        <p className="text-2xl font-bold" style={{ color }}>{score}</p>
        <p className="text-[9px] text-slate-400 font-medium leading-none">/ 100</p>
      </div>
    </div>
  );
}

export function AIPlanner({
  prefillIncome,
  prefillExpense,
}: {
  prefillIncome?: number;
  prefillExpense?: number;
}) {
  const [income, setIncome] = useState(String(prefillIncome ?? ""));
  const [expense, setExpense] = useState(String(prefillExpense ?? ""));
  const [savings, setSavings] = useState("");
  const [goals, setGoals] = useState("");
  const [horizon, setHorizon] = useState(12);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PlannerResult | null>(null);
  const [showMilestones, setShowMilestones] = useState(true);

  const inputClass = "w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/40";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const inc = parseFloat(income.replace(/[^\d.]/g, ""));
    const exp = parseFloat(expense.replace(/[^\d.]/g, ""));
    if (isNaN(inc) || inc <= 0) { setError("Masukkan pemasukan bulanan yang valid."); return; }
    if (!goals.trim()) { setError("Tuliskan tujuan keuanganmu."); return; }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`${API_URL}/ai/financial-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthly_income: inc,
          monthly_expense: isNaN(exp) ? 0 : exp,
          current_savings: parseFloat(savings.replace(/[^\d.]/g, "")) || 0,
          goals: goals.trim(),
          horizon_months: horizon,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail ?? `Error ${res.status}`);
      }

      const data: PlannerResult = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message ?? "Gagal menghubungi AI. Pastikan koneksi internet aktif.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ background: "rgba(99,102,241,0.12)" }}>
          <Sparkles className="w-5 h-5 text-indigo-500" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-800">AI Financial Planner</h2>
          <p className="text-xs text-slate-400">Rencana keuangan personal berdasarkan situasi & tujuanmu</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="rounded-2xl p-5 space-y-4"
        style={{ background: "#fff", border: "1px solid #e2e8f0" }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              <DollarSign className="w-3.5 h-3.5 inline mr-1 text-teal-500" />
              Pemasukan Bulanan (Rp)
            </label>
            <input className={inputClass} value={income} type="number" min="0" step="100000"
              onChange={e => setIncome(e.target.value)} placeholder="8000000" required />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Pengeluaran Bulanan (Rp)
            </label>
            <input className={inputClass} value={expense} type="number" min="0" step="100000"
              onChange={e => setExpense(e.target.value)} placeholder="5500000" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Tabungan Saat Ini (Rp)
            </label>
            <input className={inputClass} value={savings} type="number" min="0" step="100000"
              onChange={e => setSavings(e.target.value)} placeholder="10000000" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              <Calendar className="w-3.5 h-3.5 inline mr-1 text-indigo-400" />
              Target Horizon
            </label>
            <select className={inputClass} value={horizon} onChange={e => setHorizon(Number(e.target.value))}>
              {[3, 6, 12, 18, 24, 36, 60].map(m => (
                <option key={m} value={m}>{m < 12 ? `${m} bulan` : `${m / 12} tahun`}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">
            <Target className="w-3.5 h-3.5 inline mr-1 text-purple-400" />
            Tujuan Keuanganmu
          </label>
          <textarea className={`${inputClass} resize-none`} value={goals}
            onChange={e => setGoals(e.target.value)}
            rows={3} placeholder="Contoh: Saya ingin punya dana darurat 6 bulan dan investasi untuk pensiun di usia 50 tahun..." required />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {GOAL_PRESETS.map(g => (
              <button key={g} type="button"
                onClick={() => setGoals(prev => prev ? `${prev}, ${g}` : g)}
                className="px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors hover:bg-teal-100"
                style={{ background: "rgba(20,184,166,0.08)", color: "#0f766e" }}>
                + {g}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-xl"
            style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)" }}>
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        <button type="submit" disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold text-white disabled:opacity-60 transition-all"
          style={{ background: "linear-gradient(135deg, #6366f1, #0f766e)" }}>
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {isLoading ? "AI sedang menganalisis..." : "Buat Rencana Keuangan"}
        </button>
      </form>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div key="result" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="space-y-4">

            {/* Headline + Score */}
            <div className="rounded-2xl p-5 flex items-center gap-6"
              style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(20,184,166,0.08))", border: "1px solid rgba(99,102,241,0.15)" }}>
              <ScoreRing score={result.health_score} />
              <div>
                <p className="text-sm font-bold text-slate-800 mb-1">{result.headline}</p>
                <div className="flex items-center gap-4 text-xs text-slate-700">
                  <span>Savings Rate: <b className="text-slate-700">{result.savings_rate_now.toFixed(1)}%</b></span>
                  <span>→ Target: <b className="text-teal-600">{result.savings_rate_target.toFixed(1)}%</b></span>
                </div>
                {result.monthly_savings_needed > 0 && (
                  <p className="text-xs text-indigo-600 mt-1 font-medium">
                    Perlu menabung <b>{formatRupiah(result.monthly_savings_needed, true)}/bulan</b> untuk mencapai target
                  </p>
                )}
              </div>
            </div>

            {/* Budget Allocation */}
            {result.budget_allocation?.length > 0 && (
              <div className="rounded-2xl p-4 space-y-3"
                style={{ background: "#fff", border: "1px solid #e2e8f0" }}>
                <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Alokasi Budget yang Direkomendasikan</p>
                {result.budget_allocation.map(item => (
                  <div key={item.category}>
                    <div className="flex justify-between text-xs text-slate-800 mb-1">
                      <span>{item.category}</span>
                      <span className="font-semibold">{item.pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <motion.div className="h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${item.pct}%` }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        style={{ background: item.color }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Milestones */}
            {result.milestones?.length > 0 && (
              <div className="rounded-2xl overflow-hidden"
                style={{ border: "1px solid #e2e8f0" }}>
                <button
                  onClick={() => setShowMilestones(s => !s)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  style={{ background: "#fff" }}>
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-400" />
                    Milestone
                  </span>
                  {showMilestones ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>
                <AnimatePresence>
                  {showMilestones && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="px-4 pb-4 space-y-2 bg-white">
                        {result.milestones.map((m, i) => (
                          <div key={i} className="flex items-center gap-3 text-sm">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 text-white"
                              style={{ background: COLOR_PALETTE[i % COLOR_PALETTE.length] }}>
                              {i + 1}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-slate-700">{m.label}</p>
                              <p className="text-[11px] text-slate-400">
                                {m.months} bulan • {formatRupiah(m.amount, true)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Tips */}
            {result.tips?.length > 0 && (
              <div className="rounded-2xl p-4 space-y-2"
                style={{ background: "rgba(20,184,166,0.05)", border: "1px solid rgba(20,184,166,0.18)" }}>
                <p className="text-xs font-semibold text-teal-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5" /> Tips Konkret
                </p>
                {result.tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Warnings */}
            {result.warn?.length > 0 && (
              <div className="rounded-2xl p-4 space-y-2"
                style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.20)" }}>
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Perlu Perhatian
                </p>
                {result.warn.map((w, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="text-amber-500 font-bold">·</span>
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Re-generate */}
            <button onClick={() => setResult(null)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors">
              <RefreshCw className="w-4 h-4" /> Buat rencana baru
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
