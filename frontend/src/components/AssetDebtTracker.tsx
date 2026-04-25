"use client";

/**
 * AssetDebtTracker.tsx
 * Track total aset & hutang, pantau tagihan, reminder jatuh tempo.
 * Data disimpan di localStorage — tidak perlu login.
 */

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet, TrendingUp, TrendingDown, Plus, Pencil, Trash2,
  Check, X, Bell, AlertCircle,
  Building2, Car, PiggyBank, BarChart3, Package,
  CreditCard, Home, Landmark, ShoppingBag,
} from "lucide-react";
import { formatRupiah } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────

type AssetCategory = "Tabungan/Kas" | "Investasi" | "Properti" | "Kendaraan" | "Lainnya";
type DebtCategory = "KPR" | "Cicilan Kendaraan" | "Kartu Kredit" | "Pinjaman" | "Tagihan Rutin" | "Lainnya";

interface Asset {
  id: string;
  name: string;
  category: AssetCategory;
  value: number;
  note?: string;
  updatedAt: string;
}

interface Debt {
  id: string;
  name: string;
  category: DebtCategory;
  amount: number;       // total amount owed
  monthlyPayment?: number;
  dueDate?: string;     // YYYY-MM-DD or DD (day of month)
  isPaid: boolean;
  note?: string;
  updatedAt: string;
}

interface StorageData {
  assets: Asset[];
  debts: Debt[];
}

// ── Constants ─────────────────────────────────────────────────────────────

const LS_KEY = "oprexduit_asset_debt_v1";

const ASSET_CATEGORIES: AssetCategory[] = [
  "Tabungan/Kas", "Investasi", "Properti", "Kendaraan", "Lainnya",
];

const DEBT_CATEGORIES: DebtCategory[] = [
  "KPR", "Cicilan Kendaraan", "Kartu Kredit", "Pinjaman", "Tagihan Rutin", "Lainnya",
];

const ASSET_ICONS: Record<AssetCategory, React.ReactNode> = {
  "Tabungan/Kas":   <PiggyBank className="w-4 h-4" />,
  "Investasi":      <BarChart3 className="w-4 h-4" />,
  "Properti":       <Building2 className="w-4 h-4" />,
  "Kendaraan":      <Car className="w-4 h-4" />,
  "Lainnya":        <Package className="w-4 h-4" />,
};

const DEBT_ICONS: Record<DebtCategory, React.ReactNode> = {
  "KPR":               <Home className="w-4 h-4" />,
  "Cicilan Kendaraan": <Car className="w-4 h-4" />,
  "Kartu Kredit":      <CreditCard className="w-4 h-4" />,
  "Pinjaman":          <Landmark className="w-4 h-4" />,
  "Tagihan Rutin":     <ShoppingBag className="w-4 h-4" />,
  "Lainnya":           <Package className="w-4 h-4" />,
};

const ASSET_COLORS: Record<AssetCategory, string> = {
  "Tabungan/Kas": "#14b8a6",
  "Investasi":    "#6366f1",
  "Properti":     "#f59e0b",
  "Kendaraan":    "#22c55e",
  "Lainnya":      "#64748b",
};

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function load(): StorageData {
  if (typeof window === "undefined") return { assets: [], debts: [] };
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? "{}") || { assets: [], debts: [] };
  } catch {
    return { assets: [], debts: [] };
  }
}

function save(data: StorageData) {
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}

function getDaysUntil(dueDateStr?: string): number | null {
  if (!dueDateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDateStr);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - today.getTime()) / 86_400_000);
}

// ── Sub-components ────────────────────────────────────────────────────────

