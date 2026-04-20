"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { Loader2, Mail, Wallet } from "lucide-react";

const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

function VerifyForm() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const supabase = createClient();

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Countdown timer for resend
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  function handleDigitChange(idx: number, val: string) {
    // Allow paste of full code
    if (val.length > 1) {
      const clean = val.replace(/\D/g, "").slice(0, CODE_LENGTH);
      const next = [...digits];
      for (let i = 0; i < CODE_LENGTH; i++) next[i] = clean[i] ?? "";
      setDigits(next);
      inputRefs.current[Math.min(clean.length, CODE_LENGTH - 1)]?.focus();
      return;
    }
    const clean = val.replace(/\D/g, "");
    const next = [...digits];
    next[idx] = clean;
    setDigits(next);
    if (clean && idx < CODE_LENGTH - 1) {
      inputRefs.current[idx + 1]?.focus();
    }
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  }

  async function handleVerify() {
    const token = digits.join("");
    if (token.length < CODE_LENGTH) {
      setError("Masukkan 6 digit kode aktivasi.");
      return;
    }
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });

    if (error) {
      setError(
        error.message.includes("expired")
          ? "Kode sudah kedaluwarsa. Kirim ulang kode dan coba lagi."
          : error.message.includes("invalid")
          ? "Kode tidak valid. Periksa kembali kode yang dikirim ke email kamu."
          : error.message
      );
      setLoading(false);
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      router.push("/");
      router.refresh();
    }, 1500);
  }

  async function handleResend() {
    if (cooldown > 0 || !email) return;
    setCooldown(RESEND_COOLDOWN);
    setError(null);
    await supabase.auth.resend({ type: "signup", email });
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      {/* Logo */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #14b8a6, #0ea5e9)" }}
          >
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight">
            Oprex<span className="text-teal-400">Duit</span>
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-white/8 bg-white/4 backdrop-blur-sm p-6 space-y-5">
        {/* Icon + heading */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl items-center justify-center bg-teal-500/10 border border-teal-500/20">
            <Mail className="w-6 h-6 text-teal-400" />
          </div>
          <h2 className="text-lg font-semibold text-slate-100">Cek email kamu</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Kode aktivasi 6 digit telah dikirim ke{" "}
            <span className="text-slate-200 font-medium">{email || "email kamu"}</span>.
            <br />
            Berlaku selama 10 menit.
          </p>
        </div>

        {/* OTP input */}
        <div className="flex justify-center gap-2">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={d}
              onChange={(e) => handleDigitChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onFocus={(e) => e.target.select()}
              className={[
                "w-11 h-13 text-center text-xl font-bold rounded-xl border bg-white/5 transition-all focus:outline-none",
                d
                  ? "border-teal-500/60 text-teal-300"
                  : "border-white/15 text-slate-100",
                "focus:border-teal-500/80 focus:ring-1 focus:ring-teal-500/30",
              ].join(" ")}
              style={{ height: "52px" }}
            />
          ))}
        </div>

        {error && (
          <p className="text-xs text-red-400 bg-red-950/40 border border-red-800/40 rounded-lg px-3 py-2 text-center">
            {error}
          </p>
        )}

        {success && (
          <p className="text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 rounded-lg px-3 py-2 text-center">
            ✓ Email terverifikasi! Mengalihkan...
          </p>
        )}

        <button
          onClick={handleVerify}
          disabled={loading || success || digits.join("").length < CODE_LENGTH}
          className="w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #14b8a6, #0ea5e9)" }}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Aktivasi Akun"}
        </button>

        {/* Resend */}
        <div className="text-center text-xs text-slate-700">
          Tidak dapat email?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0}
            className="text-teal-400 hover:text-teal-300 font-medium disabled:text-slate-800 disabled:cursor-not-allowed transition-colors"
          >
            {cooldown > 0 ? `Kirim ulang (${cooldown}s)` : "Kirim ulang kode"}
          </button>
        </div>
      </div>

      <p className="text-center text-xs text-slate-800">
        Salah email?{" "}
        <Link href="/auth/register" className="text-teal-400 hover:text-teal-300">
          Daftar ulang
        </Link>
      </p>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-24">
          <Loader2 className="w-6 h-6 animate-spin text-teal-400" />
        </div>
      }
    >
      <VerifyForm />
    </Suspense>
  );
}
