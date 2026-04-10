"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Heart, LogIn, X } from "lucide-react";
import Image from "next/image";

interface HeaderProps {
  hasData: boolean;
  onReset: () => void;
  onDonasi?: () => void;
}

function SoonTooltip({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="absolute top-full right-0 mt-2 z-50"
    >
      <div
        className="relative rounded-xl p-3 w-56 shadow-xl text-xs text-slate-300 leading-relaxed"
        style={{ background: "#1e293b", border: "1px solid #334155" }}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-slate-600 hover:text-slate-400"
        >
          <X className="w-3 h-3" />
        </button>
        <p className="font-semibold text-slate-100 mb-1">🔐 Login — Segera Hadir</p>
        <p className="text-slate-400">
          Simpan riwayat transaksi, akses dari mana saja, dan unlock fitur pro.
          Daftar gratis selamanya!
        </p>
        {/* Arrow */}
        <div
          className="absolute -top-1.5 right-6 w-3 h-3 rotate-45"
          style={{ background: "#1e293b", borderTop: "1px solid #334155", borderLeft: "1px solid #334155" }}
        />
      </div>
    </motion.div>
  );
}

export function Header({ hasData, onReset, onDonasi }: HeaderProps) {
  const [showSoon, setShowSoon] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full glass border-b border-white/[0.05]">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <Image src="/logo.svg" alt="OprexDuit" width={32} height={32} className="rounded-xl" />
          <div>
            <span className="text-sm font-semibold text-slate-100 tracking-tight">
              Oprex<span className="text-teal-400">Duit</span>
            </span>
            <p className="hidden sm:block text-[10px] text-slate-500 leading-none mt-0.5">
              Ngatur duit, beres.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          {hasData && (
            <motion.button
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={onReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-all border border-white/[0.06]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Upload Baru</span>
            </motion.button>
          )}

          <button
            onClick={onDonasi}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all"
            style={{ color: "#2dd4bf", border: "1px solid rgba(20,184,166,0.20)", background: "rgba(20,184,166,0.06)" }}
          >
            <Heart className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Donasi</span>
          </button>

          {/* Login — Soon */}
          <div className="relative">
            <button
              onClick={() => setShowSoon((p) => !p)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all"
              style={{ color: "#94a3b8", border: "1px solid #1e293b", background: "#0f172a" }}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Masuk</span>
              <span
                className="hidden sm:inline text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: "#1d4ed8", color: "#93c5fd" }}
              >
                SOON
              </span>
            </button>
            <AnimatePresence>
              {showSoon && <SoonTooltip onClose={() => setShowSoon(false)} />}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}