function SummaryBar({ totalAset, totalHutang }: { totalAset: number; totalHutang: number }) {
  const netWorth = totalAset - totalHutang;
  const isPositive = netWorth >= 0;
  return (
    <div className="grid grid-cols-3 gap-3">
      {[
        { label: "Total Aset",   value: totalAset,   color: "#14b8a6", icon: <TrendingUp className="w-4 h-4" /> },
        { label: "Total Hutang", value: totalHutang, color: "#e11d48", icon: <TrendingDown className="w-4 h-4" /> },
        { label: "Net Worth",    value: netWorth,    color: isPositive ? "#6366f1" : "#dc2626", icon: <Wallet className="w-4 h-4" /> },
      ].map((item) => (
        <div key={item.label} className="rounded-2xl p-4 space-y-1"
          style={{ background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          <div className="flex items-center gap-1.5 text-xs text-slate-700">
            <span style={{ color: item.color }}>{item.icon}</span>
            {item.label}
          </div>
          <p className="text-base font-bold font-mono" style={{ color: item.color }}>
            {formatRupiah(item.value, true)}
          </p>
        </div>
      ))}
    </div>
  );
}

interface ItemFormProps<T extends Asset | Debt> {
  type: "asset" | "debt";
  initial?: Partial<T>;
  onSave: (item: Omit<T, "id" | "updatedAt">) => void;
  onCancel: () => void;
}

function ItemForm({ type, initial, onSave, onCancel }: ItemFormProps<any>) {
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState(
    initial?.category ?? (type === "asset" ? "Tabungan/Kas" : "Tagihan Rutin")
  );
  const [value, setValue] = useState(String(initial?.value ?? initial?.amount ?? ""));
  const [monthly, setMonthly] = useState(String((initial as Debt)?.monthlyPayment ?? ""));
  const [dueDate, setDueDate] = useState((initial as Debt)?.dueDate ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [isPaid, setIsPaid] = useState((initial as Debt)?.isPaid ?? false);

  const categories = type === "asset" ? ASSET_CATEGORIES : DEBT_CATEGORIES;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const numVal = parseFloat(value.replace(/[^\d.]/g, ""));
    if (!name.trim() || isNaN(numVal) || numVal <= 0) return;
    if (type === "asset") {
      onSave({ name: name.trim(), category, value: numVal, note: note.trim() || undefined });
    } else {
      onSave({
        name: name.trim(),
        category,
        amount: numVal,
        monthlyPayment: monthly ? parseFloat(monthly.replace(/[^\d.]/g, "")) : undefined,
        dueDate: dueDate || undefined,
        isPaid,
        note: note.trim() || undefined,
      });
    }
  }

  const inputClass = "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/40";

  return (
    <motion.form
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      onSubmit={handleSubmit}
      className="rounded-2xl p-4 space-y-3 mb-3"
      style={{ background: "rgba(20,184,166,0.05)", border: "1px solid rgba(20,184,166,0.20)" }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Nama</label>
          <input className={inputClass} value={name} onChange={e => setName(e.target.value)}
            placeholder={type === "asset" ? "cth: Tabungan BCA" : "cth: Cicilan Motor"} required />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Kategori</label>
          <select className={inputClass} value={category} onChange={e => setCategory(e.target.value as any)}>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            {type === "asset" ? "Nilai (Rp)" : "Jumlah Hutang (Rp)"}
          </label>
          <input className={inputClass} value={value} type="number" min="0" step="1000"
            onChange={e => setValue(e.target.value)} placeholder="5000000" required />
        </div>
        {type === "debt" && (
          <>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Cicilan/Bulan (Rp, opsional)</label>
              <input className={inputClass} value={monthly} type="number" min="0" step="1000"
                onChange={e => setMonthly(e.target.value)} placeholder="500000" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Jatuh Tempo</label>
              <input className={inputClass} value={dueDate} type="date"
                onChange={e => setDueDate(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isPaid" checked={isPaid} onChange={e => setIsPaid(e.target.checked)}
                className="w-4 h-4 accent-teal-500" />
              <label htmlFor="isPaid" className="text-sm text-slate-800">Sudah lunas</label>
            </div>
          </>
        )}
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">Catatan (opsional)</label>
        <input className={inputClass} value={note} onChange={e => setNote(e.target.value)}
          placeholder="Tambah catatan..." />
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-slate-700 border border-slate-200 hover:bg-slate-50">
          <X className="w-3.5 h-3.5" /> Batal
        </button>
        <button type="submit"
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold text-white"
          style={{ background: "#0f766e" }}>
          <Check className="w-3.5 h-3.5" /> Simpan
        </button>
      </div>
    </motion.form>
  );
}

// ── Main Component ────────────────────────────────────────────────────────

export function AssetDebtTracker() {
  const [data, setData] = useState<StorageData>({ assets: [], debts: [] });
  const [activeTab, setActiveTab] = useState<"aset" | "hutang" | "reminder">("aset");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    setData(load());
  }, []);

  function persist(next: StorageData) {
    setData(next);
    save(next);
  }

  // ── Asset CRUD ──────────────────────────────────────────────────────────
  function addAsset(item: Omit<Asset, "id" | "updatedAt">) {
    const next = {
      ...data,
      assets: [...data.assets, { ...item, id: uid(), updatedAt: new Date().toISOString() }],
    };
    persist(next);
    setShowForm(false);
  }

  function updateAsset(id: string, item: Omit<Asset, "id" | "updatedAt">) {
    const next = {
      ...data,
      assets: data.assets.map(a => a.id === id ? { ...item, id, updatedAt: new Date().toISOString() } : a),
    };
    persist(next);
    setEditingId(null);
  }

  function deleteAsset(id: string) {
    persist({ ...data, assets: data.assets.filter(a => a.id !== id) });
  }

  // ── Debt CRUD ───────────────────────────────────────────────────────────
  function addDebt(item: Omit<Debt, "id" | "updatedAt">) {
    const next = {
      ...data,
      debts: [...data.debts, { ...item, id: uid(), updatedAt: new Date().toISOString() }],
    };
    persist(next);
    setShowForm(false);
  }

  function updateDebt(id: string, item: Omit<Debt, "id" | "updatedAt">) {
    const next = {
      ...data,
      debts: data.debts.map(d => d.id === id ? { ...item, id, updatedAt: new Date().toISOString() } : d),
    };
    persist(next);
    setEditingId(null);
  }

  function deleteDebt(id: string) {
    persist({ ...data, debts: data.debts.filter(d => d.id !== id) });
  }

  function togglePaid(id: string) {
    const next = {
      ...data,
      debts: data.debts.map(d =>
        d.id === id ? { ...d, isPaid: !d.isPaid, updatedAt: new Date().toISOString() } : d
      ),
    };
    persist(next);
  }

  // ── Computed totals ─────────────────────────────────────────────────────
  const totalAset = useMemo(() => (data?.assets || []).reduce((s, a) => s + a.value, 0), [data?.assets]);
  const totalHutang = useMemo(() => (data?.debts || []).filter(d => !d.isPaid).reduce((s, d) => s + d.amount, 0), [data?.debts]);

  // ── Upcoming reminders ──────────────────────────────────────────────────
  const reminders = useMemo(() => {
    return (data?.debts || [])
      .filter(d => !d.isPaid && d.dueDate)
      .map(d => ({ ...d, daysLeft: getDaysUntil(d.dueDate) }))
      .filter(d => d.daysLeft !== null && d.daysLeft <= 30)
      .sort((a, b) => (a.daysLeft ?? 999) - (b.daysLeft ?? 999));
  }, [data.debts]);

  const urgentCount = reminders.filter(r => (r.daysLeft ?? 999) <= 7).length;

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <SummaryBar totalAset={totalAset} totalHutang={totalHutang} />

      {/* Tab bar */}
      <div className="flex gap-1 rounded-xl p-1 w-fit"
        style={{ background: "rgba(241,245,249,0.8)", border: "1px solid #e2e8f0" }}>
        {([
          { id: "aset",    label: "Aset",    count: data.assets.length },
          { id: "hutang",  label: "Hutang",  count: data.debts.filter(d => !d.isPaid).length },
          { id: "reminder",label: urgentCount > 0 ? `Reminder 🔔` : "Reminder", count: urgentCount || undefined },
        ] as const).map(tab => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id as any); setShowForm(false); setEditingId(null); }}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-700 hover:text-slate-700"
            }`}>
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                style={{ background: activeTab === tab.id ? "#0f766e" : "#e2e8f0", color: activeTab === tab.id ? "#fff" : "#64748b" }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ── Aset Tab ── */}
        {activeTab === "aset" && (
          <motion.div key="aset" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm font-semibold text-slate-700">Daftar Aset</p>
              <button onClick={() => { setShowForm(f => !f); setEditingId(null); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white"
                style={{ background: "#0f766e" }}>
                <Plus className="w-3.5 h-3.5" /> Tambah Aset
              </button>
            </div>

            <AnimatePresence>
              {showForm && (
                <ItemForm key="form-aset" type="asset"
                  onSave={addAsset}
                  onCancel={() => setShowForm(false)} />
              )}
            </AnimatePresence>

            {data.assets.length === 0 && !showForm ? (
              <EmptyState
                icon={<TrendingUp className="w-8 h-8" />}
                title="Belum ada aset"
                desc="Catat tabungan, investasi, properti, atau kendaraanmu."
              />
            ) : (
              <div className="space-y-2">
                {data.assets.map(asset => (
                  editingId === asset.id ? (
                    <ItemForm key={`edit-${asset.id}`} type="asset" initial={asset}
                      onSave={item => updateAsset(asset.id, item as any)}
                      onCancel={() => setEditingId(null)} />
                  ) : (
                    <AssetCard key={asset.id} asset={asset}
                      onEdit={() => { setEditingId(asset.id); setShowForm(false); }}
                      onDelete={() => deleteAsset(asset.id)} />
                  )
                ))}
              </div>
            )}

            {/* Category breakdown */}
            {data.assets.length > 0 && (
              <div className="mt-4 rounded-2xl p-4" style={{ background: "#fff", border: "1px solid #e2e8f0" }}>
                <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">Per Kategori</p>
                <div className="space-y-2">
                  {ASSET_CATEGORIES.map(cat => {
                    const total = data.assets.filter(a => a.category === cat).reduce((s, a) => s + a.value, 0);
                    if (total === 0) return null;
                    const pct = totalAset > 0 ? (total / totalAset) * 100 : 0;
                    return (
                      <div key={cat}>
                        <div className="flex justify-between text-xs text-slate-800 mb-1">
                          <span className="flex items-center gap-1.5">
                            <span style={{ color: ASSET_COLORS[cat] }}>{ASSET_ICONS[cat]}</span>
                            {cat}
                          </span>
                          <span className="font-mono font-semibold">{formatRupiah(total, true)}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-100">
                          <div className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, background: ASSET_COLORS[cat] }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── Hutang Tab ── */}
        {activeTab === "hutang" && (
          <motion.div key="hutang" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm font-semibold text-slate-700">Hutang & Tagihan</p>
              <button onClick={() => { setShowForm(f => !f); setEditingId(null); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white"
                style={{ background: "#e11d48" }}>
                <Plus className="w-3.5 h-3.5" /> Tambah Hutang
              </button>
            </div>

            <AnimatePresence>
              {showForm && (
                <ItemForm key="form-hutang" type="debt"
                  onSave={addDebt}
                  onCancel={() => setShowForm(false)} />
              )}
            </AnimatePresence>

            {data.debts.length === 0 && !showForm ? (
              <EmptyState
                icon={<TrendingDown className="w-8 h-8" />}
                title="Belum ada hutang"
                desc="Catat KPR, cicilan, kartu kredit, atau tagihan."
              />
            ) : (
              <div className="space-y-2">
                {data.debts.map(debt => (
                  editingId === debt.id ? (
                    <ItemForm key={`edit-${debt.id}`} type="debt" initial={debt}
                      onSave={item => updateDebt(debt.id, item as any)}
                      onCancel={() => setEditingId(null)} />
                  ) : (
                    <DebtCard key={debt.id} debt={debt}
                      onEdit={() => { setEditingId(debt.id); setShowForm(false); }}
                      onDelete={() => deleteDebt(debt.id)}
                      onTogglePaid={() => togglePaid(debt.id)} />
                  )
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── Reminder Tab ── */}
        {activeTab === "reminder" && (
          <motion.div key="reminder" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <p className="text-sm font-semibold text-slate-700 mb-3">Reminder Jatuh Tempo (30 hari ke depan)</p>

            {reminders.length === 0 ? (
              <EmptyState
                icon={<Bell className="w-8 h-8" />}
                title="Tidak ada tagihan mendekati jatuh tempo"
                desc="Tambahkan hutang/tagihan dengan tanggal jatuh tempo untuk mendapat reminder."
              />
            ) : (
              <div className="space-y-2">
                {reminders.map(r => {
                  const days = r.daysLeft!;
                  const isUrgent = days <= 3;
                  const isWarning = days <= 7;
                  const color = isUrgent ? "#dc2626" : isWarning ? "#d97706" : "#0f766e";
                  const bg = isUrgent ? "rgba(220,38,38,0.06)" : isWarning ? "rgba(217,119,6,0.06)" : "rgba(20,184,166,0.06)";

                  return (
                    <motion.div key={r.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-4 rounded-xl p-4"
                      style={{ background: bg, border: `1px solid ${color}30` }}>
                      <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{r.name}</p>
                        <p className="text-xs text-slate-700">{(DEBT_ICONS as any)[r.category]}{" "}{r.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold font-mono" style={{ color }}>{formatRupiah(r.amount, true)}</p>
                        <p className="text-xs font-semibold" style={{ color }}>
                          {days === 0 ? "Hari ini!" : days < 0 ? `${Math.abs(days)} hari lalu` : `${days} hari lagi`}
                        </p>
                      </div>
                      <button onClick={() => togglePaid(r.id)}
                        className="p-1.5 rounded-lg hover:bg-white/60 transition-colors"
                        title="Tandai lunas">
                        <Check className="w-4 h-4 text-teal-600" />
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Helper Cards ───────────────────────────────────────────────────────────

function AssetCard({ asset, onEdit, onDelete }: { asset: Asset; onEdit: () => void; onDelete: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 rounded-xl p-4"
      style={{ background: "#fff", border: "1px solid #e2e8f0" }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${ASSET_COLORS[asset.category]}20`, color: ASSET_COLORS[asset.category] }}>
        {ASSET_ICONS[asset.category]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate">{asset.name}</p>
        <p className="text-xs text-slate-400">{asset.category}{asset.note ? ` · ${asset.note}` : ""}</p>
      </div>
      <p className="text-sm font-bold font-mono text-teal-700 flex-shrink-0">{formatRupiah(asset.value, true)}</p>
      <div className="flex gap-1">
        <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
          <Pencil className="w-3.5 h-3.5 text-slate-400" />
        </button>
        <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
          <Trash2 className="w-3.5 h-3.5 text-red-400" />
        </button>
      </div>
    </motion.div>
  );
}

