"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { Eye, EyeOff, Loader2, Wallet, ChevronDown, ChevronUp } from "lucide-react";

const TNC_SECTIONS = [
  {
    title: "Perlindungan Data Pribadi (UU PDP No. 27/2022)",
    content:
      "OprexDuit memproses data pribadi kamu (nama, email, data transaksi keuangan) berdasarkan persetujuan eksplisit yang kamu berikan saat pendaftaran, sesuai Undang-Undang Perlindungan Data Pribadi No. 27 Tahun 2022. Kamu berhak mengakses, memperbaiki, menghapus, dan membatasi pemrosesan data pribadi kamu kapan saja melalui pengaturan akun.",
  },
  {
    title: "Kerahasiaan Data Keuangan",
    content:
      "Data keuangan kamu (transaksi, saldo, histori pengeluaran) bersifat rahasia dan hanya dapat diakses olehmu. OprexDuit tidak akan menjual, menyewakan, atau membagikan data keuangan kamu kepada pihak ketiga tanpa persetujuan eksplisit kamu, kecuali diwajibkan oleh hukum yang berlaku di Indonesia.",
  },
  {
    title: "Keamanan Data (ISO 27001 & POJK)",
    content:
      "Data disimpan secara terenkripsi menggunakan standar AES-256. Koneksi diamankan menggunakan TLS 1.3. OprexDuit menerapkan Row Level Security (RLS) sehingga data kamu terisolasi secara teknis dari pengguna lain. Kami mengikuti panduan keamanan data Otoritas Jasa Keuangan (OJK) yang berlaku.",
  },
  {
    title: "Hak Pengguna & Penghapusan Akun",
    content:
      "Kamu memiliki hak untuk (1) mengakses salinan data pribadi kamu, (2) meminta koreksi data yang tidak akurat, (3) menghapus akun dan semua data terkait secara permanen, dan (4) menarik persetujuan pemrosesan data kapan saja. Permintaan penghapusan data akan diproses dalam 30 hari kerja.",
  },
  {
    title: "Penggunaan Layanan",
    content:
      "OprexDuit diperuntukkan bagi pengguna berusia 17 tahun ke atas. Kamu bertanggung jawab menjaga kerahasiaan credentials akun kamu. Penggunaan layanan untuk aktivitas yang melanggar hukum, pencucian uang, atau penipuan akan mengakibatkan penangguhan akun secara permanen.",
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeAge, setAgreeAge] = useState(false);
  const [expandedSection, setExpandedSection] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allChecked = agreeTerms && agreePrivacy && agreeAge;

  function validatePassword(pw: string) {
    if (pw.length < 8) return "Password minimal 8 karakter.";
    if (!/[A-Z]/.test(pw)) return "Password harus mengandung minimal 1 huruf kapital.";
    if (!/[0-9]/.test(pw)) return "Password harus mengandung minimal 1 angka.";
    return null;
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!allChecked) {
      setError("Kamu harus menyetujui semua ketentuan untuk melanjutkan.");
      return;
    }

    const pwError = validatePassword(password);
    if (pwError) { setError(pwError); return; }

    if (password !== confirmPw) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(
        error.message.includes("already registered")
          ? "Email ini sudah terdaftar. Silakan masuk."
          : error.message
      );
      setLoading(false);
      return;
    }

    // Redirect to OTP verification
    router.push(`/auth/verify?email=${encodeURIComponent(email)}`);
  }

  async function handleGoogle() {
    if (!allChecked) {
      setError("Kamu harus menyetujui semua ketentuan sebelum mendaftar dengan Google.");
      return;
    }
    setGoogleLoading(true);
    setError(null);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback`,
        scopes: "email profile",
      },
    });
  }

  return (
    <div className="w-full max-w-sm space-y-5 py-8">
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
        <p className="text-slate-400 text-sm">Buat akun gratis kamu</p>
      </div>

      <div className="rounded-2xl border border-white/8 bg-white/4 backdrop-blur-sm p-6 space-y-4">
        {/* Google */}
        <button
          onClick={handleGoogle}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-3 rounded-xl border border-white/12 bg-white/5 hover:bg-white/10 text-sm font-medium py-2.5 transition-all disabled:opacity-60"
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
          Daftar dengan Google
        </button>

        <div className="flex items-center gap-3 text-xs text-slate-600">
          <div className="flex-1 h-px bg-white/8" />atau<div className="flex-1 h-px bg-white/8" />
        </div>

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-medium">Nama lengkap</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama kamu"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/30 transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-medium">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="kamu@email.com"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/30 transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-medium">
              Password{" "}
              <span className="text-slate-600 font-normal">(min 8 karakter, 1 huruf kapital, 1 angka)</span>
            </label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 pr-10 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/30 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-medium">Konfirmasi password</label>
            <input
              type={showPw ? "text" : "password"}
              required
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/30 transition-all"
            />
          </div>

          {/* T&C accordion */}
          <div className="rounded-xl border border-white/10 bg-slate-900/60 overflow-hidden">
            <div className="px-3 py-2 border-b border-white/8">
              <p className="text-[11px] font-semibold text-slate-300 uppercase tracking-wide">
                Syarat & Ketentuan Layanan
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Baca setiap bagian — klik untuk expand
              </p>
            </div>
            <div className="divide-y divide-white/5">
              {TNC_SECTIONS.map((s, i) => (
                <div key={i}>
                  <button
                    type="button"
                    onClick={() => setExpandedSection(expandedSection === i ? null : i)}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-white/3 transition-colors"
                  >
                    <span className="text-[11px] text-slate-300 font-medium leading-snug pr-2">
                      {s.title}
                    </span>
                    {expandedSection === i ? (
                      <ChevronUp className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    )}
                  </button>
                  {expandedSection === i && (
                    <div className="px-3 pb-3 text-[11px] text-slate-400 leading-relaxed bg-slate-950/40">
                      {s.content}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Checkboxes */}
          <div className="space-y-2.5">
            {[
              {
                id: "age",
                checked: agreeAge,
                set: setAgreeAge,
                label: "Saya berusia 17 tahun ke atas",
              },
              {
                id: "privacy",
                checked: agreePrivacy,
                set: setAgreePrivacy,
                label: "Saya menyetujui pemrosesan data pribadi saya sesuai Kebijakan Privasi & UU PDP No. 27/2022",
              },
              {
                id: "terms",
                checked: agreeTerms,
                set: setAgreeTerms,
                label: "Saya telah membaca dan menyetujui Syarat & Ketentuan Layanan OprexDuit",
              },
            ].map((item) => (
              <label
                key={item.id}
                className="flex items-start gap-2.5 cursor-pointer group"
              >
                <div className="relative mt-0.5 shrink-0">
                  <input
                    type="checkbox"
                    id={item.id}
                    checked={item.checked}
                    onChange={(e) => item.set(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={[
                      "w-4 h-4 rounded border transition-all flex items-center justify-center",
                      item.checked
                        ? "bg-teal-500 border-teal-500"
                        : "bg-white/5 border-white/20 group-hover:border-teal-500/50",
                    ].join(" ")}
                  >
                    {item.checked && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 leading-relaxed">{item.label}</span>
              </label>
            ))}
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-950/40 border border-red-800/40 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !allChecked}
            className="w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={allChecked ? { background: "linear-gradient(135deg, #14b8a6, #0ea5e9)" } : { background: "#1e293b" }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Buat Akun"}
          </button>
        </form>
      </div>

      <p className="text-center text-xs text-slate-500">
        Sudah punya akun?{" "}
        <Link href="/auth/login" className="text-teal-400 hover:text-teal-300 font-medium">
          Masuk di sini
        </Link>
      </p>
    </div>
  );
}
