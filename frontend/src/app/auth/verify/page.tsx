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
    <div className="w-full space-y-6">
      {/* Logo */}
      <div className="space-y-1 text-center">
        <p className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-700">
          Email Verification
        </p>
        <div className="inline-flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #0f766e, #06b6d4)" }}
          >
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-black tracking-tight text-slate-900">
            Oprex<span className="text-orange-500">Duit.</span>
          </span>
        </div>
      </div>

      <div className="space-y-5 rounded-[24px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_20px_44px_rgba(15,23,42,0.09)]">
        {/* Icon + heading */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-teal-200 bg-teal-50">
            <Mail className="h-6 w-6 text-teal-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Cek email kamu</h2>
          <p className="text-xs leading-relaxed text-slate-600">
            Kode aktivasi 6 digit telah dikirim ke{" "}
            <span className="font-semibold text-slate-900">{email || "email kamu"}</span>.
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
                "h-13 w-11 rounded-xl border bg-white text-center text-xl font-bold transition-all focus:outline-none",
                d
                  ? "border-teal-500 text-teal-700"
                  : "border-slate-300 text-slate-700",
                "focus:border-teal-500 focus:ring-2 focus:ring-teal-100",
              ].join(" ")}
              style={{ height: "52px" }}
            />
          ))}
        </div>

        {error && (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-center text-xs text-rose-700">
            {error}
          </p>
        )}

        {success && (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-xs text-emerald-700">
            ✓ Email terverifikasi! Mengalihkan...
          </p>
        )}

        <button
          onClick={handleVerify}
          disabled={loading || success || digits.join("").length < CODE_LENGTH}
          className="w-full rounded-xl py-2.5 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(20,184,166,0.32)] transition-all disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #0f766e, #06b6d4)" }}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Aktivasi Akun"}
        </button>

        {/* Resend */}
        <div className="text-center text-xs text-slate-600">
          Tidak dapat email?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0}
            className="font-semibold text-teal-600 transition-colors hover:text-teal-500 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            {cooldown > 0 ? `Kirim ulang (${cooldown}s)` : "Kirim ulang kode"}
          </button>
        </div>
      </div>

      <p className="text-center text-xs text-slate-600">
        Salah email?{" "}
        <Link href="/auth/register" className="font-semibold text-teal-600 hover:text-teal-500">
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
          <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
        </div>
      }
    >
      <VerifyForm />
    </Suspense>
  );
}
