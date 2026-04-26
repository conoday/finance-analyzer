import { type ReactNode } from "react";
import { type LucideIcon } from "lucide-react";

type HeroTone = "teal" | "violet" | "blue" | "amber" | "rose";

const TONE_STYLES: Record<HeroTone, { icon: string; badge: string; glow: string }> = {
  teal: {
    icon: "bg-teal-100 text-teal-700 border border-teal-200",
    badge: "bg-teal-100 text-teal-700 border border-teal-200",
    glow: "bg-teal-300/30",
  },
  violet: {
    icon: "bg-violet-100 text-violet-700 border border-violet-200",
    badge: "bg-violet-100 text-violet-700 border border-violet-200",
    glow: "bg-violet-300/30",
  },
  blue: {
    icon: "bg-sky-100 text-sky-700 border border-sky-200",
    badge: "bg-sky-100 text-sky-700 border border-sky-200",
    glow: "bg-sky-300/30",
  },
  amber: {
    icon: "bg-amber-100 text-amber-700 border border-amber-200",
    badge: "bg-amber-100 text-amber-700 border border-amber-200",
    glow: "bg-amber-300/30",
  },
  rose: {
    icon: "bg-rose-100 text-rose-700 border border-rose-200",
    badge: "bg-rose-100 text-rose-700 border border-rose-200",
    glow: "bg-rose-300/30",
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

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-white/80 bg-white/85 px-5 py-5 shadow-[0_14px_36px_rgba(15,23,42,0.07)] backdrop-blur md:px-6 md:py-6">
      <div className="pointer-events-none absolute inset-0">
        <div className={`absolute -left-8 top-1 h-28 w-28 rounded-full blur-2xl ${styles.glow}`} />
        <div className="absolute right-[-20px] top-[-14px] h-24 w-24 rounded-full bg-slate-100/80 blur-2xl" />
      </div>

      <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <div className="mb-3 flex items-center gap-3">
            <span className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${styles.icon}`}>
              <Icon className="h-5 w-5" />
            </span>
            <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${styles.badge}`}>
              {badge}
            </span>
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 md:text-2xl">{title}</h1>
          <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
        </div>

        {actions ? <div className="w-full md:w-auto">{actions}</div> : null}
      </div>
    </section>
  );
}
