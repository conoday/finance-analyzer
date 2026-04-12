"use client";

/**
 * SharedBudgetRoom.tsx
 * Fitur kolaborasi budget: Couple / Family / Group / Team / Business / dst.
 * - Buat room dengan invite code
 * - Gabung room orang lain
 * - Lihat pengeluaran + budget semua anggota
 * - Sync data analisis ke room
 * Disimpan di localStorage (no login), room data di backend (in-memory).
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Link2, Copy, Check, Plus, LogIn, RefreshCw,
  Crown, ChevronDown, ChevronUp, AlertTriangle, TrendingUp,
  TrendingDown, Wallet, Share2, X, UserPlus, Sparkles,
} from "lucide-react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, Cell,
  PieChart, Pie,
} from "recharts";
import { formatRupiah } from "@/lib/utils";
import type { CategoryRow, SharedRoom, RoomMember, PlanType, Summary } from "@/types";
import { PLAN_META } from "@/types";

// ─── local storage keys ────────────────────────────────────────────────────
const LS_MEMBER_ID  = "oprexduit_member_id";
const LS_ROOM_STATE = "oprexduit_room";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ─── helpers ───────────────────────────────────────────────────────────────
function getMemberId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(LS_MEMBER_ID);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(LS_MEMBER_ID, id);
  }
  return id;
}

function loadRoomState(): { room_id: string; member_id: string } | null {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem(LS_ROOM_STATE) ?? "null"); }
  catch { return null; }
}

function saveRoomState(room_id: string, member_id: string) {
  localStorage.setItem(LS_ROOM_STATE, JSON.stringify({ room_id, member_id }));
}

function clearRoomState() {
  localStorage.removeItem(LS_ROOM_STATE);
}

// ─── plan selector card ────────────────────────────────────────────────────
function PlanCard({ plan, selected, onClick }: {
  plan: PlanType; selected: boolean; onClick: () => void;
}) {
  const meta = PLAN_META[plan];
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="text-left rounded-xl p-3 border transition-all"
      style={{
        background: selected ? `${meta.color}15` : "rgba(255,255,255,0.04)",
        borderColor: selected ? meta.color : "rgba(255,255,255,0.08)",
        boxShadow: selected ? `0 0 0 1px ${meta.color}50` : "none",
      }}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-bold" style={{ color: meta.color }}>{meta.label}</span>
        <span className="text-[10px] font-mono text-slate-500">
          {meta.maxMembers === -1 ? "∞" : `≤${meta.maxMembers}`}
        </span>
      </div>
      <p className="text-[10px] text-slate-500 leading-snug">{meta.desc}</p>
      <p className="text-[10px] font-semibold mt-1" style={{ color: meta.color }}>
        {meta.price === 0 ? "Gratis" : meta.price === -1 ? "Hubungi kami" : formatRupiah(meta.price, true) + "/bulan"}
      </p>
    </motion.button>
  );
}

// ─── member avatar ─────────────────────────────────────────────────────────
function Avatar({ member, size = 32 }: { member: RoomMember; size?: number }) {
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold text-white shrink-0"
      style={{ width: size, height: size, background: member.color, fontSize: size * 0.4 }}
    >
      {member.display_name.slice(0, 1).toUpperCase()}
    </div>
  );
}

// ─── custom tooltip for recharts ───────────────────────────────────────────
function RupiahTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-lg px-3 py-2 text-xs space-y-1 border border-white/10 shadow-xl">
      <p className="font-semibold text-slate-300 mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-400">{p.name}:</span>
          <span className="font-mono font-bold" style={{ color: p.color }}>
            {formatRupiah(p.value, true)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── member spending card ──────────────────────────────────────────────────
function MemberCard({ member, isMe, isCreator }: {
  member: RoomMember; isMe: boolean; isCreator: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const summary = member.summary;
  const income  = summary?.total_income  ?? 0;
  const expense = summary?.total_expense ?? 0;
  const net     = summary?.net_cashflow  ?? 0;
  const savingsRate = income > 0 ? Math.round((net / income) * 100) : 0;

  const pieData = member.by_category.slice(0, 6).map((c) => ({
    name: c.kategori, value: c.total,
  }));

  const COLORS = ["#14b8a6","#6366f1","#f59e0b","#ec4899","#22c55e","#3b82f6"];

  return (
    <motion.div
      layout
      className="glass rounded-xl overflow-hidden border"
      style={{ borderColor: isMe ? member.color : "rgba(255,255,255,0.06)" }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <div className="relative">
          <Avatar member={member} size={40} />
          {isCreator && (
            <Crown className="w-3.5 h-3.5 absolute -top-1 -right-1" style={{ color: "#f59e0b" }} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-slate-200 truncate">{member.display_name}</span>
            {isMe && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                style={{ background: `${member.color}20`, color: member.color }}>Kamu</span>
            )}
          </div>
          {summary ? (
            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
              <span className="text-[11px] font-mono text-green-400">
                ↑ {formatRupiah(income, true)}
              </span>
              <span className="text-[11px] font-mono text-red-400">
                ↓ {formatRupiah(expense, true)}
              </span>
              <span className="text-[10px] rounded-full px-1.5 py-0.5 font-semibold"
                style={{
                  background: savingsRate >= 20 ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
                  color: savingsRate >= 20 ? "#4ade80" : "#f87171",
                }}>
                {savingsRate >= 0 ? "+" : ""}{savingsRate}%
              </span>
            </div>
          ) : (
            <p className="text-[11px] text-slate-600 mt-0.5">Belum sync data</p>
          )}
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-slate-600 hover:text-slate-400 transition-colors"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Progress bar income vs expense */}
      {summary && (
        <div className="px-4 pb-3">
          <div className="relative h-2 rounded-full overflow-hidden" style={{ background: "rgba(34,197,94,0.12)" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: income > 0 ? `${Math.min((expense / income) * 100, 100)}%` : "0%" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute left-0 top-0 h-full rounded-full"
              style={{
                background: expense > income
                  ? "linear-gradient(90deg, #ef4444, #f97316)"
                  : expense / income > 0.8
                  ? "linear-gradient(90deg, #f59e0b, #fb923c)"
                  : "linear-gradient(90deg, #14b8a6, #22c55e)",
              }}
            />
          </div>
        </div>
      )}

      {/* Expanded: pie chart + budget list */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4">

              {/* Spending donut */}
              {pieData.length > 0 && (
                <div>
                  <p className="text-[10px] text-slate-500 mb-2 uppercase tracking-wide">Distribusi Pengeluaran</p>
                  <div className="flex items-center gap-4">
                    <ResponsiveContainer width={90} height={90}>
                      <PieChart>
                        <Pie data={pieData} dataKey="value" cx="50%" cy="50%"
                          innerRadius={25} outerRadius={42} paddingAngle={2}>
                          {pieData.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 space-y-1">
                      {pieData.map((d, i) => (
                        <div key={d.name} className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                          <span className="text-[10px] text-slate-400 truncate flex-1">{d.name}</span>
                          <span className="text-[10px] font-mono text-slate-300">{formatRupiah(d.value, true)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Personal budget limits */}
              {Object.keys(member.budgets).length > 0 && (
                <div>
                  <p className="text-[10px] text-slate-500 mb-2 uppercase tracking-wide">Budget Pribadi</p>
                  <div className="space-y-1.5">
                    {Object.entries(member.budgets).slice(0, 6).map(([cat, limit]) => {
                      const actual = member.by_category.find(c => c.kategori === cat)?.total ?? 0;
                      const pct = limit > 0 ? Math.min((actual / limit) * 100, 100) : 0;
                      const over = actual > limit && limit > 0;
                      return (
                        <div key={cat}>
                          <div className="flex justify-between text-[10px] mb-0.5">
                            <span className="text-slate-400 truncate">{cat}</span>
                            <span className={over ? "text-red-400" : "text-slate-500"}>
                              {formatRupiah(actual, true)} / {formatRupiah(limit, true)}
                              {over && " ⚠"}
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.6 }}
                              className="h-full rounded-full"
                              style={{ background: over ? "#ef4444" : pct > 80 ? "#f59e0b" : member.color }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── combined bar chart for all members ───────────────────────────────────
function MemberCompareChart({ room }: { room: SharedRoom }) {
  const membersWithData = room.members.filter(m => m.summary);
  if (membersWithData.length < 1) return null;

  const chartData = [
    {
      label: "Pemasukan",
      ...Object.fromEntries(membersWithData.map(m => [
        m.display_name, m.summary?.total_income ?? 0,
      ])),
    },
    {
      label: "Pengeluaran",
      ...Object.fromEntries(membersWithData.map(m => [
        m.display_name, m.summary?.total_expense ?? 0,
      ])),
    },
    {
      label: "Net",
      ...Object.fromEntries(membersWithData.map(m => [
        m.display_name, m.summary?.net_cashflow ?? 0,
      ])),
    },
  ];

  return (
    <div className="glass rounded-xl p-4">
      <p className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wide">
        Perbandingan Anggota
      </p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} barGap={4}>
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
          <YAxis tick={false} axisLine={false} tickLine={false} width={0} />
          <Tooltip content={<RupiahTooltip />} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10, color: "#94a3b8" }} />
          {membersWithData.map((m) => (
            <Bar key={m.member_id} dataKey={m.display_name} fill={m.color} radius={[4, 4, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── shared budget rows ────────────────────────────────────────────────────
function SharedBudgetTable({ room, isCreator, memberId }: {
  room: SharedRoom; isCreator: boolean; memberId: string;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [val, setVal] = useState("");
  const [saving, setSaving] = useState(false);

  // Aggregate actual spending across all members per category
  const aggregated: Record<string, number> = {};
  for (const m of room.members) {
    for (const c of m.by_category) {
      aggregated[c.kategori] = (aggregated[c.kategori] ?? 0) + c.total;
    }
  }

  const categories = Array.from(
    new Set([...Object.keys(room.shared_budgets), ...Object.keys(aggregated)])
  );
  if (categories.length === 0) return (
    <div className="glass rounded-xl p-6 text-center text-slate-600 text-sm">
      Belum ada data pengeluaran dari anggota. Sync dulu data analisismu.
    </div>
  );

  async function saveSharedBudget(cat: string, newVal: number) {
    setSaving(true);
    const updated = { ...room.shared_budgets, [cat]: newVal };
    try {
      await fetch(`${API_URL}/rooms/${room.room_id}/sync`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          member_id: memberId,
          budgets: {},
          shared_budgets: updated,
        }),
      });
    } finally {
      setSaving(false);
      setEditing(null);
    }
  }

  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05]">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Budget Bersama</p>
        {!isCreator && <p className="text-[10px] text-slate-600">Hanya pembuat room yang bisa edit</p>}
      </div>
      <div className="divide-y divide-white/[0.04]">
        {categories.map((cat) => {
          const limit   = room.shared_budgets[cat] ?? 0;
          const actual  = aggregated[cat] ?? 0;
          const pct     = limit > 0 ? Math.min((actual / limit) * 100, 100) : 0;
          const over    = limit > 0 && actual > limit;
          const near    = limit > 0 && pct >= 80 && !over;
          return (
            <div key={cat} className="px-4 py-3">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-sm text-slate-300 flex-1 truncate">{cat}</span>
                {over && <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                {near && <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                <span className="text-xs font-mono text-slate-400">
                  {formatRupiah(actual, true)}
                  {limit > 0 && <> / {formatRupiah(limit, true)}</>}
                </span>
                {isCreator && (
                  editing === cat ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        autoFocus
                        value={val}
                        onChange={e => setVal(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter") saveSharedBudget(cat, Number(val));
                          if (e.key === "Escape") setEditing(null);
                        }}
                        className="w-24 text-xs px-2 py-0.5 rounded bg-white/10 text-slate-200 outline-none border border-white/20"
                        placeholder="0"
                      />
                      <button onClick={() => saveSharedBudget(cat, Number(val))}
                        className="text-teal-400 hover:text-teal-300">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setEditing(null)} className="text-slate-600 hover:text-slate-400">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditing(cat); setVal(String(limit || "")); }}
                      className="text-slate-600 hover:text-slate-400 transition-colors">
                      <Wallet className="w-3.5 h-3.5" />
                    </button>
                  )
                )}
              </div>
              {limit > 0 && (
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.7 }}
                    className="h-full rounded-full"
                    style={{
                      background: over
                        ? "linear-gradient(90deg,#ef4444,#f97316)"
                        : near
                        ? "linear-gradient(90deg,#f59e0b,#fbbf24)"
                        : "linear-gradient(90deg,#14b8a6,#22c55e)",
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── main component ────────────────────────────────────────────────────────
interface SharedBudgetRoomProps {
  byCategory?: CategoryRow[];
  summary?: Summary | null;
}

export function SharedBudgetRoom({ byCategory = [], summary = null }: SharedBudgetRoomProps) {
  const [step, setStep]     = useState<"idle" | "create" | "join" | "room">("idle");
  const [room, setRoom]     = useState<SharedRoom | null>(null);
  const [memberId, setMemberId] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [copied, setCopied]     = useState(false);
  const [syncing, setSyncing]   = useState(false);
  const [syncDone, setSyncDone] = useState(false);

  // Create form state
  const [displayName, setDisplayName] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("couple");

  // Join form state
  const [inviteCode, setInviteCode] = useState("");
  const [joinName, setJoinName]     = useState("");

  useEffect(() => {
    const mid = getMemberId();
    setMemberId(mid);
    const saved = loadRoomState();
    if (saved) {
      fetchRoom(saved.room_id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchRoom = useCallback(async (roomId: string) => {
    try {
      const res = await fetch(`${API_URL}/rooms/${roomId}`);
      if (!res.ok) { clearRoomState(); return; }
      const data: SharedRoom = await res.json();
      setRoom(data);
      setStep("room");
    } catch {
      clearRoomState();
    }
  }, []);

  async function handleCreate() {
    if (!displayName.trim()) { setError("Masukkan nama displaymu"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API_URL}/rooms/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_type: selectedPlan,
          display_name: displayName.trim(),
          member_id: memberId,
        }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail); }
      const data = await res.json();
      saveRoomState(data.room_id, data.member_id);
      await fetchRoom(data.room_id);
    } catch (e: any) {
      setError(e.message ?? "Gagal membuat room");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    if (!inviteCode.trim() || !joinName.trim()) {
      setError("Isi kode undangan dan namamu"); return;
    }
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API_URL}/rooms/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invite_code: inviteCode.trim(),
          display_name: joinName.trim(),
          member_id: memberId,
        }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail); }
      const data = await res.json();
      saveRoomState(data.room_id, memberId);
      setRoom(data.room);
      setStep("room");
    } catch (e: any) {
      setError(e.message ?? "Gagal bergabung");
    } finally {
      setLoading(false);
    }
  }

  async function handleSyncData() {
    if (!room) return;
    const me = room.members.find(m => m.member_id === memberId);
    if (!me) return;
    setSyncing(true);
    try {
      await fetch(`${API_URL}/rooms/${room.room_id}/sync`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          member_id: memberId,
          budgets: me.budgets,
          summary: summary ? { ...summary } : null,
          by_category: byCategory,
        }),
      });
      await fetchRoom(room.room_id);
      setSyncDone(true);
      setTimeout(() => setSyncDone(false), 3000);
    } finally {
      setSyncing(false);
    }
  }

  function copyInviteCode() {
    if (!room) return;
    navigator.clipboard.writeText(room.invite_code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  function leaveRoom() {
    clearRoomState();
    setRoom(null);
    setStep("idle");
  }

  const me          = room?.members.find(m => m.member_id === memberId);
  const isCreator   = room?.members[0]?.member_id === memberId;
  const planMeta    = room ? PLAN_META[room.plan_type] : null;
  const totalIncome = room?.members.reduce((s, m) => s + (m.summary?.total_income  ?? 0), 0) ?? 0;
  const totalExp    = room?.members.reduce((s, m) => s + (m.summary?.total_expense ?? 0), 0) ?? 0;
  const totalNet    = totalIncome - totalExp;

  // ── IDLE: choose action ────────────────────────────────────────────────
  if (step === "idle") return (
    <div className="max-w-xl mx-auto space-y-5 py-4">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium"
          style={{ background: "rgba(99,102,241,0.10)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.20)" }}>
          <Sparkles className="w-3 h-3" />
          Shared Budget Room
        </div>
        <h3 className="text-xl font-bold text-slate-200">Pantau keuangan bersama</h3>
        <p className="text-sm text-slate-500">
          Buat room, bagikan invite code, dan lihat pengeluaran semua anggota dalam satu dashboard.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={() => { setStep("create"); setError(""); }}
          className="glass rounded-xl p-5 flex flex-col items-center gap-2 border border-teal-500/20 hover:border-teal-500/40 transition-colors"
        >
          <div className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "rgba(20,184,166,0.12)" }}>
            <Plus className="w-5 h-5 text-teal-400" />
          </div>
          <span className="text-sm font-semibold text-slate-200">Buat Room</span>
          <span className="text-[10px] text-slate-500 text-center">Mulai room baru, pilih plan, undang orang</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={() => { setStep("join"); setError(""); }}
          className="glass rounded-xl p-5 flex flex-col items-center gap-2 border border-indigo-500/20 hover:border-indigo-500/40 transition-colors"
        >
          <div className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "rgba(99,102,241,0.12)" }}>
            <LogIn className="w-5 h-5 text-indigo-400" />
          </div>
          <span className="text-sm font-semibold text-slate-200">Gabung Room</span>
          <span className="text-[10px] text-slate-500 text-center">Punya kode undangan? Masuk di sini</span>
        </motion.button>
      </div>

      {/* plan tier preview */}
      <div>
        <p className="text-[10px] text-slate-600 mb-3 uppercase tracking-wide font-semibold">Pilihan Plan</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(["personal","couple","family","group","team","business","corporate","enterprise"] as PlanType[]).map(p => (
            <PlanCard key={p} plan={p} selected={false} onClick={() => { setSelectedPlan(p); setStep("create"); }} />
          ))}
        </div>
      </div>
    </div>
  );

  // ── CREATE form ────────────────────────────────────────────────────────
  if (step === "create") return (
    <div className="max-w-lg mx-auto space-y-5 py-4">
      <div className="flex items-center gap-2 mb-2">
        <button onClick={() => setStep("idle")} className="text-slate-600 hover:text-slate-400">
          <X className="w-4 h-4" />
        </button>
        <h3 className="text-base font-semibold text-slate-200">Buat Room Baru</h3>
      </div>

      <div>
        <label className="block text-xs text-slate-500 mb-1">Namamu di room ini</label>
        <input
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          placeholder="contoh: Andi"
          className="w-full rounded-lg px-3 py-2 text-sm text-slate-200 bg-white/[0.06] border border-white/10 outline-none focus:border-teal-500/50 transition-colors"
        />
      </div>

      <div>
        <label className="block text-xs text-slate-500 mb-2">Pilih Plan</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(["personal","couple","family","group","team","business","corporate","enterprise"] as PlanType[]).map(p => (
            <PlanCard key={p} plan={p} selected={selectedPlan === p} onClick={() => setSelectedPlan(p)} />
          ))}
        </div>
      </div>

      {error && <p className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>}

      <motion.button
        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
        onClick={handleCreate}
        disabled={loading}
        className="w-full py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-opacity"
        style={{ background: "linear-gradient(135deg, #14b8a6, #6366f1)", opacity: loading ? 0.7 : 1 }}
      >
        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        {loading ? "Membuat..." : "Buat Room"}
      </motion.button>
    </div>
  );

  // ── JOIN form ──────────────────────────────────────────────────────────
  if (step === "join") return (
    <div className="max-w-sm mx-auto space-y-4 py-4">
      <div className="flex items-center gap-2 mb-2">
        <button onClick={() => setStep("idle")} className="text-slate-600 hover:text-slate-400">
          <X className="w-4 h-4" />
        </button>
        <h3 className="text-base font-semibold text-slate-200">Gabung Room</h3>
      </div>

      <div>
        <label className="block text-xs text-slate-500 mb-1">Kode Undangan</label>
        <input
          value={inviteCode}
          onChange={e => setInviteCode(e.target.value.toUpperCase())}
          placeholder="XXXX1234"
          className="w-full rounded-lg px-3 py-2 text-sm font-mono font-bold tracking-widest text-slate-200 bg-white/[0.06] border border-white/10 outline-none focus:border-indigo-500/50 uppercase transition-colors"
          maxLength={8}
        />
      </div>

      <div>
        <label className="block text-xs text-slate-500 mb-1">Namamu</label>
        <input
          value={joinName}
          onChange={e => setJoinName(e.target.value)}
          placeholder="contoh: Sari"
          className="w-full rounded-lg px-3 py-2 text-sm text-slate-200 bg-white/[0.06] border border-white/10 outline-none focus:border-indigo-500/50 transition-colors"
        />
      </div>

      {error && <p className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>}

      <motion.button
        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
        onClick={handleJoin}
        disabled={loading}
        className="w-full py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2"
        style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", opacity: loading ? 0.7 : 1 }}
      >
        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
        {loading ? "Bergabung..." : "Gabung"}
      </motion.button>
    </div>
  );

  // ── ROOM dashboard ─────────────────────────────────────────────────────
  if (step === "room" && room) return (
    <div className="space-y-5">

      {/* Room header */}
      <div className="glass rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
              style={{ background: `${planMeta?.color}15`, color: planMeta?.color, border: `1px solid ${planMeta?.color}30` }}>
              <Users className="w-3 h-3" />
              {planMeta?.label}
            </div>
            <span className="text-xs text-slate-500">
              {room.member_count}/{room.max_members === -1 ? "∞" : room.max_members} anggota
            </span>
            {isCreator && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-medium">
                👑 Pembuat
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-slate-500 text-xs">Kode:</span>
            <code className="text-sm font-mono font-bold tracking-widest"
              style={{ color: planMeta?.color }}>
              {room.invite_code}
            </code>
            <button onClick={copyInviteCode}
              className="text-slate-600 hover:text-slate-300 transition-colors">
              {copied ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <span className="text-[10px] text-slate-600">Bagikan ke anggota lain</span>
          </div>
        </div>

        {/* Sync + actions */}
        <div className="flex items-center gap-2 shrink-0">
          {(byCategory.length > 0 || summary) && (
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={handleSyncData}
              disabled={syncing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: syncDone ? "rgba(34,197,94,0.15)" : "rgba(20,184,166,0.12)",
                color: syncDone ? "#4ade80" : "#14b8a6",
                border: `1px solid ${syncDone ? "rgba(34,197,94,0.3)" : "rgba(20,184,166,0.25)"}`,
              }}
            >
              {syncing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> :
               syncDone ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              {syncing ? "Syncing..." : syncDone ? "Tersync!" : "Sync Dataku"}
            </motion.button>
          )}
          <button onClick={() => fetchRoom(room.room_id)}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-white/5 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button onClick={leaveRoom}
            className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Combined stats */}
      {room.members.some(m => m.summary) && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Pemasukan", value: totalIncome, icon: TrendingUp, color: "#22c55e" },
            { label: "Total Pengeluaran", value: totalExp, icon: TrendingDown, color: "#f87171" },
            { label: "Net Bersama", value: totalNet, icon: Wallet,
              color: totalNet >= 0 ? "#4ade80" : "#f87171" },
          ].map(stat => (
            <div key={stat.label} className="glass rounded-xl p-3 flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${stat.color}15` }}>
                <stat.icon className="w-3.5 h-3.5" style={{ color: stat.color }} />
              </div>
              <div>
                <p className="text-sm font-bold font-mono" style={{ color: stat.color }}>
                  {formatRupiah(Math.abs(stat.value), true)}
                </p>
                <p className="text-[10px] text-slate-500 leading-snug">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Member comparison chart */}
      <MemberCompareChart room={room} />

      {/* Shared budget table */}
      <SharedBudgetTable room={room} isCreator={isCreator} memberId={memberId} />

      {/* Individual member cards */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 px-1">
          Budget Masing-Masing Anggota
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {room.members.map((m, i) => (
            <MemberCard
              key={m.member_id}
              member={m}
              isMe={m.member_id === memberId}
              isCreator={i === 0}
            />
          ))}

          {/* Invite slot (if room not full) */}
          {(room.max_members === -1 || room.member_count < room.max_members) && (
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="glass rounded-xl p-4 flex flex-col items-center justify-center gap-2 border border-dashed border-white/10 cursor-pointer min-h-[100px]"
              onClick={copyInviteCode}
            >
              <UserPlus className="w-6 h-6 text-slate-600" />
              <p className="text-xs text-slate-600 text-center">
                Undang anggota baru<br />
                <span className="font-mono font-bold text-slate-500">{room.invite_code}</span>
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );

  return null;
}
