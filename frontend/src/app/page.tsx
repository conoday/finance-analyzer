"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTransactions } from "@/hooks/useTransactions";
import { useAnalysis } from "@/hooks/useAnalysis";
import { ArrowUpRight, ArrowDownRight, MoreHorizontal, Calendar, Loader2, Sparkles, Filter, Target, Receipt, Search } from "lucide-react";
import Image from "next/image";
import { formatRupiah } from "@/lib/utils";

// Montra-style component structure
export default function Dashboard() {
  const { user } = useAuth();
  const { txs, loading: txLoading, isCloud } = useTransactions();
  const { data, status, analyzeMe } = useAnalysis();
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const [monthFilter, setMonthFilter] = useState<string>(currentMonthStr);

  useEffect(() => {
    if (user && status === "idle" && !data) {
      analyzeMe(monthFilter);
    }
  }, [user, status, analyzeMe, monthFilter]);

  const fullName = (user?.user_metadata?.full_name as string) ?? user?.email ?? "Guest";
  const firstName = fullName.split(" ")[0];

  // Derive simple metrics from data.summary for the overview
  const totalIncome = data?.summary?.total_income ?? 0;
  const totalExpense = data?.summary?.total_expense ?? 0;
  const netBalance = data?.summary?.net_cashflow ?? 0;

  const getCategoryColor = (cat: string) => {
    const lower = cat.toLowerCase();
    if (lower.includes("makan")) return "#df6b52"; // Coral
    if (lower.includes("transport")) return "#4ca2f6"; // Blue
    if (lower.includes("belanja")) return "#835ae6"; // Purple
    return "#bac5d4"; // Light gray fallback
  };

  const isLoading = status === "loading" || txLoading;

  return (
    <div className={`space-y-8 animate-fade-in pb-10 transition-opacity duration-300 ${isLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
      
      {/* ── 1. Page Header (Greeting) ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            {isLoading && <Loader2 className="w-5 h-5 animate-spin text-[#df6b52]" />}
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Hi, {fullName}</h1>
          </div>
          <p className="text-slate-500 text-sm mt-1">Stay updated on your finances with real-time data</p>
        </div>
        
        <div className="flex items-center gap-3">
          <input
            type="month"
            value={monthFilter}
            onChange={(e) => {
              setMonthFilter(e.target.value);
              analyzeMe(e.target.value || undefined);
            }}
            className="bg-white/70 backdrop-blur-md border border-white/40 focus:ring-2 focus:outline-none focus:ring-[#df6b52]/50 px-3 py-2 text-sm rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.03)] font-medium text-slate-800"
          />
          <button className="flex items-center gap-2 px-5 py-2.5 bg-[#df6b52] hover:bg-[#c95b45] text-white rounded-2xl text-sm font-semibold active:scale-[0.98] transition-all shadow-sm shadow-orange-200">
            <ArrowUpRight className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* ── 2. Top Grid Section ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xlg:grid-cols-3 gap-6">
        
        {/* Card A: Checking Account (Main Balance) */}
        <div className="bg-white rounded-3xl p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/60 flex flex-col justify-between" style={{ minHeight: '260px' }}>
          <div>
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
                 <WalletIcon />
              </div>
              <div className="px-3 py-1 bg-slate-50 rounded-full text-xs font-semibold text-slate-600 border border-slate-100 flex items-center gap-1.5">
                🇮🇩 IDR
              </div>
            </div>
            <h2 className="text-slate-800 font-semibold">Arus Kas (Net)</h2>
            <p className="text-slate-400 text-xs mt-1">Total selisih pemasukan dan pengeluaran</p>
          </div>
          
          <div className="mt-4">
            <div className="flex items-end justify-between mb-5">
              <h3 className="text-4xl font-extrabold text-slate-900 tracking-tight">{formatRupiah(netBalance)}</h3>
              <a href="/laporan" className="text-sm font-semibold text-[#df6b52] hover:underline">See details</a>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button className="bg-[#df6b52] hover:bg-[#c95b45] text-white rounded-2xl py-3.5 text-sm font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-sm shadow-orange-200">
                Pemasukan <ArrowDownRight className="w-4 h-4 opacity-80" />
              </button>
              <button className="bg-white border-2 border-[#df6b52] hover:bg-orange-50 text-[#df6b52] rounded-2xl py-3.5 text-sm font-bold flex items-center justify-center gap-2 transition-transform active:scale-95">
                Pengeluaran <ArrowUpRight className="w-4 h-4 opacity-80" />
              </button>
            </div>
          </div>
        </div>

        {/* Card B: Spending Overview */}
        <div className="bg-white rounded-3xl p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/60 flex flex-col justify-between" style={{ minHeight: '260px' }}>
          <div>
            <div className="flex justify-between items-start mb-6">
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
                 <PieChartIcon />
              </div>
              <button className="text-slate-400 hover:text-slate-600"><MoreHorizontal className="w-5 h-5"/></button>
            </div>
            <h2 className="text-slate-800 font-semibold mb-1">Kategori Pengeluaran</h2>
            <p className="text-slate-400 text-xs mb-6">Track Your Spending, Control Your Finance</p>
            
            {/* Segmented Bar */}
            <div className="flex h-4 rounded-full overflow-hidden gap-1 w-full bg-slate-100">
              {totalExpense > 0 && data?.by_category?.length ? (
                data.by_category.slice(0, 3).map((cat) => (
                  <div key={cat.kategori} style={{ width: `${(cat.total / totalExpense) * 100}%`, backgroundColor: getCategoryColor(cat.kategori) }} className="h-full rounded-full" title={`${cat.kategori} - ${formatRupiah(cat.total)}`} />
                ))
              ) : (
                <div className="w-full bg-slate-200" />
              )}
            </div>
          </div>
          
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-slate-400 text-xs mb-1">Total Pengeluaran Bulan Ini</p>
              <div className="flex items-center gap-3">
                 <h3 className="text-2xl font-bold text-slate-900">{formatRupiah(totalExpense)}</h3>
                 <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">+12%</span>
              </div>
            </div>
            <a href="/budget" className="text-sm font-semibold text-[#df6b52] hover:underline">See details</a>
          </div>
        </div>

        {/* Card C: Side Panel Cards (Stacked) */}
        <div className="flex flex-col gap-6 lg:col-span-2 xlg:col-span-1">
           <div className="bg-white rounded-3xl p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/60 flex-1">
             <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center border border-slate-100 bg-slate-50 rounded-lg"><Target className="w-4 h-4 text-slate-600"/></div>
                  <h3 className="font-semibold text-slate-900 text-sm">Aset & Tabungan</h3>
                </div>
                <MoreHorizontal className="w-4 h-4 text-slate-400" />
             </div>
             <p className="text-xs text-slate-400 mb-4">Plan Your Savings, Secure Your Future</p>
             <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border border-slate-100 hover:border-slate-200 shadow-sm rounded-2xl bg-white hover:bg-slate-50 transition-all cursor-pointer">
                   <div className="flex items-center gap-3">
                     <span className="text-lg">🏦</span>
                     <div>
                       <p className="text-sm font-semibold text-slate-800">Rekening Utama</p>
                       <p className="text-[11px] text-slate-400 font-medium">Rp5.000.000 / Rp10.000.000</p>
                     </div>
                   </div>
                   <ArrowRightIcon />
                </div>
                <div className="flex items-center justify-between p-3 border border-slate-100 hover:border-slate-200 shadow-sm rounded-2xl bg-white hover:bg-slate-50 transition-all cursor-pointer">
                   <div className="flex items-center gap-3">
                     <span className="text-lg">✈️</span>
                     <div>
                       <p className="text-sm font-semibold text-slate-800">Dana Liburan</p>
                       <p className="text-[11px] text-slate-400 font-medium text-[#df6b52]">Rp1.000.000 / Rp5.000.000</p>
                     </div>
                   </div>
                   <ArrowRightIcon />
                </div>
             </div>
             <a href="/aset" className="block w-full text-center mt-4 bg-[#df6b52] hover:bg-[#c95b45] text-white py-3 rounded-2xl text-sm font-bold transition-all shadow-sm shadow-orange-100">
               Lihat Semua Aset
             </a>
           </div>
        </div>

      </div>

      {/* ── 3. Bottom Grid Section ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Transactions Table (Spans 2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                 <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
                    <Receipt className="w-4 h-4 text-slate-600" />
                 </div>
                 <button className="text-slate-400 hover:text-slate-600 sm:hidden"><MoreHorizontal className="w-5 h-5"/></button>
              </div>
              <h2 className="text-slate-800 font-semibold">Transaksi Terbaru</h2>
              <p className="text-slate-400 text-xs">Track Your Spending, Stay in Control</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-slate-200 rounded-full px-3 py-1.5 bg-slate-50">
                <Search className="w-3.5 h-3.5 text-slate-400 mr-2" />
                <input type="text" placeholder="Search..." className="bg-transparent border-none outline-none text-xs w-24 text-slate-700" />
              </div>
              <button className="p-2 border border-slate-200 rounded-full hover:bg-slate-50 text-slate-500">
                <Filter className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Table proper */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-400">
                  <th className="font-medium pb-3 pl-2">Name</th>
                  <th className="font-medium pb-3">Type Transaction</th>
                  <th className="font-medium pb-3">Date & Time</th>
                  <th className="font-medium pb-3 text-right pr-4">Amount</th>
                </tr>
              </thead>
              <tbody>
                {!data?.transactions || data.transactions.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-10 text-slate-400 text-sm">Tidak ada transaksi bulan ini.</td></tr>
                ) : (
                  data.transactions.slice(0, 5).map((tx, idx) => {
                    const isIncome = tx.tipe === 'income';
                    const amount = Math.max(tx.kredit, tx.debit);
                    const Initial = tx.deskripsi.charAt(0).toUpperCase();
                    return (
                      <tr key={idx} className="border-b border-slate-100/50 hover:bg-white/50 transition-colors group">
                        <td className="py-4 pl-2">
                           <div className="flex items-center gap-3">
                             <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-sm`}
                                  style={{ backgroundColor: isIncome ? '#10b981' : '#0f172a' }}>
                               {Initial}
                             </div>
                             <span className="font-semibold text-slate-900 text-sm truncate max-w-[150px]">{tx.deskripsi}</span>
                           </div>
                        </td>
                        <td className="py-4">
                           <span className={`px-3 py-1 text-[10px] font-extrabold tracking-wider rounded-full ${isIncome ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                             {isIncome ? 'INCOME' : 'SPENDING'}
                           </span>
                        </td>
                        <td className="py-4 text-xs font-medium text-slate-500">
                          {new Date(tx.tanggal || '').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year:'numeric'})}
                        </td>
                        <td className={`py-4 text-right pr-4 text-sm font-bold ${isIncome ? 'text-[#10b981]' : 'text-slate-900'}`}>
                          {isIncome ? '+' : '-'}{formatRupiah(amount)}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-center">
            <a href="/transaksi" className="text-xs font-semibold text-slate-400 hover:text-slate-600">View All Transactions</a>
          </div>
        </div>

        {/* Payment Schedule Card (Col 3) */}
        <div className="bg-white rounded-3xl p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/60">
           <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
                   <Calendar className="w-4 h-4 text-slate-600" />
                </div>
              </div>
              <button className="text-slate-400 hover:text-slate-600"><MoreHorizontal className="w-5 h-5"/></button>
           </div>
           <h2 className="text-slate-800 font-semibold mb-1">Tagihan & Cicilan</h2>
           <p className="text-slate-400 text-xs mb-6">Track Your Payments, Stay on Schedule</p>
           
           <div className="space-y-4">
              {!data?.subscriptions || data.subscriptions.length === 0 ? (
                <p className="text-xs text-slate-400 py-4">Tidak ada tagihan terdeteksi bulan ini.</p>
              ) : (
                data.subscriptions.slice(0, 3).map((sub, i) => (
                  <div key={i} className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-bold">{sub.merchant.charAt(0).toUpperCase()}</div>
                       <div>
                         <p className="text-sm font-semibold text-slate-900">{sub.merchant}</p>
                         <p className="text-[11px] text-slate-400 capitalize">{sub.frekuensi}</p>
                       </div>
                     </div>
                     <p className="text-sm font-bold text-[#df6b52]">{formatRupiah(sub.estimated_monthly)}</p>
                  </div>
                ))
              )}
           </div>
        </div>

      </div>

    </div>
  );
}

// Inline pure SVG icons for precise styling
const SettingsIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
);
const WalletIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
);
const PieChartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>
);
const ArrowRightIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
);
