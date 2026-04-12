"use client";

/**
 * BudgetTracker.tsx
 * Set budget limit per kategori, tampil progress bar vs actual spending.
 * Budget disimpan di localStorage — tidak perlu login.
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, PencilLine, Check, X, AlertTriangle, TrendingDown, Plus } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import type { CategoryRow } from "@/types";

const LS_KEY = "oprexduit_budgets";

interface BudgetMap {
  [kategori: string]: number; // budget amount in IDR
}

interface BudgetTrackerProps {
  byCategory: CategoryRow[]; // actual spending from analysis
}

// Default category list jika belum ada data analisis
const DEFAULT_CATEGORIES = [
  "Kuliner", "Transportasi", "Fast Food", "Food Delivery",
  "Minimarket", "Supermarket", "Streaming", "Gaming",
  "Pulsa & Data", "Listrik", "Internet", "Lainnya",
];

function loadBudgets(): BudgetMap {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function saveBudgets(b: BudgetMap) {
  localStorage.setItem(LS_KEY, JSON.stringify(b));
}

export function BudgetTracker({ byCategory }: BudgetTrackerProps) {
  const [budgets, setBudgets] = useState<BudgetMap>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [inputVal, setInputVal] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newCat, setNewCat] = useState("");

  useEffect(() => {
    setBudgets(loadBudgets());
  }, []);

  // Merge kategori dari analisis + dari localStorage
  const allCategories = Array.from(
    new Set([
      ...byCategory.map((c) => c.kategori),
      ...Object.keys(budgets),
    ])
  );

  // Spending per kategori dari analisis
  const actualMap: Record<string, number> = {};
  for (const c of byCategory) {
    actualMap[c.kategori] = c.total;
  }

  function startEdit(kategori: string) {
    setEditing(kategori);
    setInputVal(budgets[kategori] ? String(budgets[kategori]) : "");
  }

  function commitEdit(kategori: string) {
    const val = Number(inputVal.replace(/[^0-9]/g, ""));
    if (val > 0) {
      const next = { ...budgets, [kategori]: val };
      setBudgets(next);
      saveBudgets(next);
    }
    setEditing(null);
    setInputVal("");
  }

  function cancelEdit() {
    setEditing(null);
    setInputVal("");
  }

  function removeBudget(kategori: string) {
    const next = { ...budgets };
    delete next[kategori];
    setBudgets(next);
    saveBudgets(next);
  }

  function addCustomCategory() {
    const name = newCat.trim();
    if (!name || allCategories.includes(name)) return;
    const next = { ...budgets, [name]: 0 };
    setBudgets(next);
    saveBudgets(next);
    setNewCat("");
    setShowAdd(false);
    startEdit(name);
  }

  // Only show rows that either have a budget set, or have actual spending
  const rows = allCategories.filter(
    (k) => budgets[k] !== undefined || actualMap[k] !== undefined
  );

  // Summary stats
  const totalBudget = Object.values(budgets).reduce((s, v) => s + v, 0);
  const totalSpent = rows.reduce((s, k) => s + (actualMap[k] ?? 0), 0);
  const overBudgetCount = rows.filter(
    (k) => budgets[k] && actualMap[k] && actualMap[k] > budgets[k]
  ).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      {/* Header summary */}
      <div className="glass rounded-2xl p-5 border border-white/[0.06]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-teal-400" />
            <h2 className="text-sm font-semibold text-slate-200">Monitoring Budget</h2>
          </div>
          <button
            onClick={() => setShowAdd((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: "rgba(20,184,166,0.10)",
              color: "#2dd4bf",
              border: "1px solid rgba(20,184,166,0.22)",
            }}
          >
            <Plus className="w-3 h-3" />
            Tambah Kategori
          </button>
        </div>

        {/* Total overview bar */}
        {totalBudget > 0 && (
          <div className="mb-4 space-y-1.5">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Total Terpakai</span>
              <span>
                <span className={totalSpent > totalBudget ? "text-red-400 font-semibold" : "text-teal-400 font-semibold"}>
                  {formatRupiah(totalSpent, true)}
                </span>
                {" / "}
                {formatRupiah(totalBudget, true)}
              </span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((totalSpent / totalBudget) * 100, 100)}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{
                  background:
                    totalSpent > totalBudget
                      ? "linear-gradient(90deg, #ef4444, #f97316)"
                      : totalSpent / totalBudget >= 0.85
                      ? "linear-gradient(90deg, #f59e0b, #f97316)"
                      : "linear-gradient(90deg, #14b8a6, #22c55e)",
                }}
              />
            </div>
            {overBudgetCount > 0 && (
              <div className="flex items-center gap-1.5 text-[11px] text-red-400">
                <AlertTriangle className="w-3 h-3" />
                {overBudgetCount} kategori melebihi budget
              </div>
            )}
          </div>
        )}

        {/* Add custom category input */}
        <AnimatePresence>
          {showAdd && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 flex gap-2"
            >
              <input
                autoFocus
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCustomCategory()}
                placeholder="Nama kategori baru..."
                className="flex-1 px-3 py-2 rounded-lg text-sm text-slate-200 outline-none"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
              />
              <button
                onClick={addCustomCategory}
                className="px-3 py-2 rounded-lg text-xs font-medium text-white"
                style={{ background: "#14b8a6" }}
              >
                Tambah
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {rows.length === 0 && (
          <div className="text-center py-8 text-slate-500 text-sm">
            <Target className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>Upload mutasi bank atau tambah kategori untuk mulai set budget</p>
          </div>
        )}

        {/* Category rows */}
        <div className="space-y-3">
          {rows.map((kategori) => {
            const actual = actualMap[kategori] ?? 0;
            const limit = budgets[kategori] ?? 0;
            const pct = limit > 0 ? Math.min((actual / limit) * 100, 100) : 0;
            const isOver = limit > 0 && actual > limit;
            const isWarn = limit > 0 && !isOver && pct >= 80;
            const barColor = isOver
              ? "linear-gradient(90deg, #ef4444, #f97316)"
              : isWarn
              ? "linear-gradient(90deg, #f59e0b, #fbbf24)"
              : "linear-gradient(90deg, #14b8a6, #0ea5e9)";

            return (
              <div
                key={kategori}
                className="rounded-xl p-3 space-y-2"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                {/* Row header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {isOver && <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                    {isWarn && !isOver && <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                    <span className="text-sm font-medium text-slate-200 truncate">{kategori}</span>
                    {actual > 0 && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full font-mono"
                        style={{
                          background: isOver ? "rgba(239,68,68,0.12)" : "rgba(20,184,166,0.10)",
                          color: isOver ? "#f87171" : "#2dd4bf",
                        }}
                      >
                        {formatRupiah(actual, true)}
                      </span>
                    )}
                  </div>

                  {/* Edit / value */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {editing === kategori ? (
                      <>
                        <div className="flex items-center gap-1 rounded-lg px-2 py-1" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}>
                          <span className="text-slate-400 text-xs">Rp</span>
                          <input
                            autoFocus
                            value={inputVal}
                            onChange={(e) => setInputVal(e.target.value.replace(/[^0-9]/g, ""))}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") commitEdit(kategori);
                              if (e.key === "Escape") cancelEdit();
                            }}
                            placeholder="0"
                            className="w-24 bg-transparent text-sm text-slate-200 outline-none tabular-nums"
                          />
                        </div>
                        <button onClick={() => commitEdit(kategori)} className="p-1 rounded-md text-teal-400 hover:text-teal-300">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={cancelEdit} className="p-1 rounded-md text-slate-500 hover:text-slate-300">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="text-xs font-mono text-slate-400">
                          {limit > 0 ? formatRupiah(limit, true) : <span className="text-slate-600">— set limit</span>}
                        </span>
                        <button onClick={() => startEdit(kategori)} className="p-1 rounded-md text-slate-500 hover:text-slate-300 transition-colors">
                          <PencilLine className="w-3.5 h-3.5" />
                        </button>
                        {limit > 0 && (
                          <button onClick={() => removeBudget(kategori)} className="p-1 rounded-md text-slate-600 hover:text-red-400 transition-colors">
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Progress bar — hanya tampil kalau ada limit */}
                {limit > 0 && (
                  <div className="space-y-1">
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.7, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{ background: barColor }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>
                        {isOver
                          ? `⚠ Over ${formatRupiah(actual - limit, true)}`
                          : `Sisa ${formatRupiah(limit - actual, true)}`}
                      </span>
                      <span>{pct.toFixed(0)}%</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tips placeholder — dikisi dari AI insight */}
      <div
        className="rounded-xl p-4 flex items-start gap-3 text-sm"
        style={{ background: "rgba(20,184,166,0.06)", border: "1px solid rgba(20,184,166,0.15)" }}
      >
        <TrendingDown className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />
        <p className="text-slate-400 leading-relaxed">
          Set limit budget per kategori untuk dapat peringatan saat hampir habis.
          Budget disimpan di browser — tidak perlu login.
        </p>
      </div>
    </motion.div>
  );
}
