"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Download, Heart, X, Copy, Check } from "lucide-react";
import type { AnalysisResult } from "@/types";
import { formatRupiah } from "@/lib/utils";

interface SharePanelProps {
  data: AnalysisResult;
}

/* ─────────────────────────────────────────────
   WhatsApp share text generator
   ───────────────────────────────────────────── */
function buildWAText(data: AnalysisResult): string {
  const s = data.summary;
  const savingsRate =
    s.total_income > 0 ? Math.round((s.net_cashflow / s.total_income) * 100) : 0;
  const healthScore = data.health_report?.overall ?? null;
  const topCat = data.by_category[0];

  const lines = [
    `📊 *Laporan Keuangan Saya*`,
    `📅 ${s.date_range}`,
    ``,
    `💰 Pemasukan: *${formatRupiah(s.total_income, true)}*`,
    `💸 Pengeluaran: *${formatRupiah(s.total_expense, true)}*`,
    `📈 Net Cash Flow: *${s.net_cashflow >= 0 ? "+" : ""}${formatRupiah(s.net_cashflow, true)}*`,
    `💪 Savings Rate: *${savingsRate}%*`,
    healthScore !== null ? `🏥 Health Score: *${healthScore}/100* (${data.health_report!.grade})` : null,
    topCat ? `🔝 Pengeluaran terbesar: *${topCat.kategori}* (${topCat.pct.toFixed(1)}%)` : null,
    ``,
    `_Dianalisis dengan OprexDuit_`,
    `https://finance-analyzer-roan.vercel.app`,
  ]
    .filter(Boolean)
    .join("\n");

  return lines;
}

/* ─────────────────────────────────────────────
   CSV export
   ───────────────────────────────────────────── */
function exportCSV(data: AnalysisResult) {
  const headers = ["Tanggal", "Deskripsi", "Debit", "Kredit", "Kategori", "Tipe"];
  const rows = data.transactions.map((t) => [
    t.tanggal,
    `"${t.deskripsi.replace(/"/g, '""')}"`,
    t.debit || "",
    t.kredit || "",
    t.kategori,
    t.tipe,
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `finance-export-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ─────────────────────────────────────────────
   QRIS Donation Modal
   ───────────────────────────────────────────── */
export function DonasiModal({ onClose }: { onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const copyText = () => {
    navigator.clipboard.writeText("OprexDuit - Donasi via QRIS").then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 20 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="glass-strong rounded-2xl border border-white/10 p-6 w-full max-w-sm space-y-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-400 fill-red-400" />
            <span className="text-sm font-semibold text-slate-100">Dukung Pengembang</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          OprexDuit 100% gratis. Kalau tools ini membantu ngatur keuanganmu,
          kamu bisa traktir kopi ☕ lewat QRIS di bawah ini.
        </p>

        {/* QRIS */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-52 h-52 rounded-xl overflow-hidden border border-white/10">
            <img src="/qris.jpeg" alt="QRIS Donasi OprexDuit" className="w-full h-full object-contain" />
          </div>

          <button
            onClick={copyText}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Tersalin!" : "Salin nama rekening"}
          </button>
        </div>

        <p className="text-[10px] text-slate-600 text-center">
          QRIS berlaku untuk semua dompet digital (GoPay, OVO, Dana, ShopeePay, dll.)
        </p>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl text-sm font-medium text-slate-300 border border-white/[0.08] hover:bg-white/5 transition-all"
        >
          Tutup
        </button>
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   Main SharePanel component
   ───────────────────────────────────────────── */
export function SharePanel({ data, onDonasi }: SharePanelProps & { onDonasi?: () => void }) {
  const handleWA = () => {
    const text = buildWAText(data);
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleExport = () => exportCSV(data);

  return (
    <>
      {/* Floating action bar at bottom */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 glass-strong rounded-2xl border border-white/[0.10] px-4 py-3 shadow-2xl"
      >
        {/* WA Share */}
        <button
          onClick={handleWA}
          title="Bagikan ke WhatsApp"
          className="btn-wa flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all"
          style={{ background: "linear-gradient(135deg, #25d366 0%, #128c7e 100%)" }}
        >
          <MessageCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Bagikan ke WA</span>
          <span className="sm:hidden">WA</span>
        </button>

        {/* CSV Export */}
        <button
          onClick={handleExport}
          title="Export CSV"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-200 border border-white/[0.08] hover:bg-white/5 transition-all"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Export CSV</span>
          <span className="sm:hidden">CSV</span>
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-white/[0.08]" />

        {/* Donasi */}
        <button
          onClick={onDonasi}
          title="Donasi"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-amber-300 border border-amber-500/20 hover:bg-amber-500/8 transition-all"
        >
          <Heart className="w-4 h-4" />
          <span className="hidden sm:inline">Donasi</span>
        </button>
      </motion.div>
    </>
  );
}
