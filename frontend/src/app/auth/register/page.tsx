"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { Eye, EyeOff, Loader2, Wallet, ChevronDown, Shield, Lock, UserCheck, Trash2, FileText, X } from "lucide-react";

const TNC_SECTIONS = [
  {
    icon: Shield,
    color: "text-teal-600",
    bg: "bg-teal-50",
    title: "Perlindungan Data Pribadi",
    subtitle: "UU PDP No. 27/2022",
    content:
      "OprexDuit memproses data pribadi kamu (nama, email, data transaksi keuangan) berdasarkan persetujuan eksplisit yang kamu berikan saat pendaftaran, sesuai Undang-Undang Perlindungan Data Pribadi No. 27 Tahun 2022. Kamu berhak mengakses, memperbaiki, menghapus, dan membatasi pemrosesan data pribadi kamu kapan saja melalui pengaturan akun.",
  },
  {
    icon: Lock,
    color: "text-violet-600",
    bg: "bg-violet-50",
    title: "Kerahasiaan Data Keuangan",
    subtitle: "Privasi penuh untuk data transaksi",
    content:
      "Data keuangan kamu (transaksi, saldo, histori pengeluaran) bersifat rahasia dan hanya dapat diakses olehmu. OprexDuit tidak akan menjual, menyewakan, atau membagikan data keuangan kamu kepada pihak ketiga tanpa persetujuan eksplisit kamu, kecuali diwajibkan oleh hukum yang berlaku di Indonesia.",
  },
  {
    icon: Shield,
    color: "text-blue-600",
    bg: "bg-blue-50",
    title: "Keamanan Data",
    subtitle: "ISO 27001 & Panduan OJK",
    content:
      "Data disimpan secara terenkripsi menggunakan standar AES-256. Koneksi diamankan menggunakan TLS 1.3. OprexDuit menerapkan Row Level Security (RLS) sehingga data kamu terisolasi secara teknis dari pengguna lain. Kami mengikuti panduan keamanan data Otoritas Jasa Keuangan (OJK).",
  },
  {
    icon: Trash2,
    color: "text-rose-600",
    bg: "bg-rose-50",
    title: "Hak Pengguna & Penghapusan Akun",
    subtitle: "Kontrol penuh atas data kamu",
    content:
      "Kamu memiliki hak untuk: (1) mengakses salinan data pribadi kamu, (2) meminta koreksi data yang tidak akurat, (3) menghapus akun dan semua data terkait secara permanen, dan (4) menarik persetujuan pemrosesan data kapan saja. Permintaan penghapusan data diproses dalam 30 hari kerja.",
  },
  {
    icon: FileText,
    color: "text-amber-600",
    bg: "bg-amber-50",
    title: "Penggunaan Layanan",
    subtitle: "Ketentuan umum penggunaan",
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
  const [showTNC, setShowTNC] = useState(false);
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

    const randomSeed = Math.floor(Math.random() * 15);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { 
          full_name: name,
          avatar_url: `https://api.dicebear.com/8.x/adventurer/svg?seed=Avatar${randomSeed}`,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? location.origin}/auth/callback`,
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
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? location.origin}/auth/callback`,
        scopes: "email profile",
      },
    });
  }

  return (
    <div className="w-full max-w-sm space-y-5 py-8">
      {/* Logo */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-2 mb-1">
          <img src="/logo.png" alt="OprexDuit Logo" className="w-10 h-10 object-contain rounded-xl" />
          <span className="text-2xl font-bold tracking-tight text-slate-800">
            Oprex<span className="text-orange-500">Duit.</span>
          </span>
        </div>
        <p className="text-slate-700 text-sm">Buat akun gratis kamu</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 space-y-4">
        {/* Google */}
        <button
          onClick={handleGoogle}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-medium py-2.5 transition-all disabled:opacity-60 text-slate-700"
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

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <div className="flex-1 h-px bg-slate-200" />
          atau
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">Nama lengkap</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama kamu"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-200 transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="kamu@email.com"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-200 transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">
              Password{" "}
              <span className="text-slate-400 font-normal">(min 8 karakter, 1 huruf kapital, 1 angka)</span>
            </label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 pr-10 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-200 transition-all"
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

          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">Konfirmasi password</label>
            <input
              type={showPw ? "text" : "password"}
              required
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-200 transition-all"
            />
          </div>

          {/* T&C Button — opens popup modal */}
          <button
            type="button"
            onClick={() => setShowTNC(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-teal-200 hover:border-teal-400 bg-teal-50/60 hover:bg-teal-50 text-xs font-medium text-teal-700 hover:text-teal-600 transition-all"
          >
            <FileText className="w-3.5 h-3.5" />
            Baca Syarat &amp; Ketentuan Layanan
          </button>

          {/* Checkboxes */}
          <div className="space-y-2.5 pt-1">
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
                label: "Saya menyetujui pemrosesan data pribadi sesuai Kebijakan Privasi & UU PDP No. 27/2022",
              },
              {
                id: "terms",
                checked: agreeTerms,
                set: setAgreeTerms,
                label: "Saya telah membaca dan menyetujui Syarat & Ketentuan Layanan OprexDuit",
              },
            ].map((item) => (
              <label key={item.id} className="flex items-start gap-2.5 cursor-pointer group">
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
                      "w-4 h-4 rounded border-2 transition-all flex items-center justify-center",
                      item.checked
                        ? "bg-teal-500 border-teal-500"
                        : "bg-white border-slate-300 group-hover:border-teal-400",
                    ].join(" ")}
                  >
                    {item.checked && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-xs text-slate-800 leading-relaxed">{item.label}</span>
              </label>
            ))}
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !allChecked}
            className="w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={allChecked ? { background: "linear-gradient(135deg, #14b8a6, #0ea5e9)" } : { background: "#cbd5e1" }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Buat Akun"}
          </button>
        </form>
      </div>

      <p className="text-center text-xs text-slate-700">
        Sudah punya akun?{" "}
        <Link href="/auth/login" className="text-teal-600 hover:text-teal-500 font-medium">
          Masuk di sini
        </Link>
      </p>

      {/* T&C Modal */}
      {showTNC && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setShowTNC(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
            style={{ maxHeight: "85vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div>
                <p className="text-sm font-bold text-slate-800">Syarat &amp; Ketentuan Layanan</p>
                <p className="text-xs text-slate-700 mt-0.5">OprexDuit — baca sebelum mendaftar</p>
              </div>
              <button
                type="button"
                onClick={() => setShowTNC(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-700 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable sections */}
            <div className="overflow-y-auto divide-y divide-slate-100" style={{ maxHeight: "calc(85vh - 140px)" }}>
              {TNC_SECTIONS.map((s, i) => {
                const Icon = s.icon;
                const isOpen = expandedSection === i;
                return (
                  <div key={i}>
                    <button
                      type="button"
                      onClick={() => setExpandedSection(isOpen ? null : i)}
                      className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-slate-50 transition-colors"
                    >
                      <span className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${s.bg}`}>
                        <Icon className={`w-4 h-4 ${s.color}`} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 leading-snug">{s.title}</p>
                        <p className="text-xs text-slate-700 mt-0.5">{s.subtitle}</p>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-4">
                        <div className={`rounded-xl p-4 ${s.bg}`}>
                          <p className={`text-sm leading-relaxed ${s.color}`}>{s.content}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowTNC(false)}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                style={{ background: "linear-gradient(135deg, #14b8a6, #0ea5e9)" }}
              >
                Sudah Membaca
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
