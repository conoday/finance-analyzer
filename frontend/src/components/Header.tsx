"use client";

import { motion } from "framer-motion";
import { BarChart2, RefreshCw, Github } from "lucide-react";

interface HeaderProps {
  hasData: boolean;
  onReset: () => void;
}

export function Header({ hasData, onReset }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full glass border-b border-white/[0.06]">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center glow-blue">
            <BarChart2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-sm font-semibold text-slate-100">Finance Analyzer</span>
            <span className="hidden sm:block text-[11px] text-slate-500 leading-none">Personal Cash Flow Intelligence</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {hasData && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={onReset}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-all border border-white/[0.06]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Upload Baru
            </motion.button>
          )}
          <a
            href="https://github.com"
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
