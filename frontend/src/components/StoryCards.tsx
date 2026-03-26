"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, ChevronDown } from "lucide-react";
import { formatRupiah, MOOD_EMOJI } from "@/lib/utils";
import type { MonthlyStory, OverallStory } from "@/types";

interface StoryCardsProps {
  stories: MonthlyStory[];
  overall: OverallStory;
}

export function StoryCards({ stories, overall }: StoryCardsProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {/* Overall story */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl border border-indigo-500/15 p-6"
      >
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-semibold text-slate-200">Ringkasan Keuangan</h3>
        </div>
        <h4 className="text-lg font-bold text-slate-100 mb-3">{overall.headline}</h4>
        <div className="space-y-2">
          {overall.paragraphs?.map((p, i) => (
            <p key={i} className="text-sm text-slate-400 leading-relaxed">{p}</p>
          ))}
        </div>
        {overall.highlights?.length > 0 && (
          <ul className="mt-4 space-y-1.5">
            {overall.highlights.map((h, i) => (
              <li key={i} className="text-xs text-slate-400 flex items-start gap-2">
                <span className="text-indigo-400 mt-0.5">--</span>
                {h}
              </li>
            ))}
          </ul>
        )}
      </motion.div>

      {/* Monthly stories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {stories.map((s, i) => {
          const isOpen = expanded === s.periode;
          return (
            <motion.div
              key={s.periode}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="glass rounded-xl border border-white/[0.06] overflow-hidden"
            >
              <button
                onClick={() => setExpanded(isOpen ? null : s.periode)}
                className="w-full p-4 text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{MOOD_EMOJI[s.mood] ?? "📋"}</span>
                    <span className="text-xs text-slate-400 font-medium">{s.periode}</span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-600 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </div>
                <p className="text-sm font-semibold text-slate-200 mt-2 leading-snug">{s.headline}</p>
                <div className="flex gap-4 mt-2 text-[11px]">
                  <span className="text-emerald-400">+{formatRupiah(s.income, true)}</span>
                  <span className="text-red-400">-{formatRupiah(s.expense, true)}</span>
                </div>
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 text-xs text-slate-400 leading-relaxed border-t border-white/[0.05] pt-3">
                      {s.body}
                      <p className="mt-2 text-slate-500">Top kategori: <span className="text-slate-300">{s.top_category}</span></p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
