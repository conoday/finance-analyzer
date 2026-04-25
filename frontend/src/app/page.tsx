"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTransactions } from "@/hooks/useTransactions";
import { useAnalysis } from "@/hooks/useAnalysis";
import { ArrowUpRight, ArrowDownRight, MoreHorizontal, Calendar, Filter, Target, Receipt, Search, BarChart3 } from "lucide-react";
import { formatRupiah } from "@/lib/utils";

// Montra-style component structure
export default function Dashboard() {
  const { user } = useAuth();
  const { loading: txLoading } = useTransactions();
  const { data, status, analyzeMe } = useAnalysis();
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const [monthFilter, setMonthFilter] = useState<string>(currentMonthStr);

  useEffect(() => {
    if (user && status === "idle" && !data) {
      analyzeMe(monthFilter);
    }
  }, [user, status, data, analyzeMe, monthFilter]);

  // Derive simple metrics from data.summary for the overview
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
      
      {/* ── 1. Hero Balance Section ── */}
      <div className="flex flex-col items-center justify-center text-center mt-2 mb-10 relative">
        <p className="text-slate-500 text-sm font-medium mb-2">Total Arus Kas (Bulan Ini)</p>
        <div className="flex items-center gap-3">
          {isLoading ? (
             <div className="h-12 w-48 bg-slate-200 animate-pulse rounded-2xl my-2" />
          ) : (
             <h1 className="text-5xl sm:text-6xl font-extrabold text-slate-900 tracking-tighter leading-tight drop-shadow-sm">
               {formatRupiah(netBalance)}
             </h1>
          )}
        </div>
        
        {/* Month Picker Badge */}
        <div className="mt-5 flex items-center justify-center gap-1.5 bg-white border border-slate-200 rounded-full py-1.5 px-3 shadow-sm hover:shadow-md transition-shadow">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input
            type="month"
            value={monthFilter}
            onChange={(e) => {
              setMonthFilter(e.target.value);
              analyzeMe(e.target.value || undefined);
            }}
            className="bg-transparent border-none focus:ring-0 text-sm font-semibold text-slate-700 w-auto px-1 outline-none"
          />
        </div>

        {/* Quick Actions */}
        <div className="flex items-center justify-center gap-8 sm:gap-12 mt-10">
           <a href="/transaksi" className="group flex flex-col items-center gap-2.5">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center group-hover:bg-emerald-100 group-active:scale-95 transition-all shadow-sm">
                 <ArrowDownRight className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold text-slate-600">Pemasukan</span>
           </a>
           <a href="/transaksi" className="group flex flex-col items-center gap-2.5">
              <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center group-hover:bg-rose-100 group-active:scale-95 transition-all shadow-sm">
                 <ArrowUpRight className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold text-slate-600">Pengeluaran</span>
           </a>
           <a href="/laporan" className="group flex flex-col items-center gap-2.5">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center group-hover:bg-indigo-100 group-active:scale-95 transition-all shadow-sm">
                 <BarChart3 className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold text-slate-600">Analisa</span>
           </a>
           <a href="/budget" className="group flex flex-col items-center gap-2.5">
              <div className="w-14 h-14 bg-sky-50 text-sky-600 rounded-full flex items-center justify-center group-hover:bg-sky-100 group-active:scale-95 transition-all shadow-sm">
                 <Target className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold text-slate-600">Budget</span>
           </a>
        </div>
      </div>

      {/* ── 2. Top Grid Section ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xlg:grid-cols-2 gap-6">

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
            
            {/* Vertical Category List replacing Segmented Bar */}
            <div className="space-y-4">
              {totalExpense > 0 && data?.by_category?.length ? (
                data.by_category.slice(0, 3).map((cat) => {
                  const percent = Math.round((cat.total / totalExpense) * 100);
                  const color = getCategoryColor(cat.kategori);
                  return (
                    <div key={cat.kategori} className="flex items-center gap-4">
                       {/* Icon box */}
                       <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white shadow-sm" style={{ backgroundColor: color }}>
                          {cat.kategori.charAt(0).toUpperCase()}
                       </div>
                       {/* Text and bar */}
                       <div className="flex-1">
                          <div className="flex justify-between items-end mb-1.5">
                             <span className="text-sm font-semibold text-slate-800">{cat.kategori}</span>
                             <span className="text-xs font-bold text-slate-900">{formatRupiah(cat.total)}</span>
                          </div>
                          {/* Mini progress track */}
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                             <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: color }} />
                          </div>
                       </div>
                    </div>
                  )
                })
              ) : (
                <div className="py-4 text-center">
                   <p className="text-xs text-slate-400">Belum ada pengeluaran.</p>
                </div>
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
        <div className="flex flex-col gap-6">
           <div className="bg-white rounded-3xl p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/60 flex-1">
             <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center border border-slate-100 bg-slate-50 rounded-lg"><Target className="w-4 h-4 text-slate-600"/></div>
                  <h3 className="font-semibold text-slate-900 text-sm">Aset & Tabungan</h3>
                </div>
                <MoreHorizontal className="w-4 h-4 text-slate-400" />
             </div>
             <p className="text-xs text-slate-400 mb-4">Aset & tabungan Anda saat ini</p>
             <div className="space-y-3">
                <div className="flex items-center justify-between p-4 border border-slate-100 hover:border-slate-200 shadow-sm rounded-2xl bg-white hover:bg-slate-50 transition-all cursor-pointer">
                   <div className="flex items-center gap-3 w-full">
                     <span className="text-2xl">🏦</span>
                     <div className="flex-1">
                       <p className="text-sm font-semibold text-slate-800 flex justify-between">
                          Rekening Utama <span>Rp5.000.000</span>
                       </p>
                       <div className="w-full bg-slate-100 rounded-full h-1 mt-2">
                          <div className="bg-[#df6b52] h-1 rounded-full" style={{ width: '50%' }} />
                       </div>
                     </div>
                   </div>
                </div>
                <div className="flex items-center justify-between p-4 border border-slate-100 hover:border-slate-200 shadow-sm rounded-2xl bg-white hover:bg-slate-50 transition-all cursor-pointer">
                   <div className="flex items-center gap-3 w-full">
                     <span className="text-2xl">✈️</span>
                     <div className="flex-1">
                       <p className="text-sm font-semibold text-slate-800 flex justify-between">
                          Dana Liburan <span className="text-[#df6b52]">Rp1.000.000</span>
                       </p>
                       <div className="w-full bg-slate-100 rounded-full h-1 mt-2">
                          <div className="bg-sky-400 h-1 rounded-full" style={{ width: '20%' }} />
                       </div>
                     </div>
                   </div>
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
                  <tr>
                    <td colSpan={4} className="text-center py-16">
                       <div className="flex flex-col items-center justify-center gap-3">
                          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
                             <Receipt className="w-8 h-8 text-slate-300" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-700">Belum Ada Transaksi</p>
                            <p className="text-xs text-slate-400 mt-0.5">Catat pemasukan atau pengeluaran pertamamu bulan ini!</p>
                          </div>
                       </div>
                    </td>
                  </tr>
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
// Inline pure SVG icon for precise styling
const PieChartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>
);