function DebtCard({ debt, onEdit, onDelete, onTogglePaid }: {
  debt: Debt; onEdit: () => void; onDelete: () => void; onTogglePaid: () => void;
}) {
  const daysLeft = getDaysUntil(debt.dueDate);
  const isOverdue = daysLeft !== null && daysLeft < 0 && !debt.isPaid;

  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 rounded-xl p-4"
      style={{
        background: debt.isPaid ? "rgba(34,197,94,0.04)" : isOverdue ? "rgba(220,38,38,0.04)" : "#fff",
        border: `1px solid ${debt.isPaid ? "#86efac" : isOverdue ? "#fca5a5" : "#e2e8f0"}`,
        opacity: debt.isPaid ? 0.7 : 1,
      }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
          background: debt.isPaid ? "#dcfce7" : isOverdue ? "#fee2e2" : "#fff1f2",
          color: debt.isPaid ? "#16a34a" : isOverdue ? "#dc2626" : "#e11d48",
        }}>
        {DEBT_ICONS[debt.category]}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${debt.isPaid ? "line-through text-slate-400" : "text-slate-800"}`}>
          {debt.name}
        </p>
        <p className="text-xs text-slate-400">
          {debt.category}
          {debt.dueDate && !debt.isPaid && daysLeft !== null && (
            <span style={{ color: daysLeft <= 3 ? "#dc2626" : daysLeft <= 7 ? "#d97706" : "#64748b" }}>
              {" "}· {daysLeft === 0 ? "Hari ini!" : daysLeft < 0 ? `Lewat ${Math.abs(daysLeft)} hari` : `${daysLeft} hari lagi`}
            </span>
          )}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold font-mono" style={{ color: debt.isPaid ? "#22c55e" : "#e11d48" }}>
          {formatRupiah(debt.amount, true)}
        </p>
        {debt.monthlyPayment && (
          <p className="text-[10px] text-slate-400">{formatRupiah(debt.monthlyPayment, true)}/bln</p>
        )}
      </div>
      <div className="flex gap-1">
        <button onClick={onTogglePaid}
          className={`p-1.5 rounded-lg transition-colors ${debt.isPaid ? "hover:bg-slate-100" : "hover:bg-green-50"}`}
          title={debt.isPaid ? "Tandai belum lunas" : "Tandai lunas"}>
          <Check className={`w-3.5 h-3.5 ${debt.isPaid ? "text-slate-400" : "text-green-500"}`} />
        </button>
        <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
          <Pencil className="w-3.5 h-3.5 text-slate-400" />
        </button>
        <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
          <Trash2 className="w-3.5 h-3.5 text-red-400" />
        </button>
      </div>
    </motion.div>
  );
}

function EmptyState({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center gap-3"
      style={{ background: "rgba(241,245,249,0.5)", borderRadius: "16px", border: "1px dashed #cbd5e1" }}>
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-slate-700"
        style={{ background: "#f1f5f9" }}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-700">{title}</p>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">{desc}</p>
      </div>
    </div>
  );
}
