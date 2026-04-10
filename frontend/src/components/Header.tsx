"use client";

import { motion } from "framer-motion";
import { BarChart2, RefreshCw, Github, Heart } from "lucide-react";

interface HeaderProps {
  hasData: boolean;
  onReset: () => void;
  onDonasi?: () => void;
}

export function Header({ hasData, onReset, onDonasi }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full glass border-b border-white/[0.05]">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between" style={{ height: 56 }}>
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center glow-amber">
            <BarChart2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-sm font-semibold text-slate-100 tracking-tight">Finance Analyzer</span>
            <p className="hidden sm:block text-[10px] text-slate-500 leading-none mt-0.5">Personal Cash Flow Intelligence</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {hasData && (
            <motion.button
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={onReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-all border border-white/[0.06]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Upload Baru
            </motion.button>
          )}
          <button
            onClick={onDonasi}
            title="Dukungan donasi"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/8 transition-all border border-amber-500/20"
          >
            <Heart className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Donasi</span>
          </button>
          <a
            href="https://github.com/conoday/finance-analyzer"
            target="_blank"
            rel="noreferrer"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all"
          >
            <Github className="w-4 h-4" />
          </a>
        </div>
      </div>
    </header>
  );
}

