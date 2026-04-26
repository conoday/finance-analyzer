import type { Metadata } from "next";
import { ShieldCheck, Sparkles } from "lucide-react";

// Auth pages are user-specific — never prerender at build time.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "OprexDuit — Masuk atau Daftar",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto w-full max-w-6xl px-2 py-4 md:px-4 md:py-10">
      <div className="pointer-events-none absolute inset-x-0 top-[-24px] -z-10 h-[420px] rounded-[42px] bg-gradient-to-br from-teal-300/35 via-white to-sky-300/30 blur-3xl" />

      <div className="grid w-full gap-5 rounded-[32px] border border-white/80 bg-white/75 p-3 shadow-[0_24px_70px_rgba(15,23,42,0.12)] backdrop-blur md:grid-cols-[1.05fr_minmax(0,430px)] md:p-5">
        <section className="relative hidden overflow-hidden rounded-[26px] border border-teal-100/80 bg-gradient-to-br from-teal-500 to-sky-500 px-7 py-8 text-white md:flex md:flex-col md:justify-between">
          <div className="pointer-events-none absolute -right-14 top-[-90px] h-72 w-72 rounded-full bg-white/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 left-[-20px] h-64 w-64 rounded-full bg-white/20 blur-3xl" />

          <div className="relative z-10">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]">
              <Sparkles className="h-3.5 w-3.5" />
              Secure Finance Workspace
            </p>
            <h1 className="mt-5 max-w-sm text-3xl font-black leading-tight tracking-tight">
              Akses dashboard keuanganmu dalam satu ruang aman.
            </h1>
            <p className="mt-3 max-w-md text-sm text-white/85">
              Pantau transaksi, budget, dan insight bulanan tanpa repot. Masuk untuk lanjut kerja dengan ritme yang sama seperti dashboard utama.
            </p>
          </div>

          <div className="relative z-10 mt-7 space-y-3">
            <div className="rounded-2xl border border-white/30 bg-white/10 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.16em] text-white/75">Keamanan</p>
              <p className="mt-1 flex items-center gap-2 text-sm font-semibold">
                <ShieldCheck className="h-4 w-4" />
                Row-level security dan session terenkripsi
              </p>
            </div>
            <p className="text-xs text-white/80">OprexDuit dirancang untuk workflow harian yang cepat, jelas, dan minim distraksi.</p>
          </div>
        </section>

        <section className="rounded-[26px] border border-slate-200/80 bg-white/90 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.08)] md:p-6">
          {children}
        </section>
      </div>
    </div>
  );
}
