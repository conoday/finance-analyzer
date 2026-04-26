"use client";

import { type ReactNode } from "react";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDisplayMode } from "@/hooks/useDisplayMode";

type HeroTone = "teal" | "violet" | "blue" | "amber" | "rose";

const TONE_STYLES: Record<
  HeroTone,
  {
    icon: string;
    badge: string;
    glow: string;
    darkIcon: string;
    darkBadge: string;
    darkGlow: string;
    darkOrb: string;
  }
> = {
  teal: {
    icon: "bg-teal-100 text-teal-700 border border-teal-200",
    badge: "bg-teal-100 text-teal-700 border border-teal-200",
    glow: "bg-teal-300/30",
    darkIcon: "bg-emerald-400/15 text-emerald-200 border border-emerald-300/30",
    darkBadge: "bg-emerald-400/12 text-emerald-100 border border-emerald-300/30",
    darkGlow: "bg-emerald-400/20",
    darkOrb: "bg-cyan-400/20",
  },
  violet: {
    icon: "bg-violet-100 text-violet-700 border border-violet-200",
    badge: "bg-violet-100 text-violet-700 border border-violet-200",
    glow: "bg-violet-300/30",
    darkIcon: "bg-violet-400/15 text-violet-200 border border-violet-300/30",
    darkBadge: "bg-violet-400/12 text-violet-100 border border-violet-300/30",
    darkGlow: "bg-violet-400/20",
    darkOrb: "bg-indigo-400/20",
  },
  blue: {
    icon: "bg-sky-100 text-sky-700 border border-sky-200",
    badge: "bg-sky-100 text-sky-700 border border-sky-200",
    glow: "bg-sky-300/30",
    darkIcon: "bg-cyan-400/15 text-cyan-200 border border-cyan-300/30",
    darkBadge: "bg-cyan-400/12 text-cyan-100 border border-cyan-300/30",
    darkGlow: "bg-cyan-400/20",
    darkOrb: "bg-emerald-300/20",
  },
  amber: {
    icon: "bg-amber-100 text-amber-700 border border-amber-200",
    badge: "bg-amber-100 text-amber-700 border border-amber-200",
    glow: "bg-amber-300/30",
    darkIcon: "bg-amber-400/15 text-amber-100 border border-amber-300/35",
    darkBadge: "bg-amber-400/12 text-amber-100 border border-amber-300/35",
    darkGlow: "bg-amber-400/20",
    darkOrb: "bg-orange-400/20",
  },
  rose: {
    icon: "bg-rose-100 text-rose-700 border border-rose-200",
    badge: "bg-rose-100 text-rose-700 border border-rose-200",
    glow: "bg-rose-300/30",
    darkIcon: "bg-rose-400/15 text-rose-100 border border-rose-300/30",
    darkBadge: "bg-rose-400/12 text-rose-100 border border-rose-300/30",
    darkGlow: "bg-rose-400/20",
    darkOrb: "bg-red-400/20",
  },
};

type PageHeroProps = {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  badge: string;
  tone?: HeroTone;
  actions?: ReactNode;
};

export function PageHero({ icon: Icon, title, subtitle, badge, tone = "teal", actions }: PageHeroProps) {
  const styles = TONE_STYLES[tone];
  const { isShowtime } = useDisplayMode();

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[28px] px-5 py-5 md:px-6 md:py-6",
        isShowtime
          ? "oprex-panel border border-white/[0.12] bg-[#070b12]/85"
          : "border border-white/80 bg-white/85 shadow-[0_14px_36px_rgba(15,23,42,0.07)] backdrop-blur"
      )}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className={cn("absolute -left-8 top-1 h-28 w-28 rounded-full blur-2xl", isShowtime ? styles.darkGlow : styles.glow)} />
        <div
          className={cn(
            "absolute right-[-20px] top-[-14px] h-24 w-24 rounded-full blur-2xl",
            isShowtime ? styles.darkOrb : "bg-slate-100/80"
          )}
        />
      </div>

      <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <div className="mb-3 flex items-center gap-3">
            <span className={cn("inline-flex h-11 w-11 items-center justify-center rounded-xl", isShowtime ? styles.darkIcon : styles.icon)}>
              <Icon className="h-5 w-5" />
            </span>
            <span
              className={cn(
                "inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                isShowtime ? styles.darkBadge : styles.badge
              )}
            >
              {badge}
            </span>
          </div>
          <h1 className={cn("text-xl font-extrabold tracking-tight md:text-2xl", isShowtime ? "text-slate-100" : "text-slate-900")}>{title}</h1>
          <p className={cn("mt-1 text-sm", isShowtime ? "text-slate-300/80" : "text-slate-600")}>{subtitle}</p>
        </div>

        {actions ? <div className="w-full md:w-auto">{actions}</div> : null}
      </div>
    </section>
  );
}
