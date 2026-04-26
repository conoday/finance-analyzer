"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // After login, redirect to ?next= or fallback to home
  const next = searchParams.get("next") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(
        error.message === "Email not confirmed"
          ? "Email belum diverifikasi. Cek inbox kamu dan masukkan kode aktivasi."
          : error.message === "Invalid login credentials"
          ? "Email atau password salah."
          : error.message
      );
      setLoading(false);
      return;
    }

    router.push(next);
    router.refresh();
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    setError(null);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // Pass ?next= through so callback/route.ts redirects correctly
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        scopes: "email profile",
      },
    });
    // Page will redirect — no need to setLoading(false)
  }

  return (
    <div className="w-full space-y-6">
      {/* Logo */}
      <div className="text-center space-y-2">
        <p className="inline-flex items-center rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-teal-700">
          Secure Login
        </p>
        <div className="inline-flex items-center gap-2 mb-1">
          <Image src="/logo.png" alt="OprexDuit Logo" width={40} height={40} className="w-10 h-10 object-contain rounded-xl" priority />
          <span className="text-2xl font-black tracking-tight text-slate-900">
            Oprex<span className="text-orange-500">Duit.</span>
          </span>
        </div>
        <p className="text-sm text-slate-600">Masuk ke command center keuangan kamu</p>
      </div>

      {/* Card */}
      <div className="space-y-4 rounded-[24px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_20px_44px_rgba(15,23,42,0.09)]">
        {/* Google */}
        <button
          onClick={handleGoogle}
          disabled={googleLoading}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-100 disabled:opacity-60"
        >
          {googleLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          )}
          Masuk dengan Google
        </button>

        <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
          <div className="h-px flex-1 bg-slate-200" />
          atau
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        {/* Email form */}
        <form onSubmit={handleEmailLogin} className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="kamu@email.com"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition-all focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">Password</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 pr-10 text-sm text-slate-800 placeholder-slate-400 transition-all focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-800 transition-colors"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl py-2.5 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(20,184,166,0.32)] transition-all disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #0f766e, #06b6d4)" }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Masuk"}
          </button>
        </form>
      </div>

      <p className="text-center text-xs text-slate-600">
        Belum punya akun?{" "}
        <Link href="/auth/register" className="font-semibold text-teal-600 hover:text-teal-500">
          Daftar gratis
        </Link>
      </p>
    </div>
  );
}
