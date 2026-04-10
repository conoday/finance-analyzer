"use client";

import { useState } from "react";
import {
  LayoutDashboard, Users, AlertTriangle, FileText,
  BarChart2, Settings, ChevronRight, TrendingUp,
  TrendingDown, Upload, Activity, AlertCircle,
  CheckCircle, Clock, RefreshCw, Eye
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { motion } from "framer-motion";
import {
  MOCK_STATS, MOCK_USERS, MOCK_ISSUES,
  MOCK_DAILY_UPLOADS, MOCK_TIER_DISTRIBUTION, MOCK_REPORTS
} from "./data/mock";

type Page = "dashboard" | "users" | "issues" | "reports" | "settings";

/* ─── Sidebar ─── */
function Sidebar({ page, setPage }: { page: Page; setPage: (p: Page) => void }) {
  const links: { id: Page; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: "dashboard", label: "Dashboard",   icon: LayoutDashboard },
    { id: "users",     label: "Users",       icon: Users,        badge: MOCK_STATS.totalUsers },
    { id: "issues",    label: "Issues",      icon: AlertTriangle, badge: MOCK_ISSUES.filter(i => i.status === "open").length },
    { id: "reports",   label: "Reports",     icon: FileText },
    { id: "settings",  label: "Settings",    icon: Settings },
  ];

  return (
    <aside className="w-56 min-h-screen border-r border-border flex flex-col" style={{ background: "#0d0f14" }}>
      {/* Logo */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <BarChart2 className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-100">Finance Analyzer</div>
            <div className="text-[9px] text-slate-600">Admin Console</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {links.map((l) => (
          <button
            key={l.id}
            onClick={() => setPage(l.id)}
            className={`sidebar-link w-full ${page === l.id ? "active" : ""}`}
          >
            <l.icon className="w-4 h-4 shrink-0" />
            <span className="flex-1 text-left">{l.label}</span>
            {l.badge !== undefined && (
              <span className="badge badge-yellow text-[9px]">{l.badge}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border text-[10px] text-slate-600">
        Mock data — connects to API Phase 2
      </div>
    </aside>
  );
}

/* ─── Stat Card ─── */
function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">{label}</span>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div>
        <div className={`text-2xl font-bold font-mono ${color}`}>{value}</div>
        {sub && <div className="text-[11px] text-slate-600 mt-0.5">{sub}</div>}
      </div>
    </motion.div>
  );
}

/* ─── Dashboard Page ─── */
function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold text-slate-100">Dashboard</h1>
        <p className="text-xs text-slate-500 mt-0.5">Monitoring Finance Analyzer — data mock, sambung ke API di Phase 2</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users"    value={MOCK_STATS.totalUsers}     sub={`${MOCK_STATS.activeToday} aktif hari ini`} icon={Users}    color="text-blue-400" />
        <StatCard label="Uploads Today"  value={MOCK_STATS.uploadsToday}   sub={`Total ${MOCK_STATS.totalUploads}`}          icon={Upload}   color="text-emerald-400" />
        <StatCard label="Error Rate"     value={`${MOCK_STATS.errorRate}%`} sub="7 hari terakhir"                           icon={AlertCircle} color="text-red-400" />
        <StatCard label="Avg Health Score" value={MOCK_STATS.avgHealthScore} sub="semua user"                               icon={Activity} color="text-amber-400" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Daily uploads */}
        <div className="card p-4 lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Uploads per Hari</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={MOCK_DAILY_UPLOADS} barSize={24}>
              <XAxis dataKey="date" tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "#13161e", border: "1px solid #1e2230", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "#94a3b8" }}
              />
              <Bar dataKey="uploads" fill="#fbbf24" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tier distribution */}
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Tier Distribution</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={MOCK_TIER_DISTRIBUTION} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value">
                {MOCK_TIER_DISTRIBUTION.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "#13161e", border: "1px solid #1e2230", borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {MOCK_TIER_DISTRIBUTION.map((t) => (
              <div key={t.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: t.color }} />
                  <span className="text-slate-400">{t.name}</span>
                </div>
                <span className="text-slate-300 font-mono">{t.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent issues preview */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-200">Recent Issues</h3>
          <span className="badge badge-red">{MOCK_ISSUES.filter(i => i.status === "open").length} open</span>
        </div>
        <div className="space-y-2">
          {MOCK_ISSUES.slice(0, 3).map((issue) => (
            <div key={issue.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
              <div className={`mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                issue.severity === "high" ? "bg-red-500" : issue.severity === "medium" ? "bg-amber-500" : "bg-slate-600"
              }`} />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-slate-300 truncate">{issue.message}</div>
                <div className="text-[10px] text-slate-600 mt-0.5">{issue.user} · {issue.timestamp}</div>
              </div>
              <span className={`badge shrink-0 ${issue.status === "open" ? "badge-red" : "badge-green"}`}>
                {issue.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Users Page ─── */
function UsersPage() {
  const [search, setSearch] = useState("");
  const filtered = MOCK_USERS.filter(
    (u) => u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-100">Users</h1>
          <p className="text-xs text-slate-500">{MOCK_USERS.length} total</p>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari email..."
          className="px-3 py-2 rounded-lg text-xs text-slate-200 placeholder-slate-600 outline-none focus:ring-1 focus:ring-amber-500/40"
          style={{ background: "#13161e", border: "1px solid #1e2230" }}
        />
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              {["Email", "Tier", "Uploads", "Health", "Last Active", "Status"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-slate-500 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((u, i) => (
              <tr key={u.id} className={`border-b border-border last:border-0 ${i % 2 === 0 ? "" : "bg-white/[0.01]"}`}>
                <td className="px-4 py-3 text-slate-300">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`badge ${u.tier === "pro" ? "badge-yellow" : "badge-blue"}`}>{u.tier}</span>
                </td>
                <td className="px-4 py-3 font-mono text-slate-400">{u.uploads}</td>
                <td className="px-4 py-3">
                  {u.healthScore !== null ? (
                    <span className={`font-mono ${u.healthScore >= 75 ? "text-emerald-400" : u.healthScore >= 50 ? "text-amber-400" : "text-red-400"}`}>
                      {u.healthScore}
                    </span>
                  ) : <span className="text-slate-700">—</span>}
                </td>
                <td className="px-4 py-3 text-slate-500">{u.lastActive}</td>
                <td className="px-4 py-3">
                  <span className={`badge ${u.status === "active" ? "badge-green" : ""}`}
                    style={u.status !== "active" ? { background: "rgba(255,255,255,0.04)", color: "#64748b" } : {}}>
                    {u.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Issues Page ─── */
function IssuesPage() {
  const severityColor = (s: string) =>
    s === "high" ? "badge-red" : s === "medium" ? "badge-yellow" : "";

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-bold text-slate-100">Issues</h1>
        <p className="text-xs text-slate-500">{MOCK_ISSUES.filter(i => i.status === "open").length} open · {MOCK_ISSUES.filter(i => i.status === "resolved").length} resolved</p>
      </div>

      <div className="space-y-3">
        {MOCK_ISSUES.map((issue) => (
          <motion.div key={issue.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="card p-4 flex items-start gap-4">
            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
              issue.severity === "high" ? "bg-red-500" : issue.severity === "medium" ? "bg-amber-500" : "bg-slate-600"
            }`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <span className="text-sm text-slate-200 font-medium">{issue.type.replace("_", " ")}</span>
                <div className="flex gap-2 shrink-0">
                  <span className={`badge ${severityColor(issue.severity)}`}>{issue.severity}</span>
                  <span className={`badge ${issue.status === "open" ? "badge-red" : "badge-green"}`}>{issue.status}</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-1">{issue.message}</p>
              <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-600">
                <span>{issue.user}</span>
                <span>·</span>
                <span>{issue.timestamp}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ─── Reports Page ─── */
function ReportsPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-bold text-slate-100">Reports</h1>
        <p className="text-xs text-slate-500">Export & laporan sistem</p>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              {["Judul", "Dibuat", "Records", "Status", ""].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-slate-500 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_REPORTS.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-slate-300">{r.title}</td>
                <td className="px-4 py-3 text-slate-500">{r.generated}</td>
                <td className="px-4 py-3 font-mono text-slate-400">{r.records}</td>
                <td className="px-4 py-3">
                  <span className={`badge ${r.status === "ready" ? "badge-green" : "badge-yellow"}`}>
                    {r.status === "ready" ? <><CheckCircle className="w-2.5 h-2.5 mr-1" />ready</> : <><Clock className="w-2.5 h-2.5 mr-1" />pending</>}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {r.status === "ready" && (
                    <button className="flex items-center gap-1 text-amber-400 hover:text-amber-300 transition-colors">
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card p-4 border-dashed border-amber-500/20">
        <p className="text-xs text-slate-500">
          ⚠️ Reports dengan data real membutuhkan koneksi ke Supabase (Phase 2+).
          Saat ini semua data adalah mock. Lihat <code className="text-amber-400">admin-console/src/data/mock.ts</code>.
        </p>
      </div>
    </div>
  );
}

/* ─── Settings Page ─── */
function SettingsPage() {
  return (
    <div className="space-y-5">
      <h1 className="text-lg font-bold text-slate-100">Settings</h1>
      <div className="card p-5 space-y-4 max-w-lg">
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">API Backend URL</label>
          <input
            defaultValue={import.meta.env.VITE_API_URL || "https://finance-analyzer-a82j.onrender.com"}
            className="w-full px-3 py-2 rounded-lg text-xs text-slate-300 outline-none"
            style={{ background: "#0d0f14", border: "1px solid #1e2230" }}
            readOnly
          />
          <p className="text-[10px] text-slate-600 mt-1">Set via <code>VITE_API_URL</code> env var in Vercel</p>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Admin Version</label>
          <input
            defaultValue="v0.1.0 — Mock Mode (Phase 5 pending)"
            className="w-full px-3 py-2 rounded-lg text-xs text-slate-500 outline-none"
            style={{ background: "#0d0f14", border: "1px solid #1e2230" }}
            readOnly
          />
        </div>
        <div className="p-3 rounded-lg text-xs text-amber-400/80 border border-amber-500/20" style={{ background: "rgba(251,191,36,0.05)" }}>
          Admin console ini menggunakan mock data. Untuk data real, implementasi:
          <ul className="mt-1.5 space-y-0.5 list-disc list-inside text-amber-400/60">
            <li>Phase 2: Auth + Supabase user table</li>
            <li>Phase 3: Transaction + file_imports table</li>
            <li>Phase 5: Admin API endpoints di backend</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ─── Main App ─── */
export default function App() {
  const [page, setPage] = useState<Page>("dashboard");

  const pageComponents: Record<Page, React.ReactNode> = {
    dashboard: <DashboardPage />,
    users:     <UsersPage />,
    issues:    <IssuesPage />,
    reports:   <ReportsPage />,
    settings:  <SettingsPage />,
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar page={page} setPage={setPage} />
      <main className="flex-1 p-6 overflow-auto">
        {pageComponents[page]}
      </main>
    </div>
  );
}
