"use client";

import { useEffect, useState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  CheckCircle2,
  XCircle,
  Link2,
  Unlink,
  ChevronRight,
  ArrowLeft,
  Copy,
  Check,
} from "lucide-react";
import NextLink from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TelegramStatus {
  linked: boolean;
  chat_id: string | null;
  linked_at: string | null;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ linked }: { linked: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
      style={
        linked
          ? { background: "rgba(20,184,166,0.1)", color: "#0f766e" }
          : { background: "rgba(148,163,184,0.15)", color: "#64748b" }
      }
    >
      {linked ? (
        <CheckCircle2 className="w-3 h-3" />
      ) : (
        <XCircle className="w-3 h-3" />
      )}
      {linked ? "Terhubung" : "Belum terhubung"}
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      title="Salin"
      className="p-1 rounded hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-800"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function SettingsContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Pre-fill link code from ?code= URL param (reverse flow: user clicked bot link)
  const codeFromUrl = searchParams.get("code") ?? "";

  const [status, setStatus] = useState<TelegramStatus>({
    linked: false,
    chat_id: null,
    linked_at: null,
  });
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [linkCode, setLinkCode] = useState(codeFromUrl.toUpperCase());
  const [submitting, setSubmitting] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Redirect to login (preserving current URL with code) if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      const next = encodeURIComponent(`/settings${codeFromUrl ? `?code=${codeFromUrl}` : ""}`);
      router.replace(`/auth/login?next=${next}`);
    }
  }, [authLoading, user, router, codeFromUrl]);

  // Sync code from URL if it arrives late (e.g. hydration)
  useEffect(() => {
    if (codeFromUrl && !linkCode) {
      setLinkCode(codeFromUrl.toUpperCase());
    }
  }, [codeFromUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load Telegram status from Supabase
  useEffect(() => {
    if (!user) return;

    const fetchStatus = async () => {
      setLoadingStatus(true);
      try {
        const { data } = await supabase
          .from("profiles")
          .select("telegram_chat_id, telegram_linked_at")
          .eq("id", user.id)
          .maybeSingle();

        if (data) {
          setStatus({
            linked: !!data.telegram_chat_id,
            chat_id: data.telegram_chat_id ?? null,
            linked_at: data.telegram_linked_at ?? null,
          });
        }
      } finally {
        setLoadingStatus(false);
      }
    };

    fetchStatus();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkCode.trim()) return;

    setSubmitting(true);
    setMessage(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Sesi tidak valid. Silakan login ulang.");

      const res = await fetch(`${BASE}/telegram/link`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ link_code: linkCode.trim() }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.detail ?? "Gagal menghubungkan.");
      }

      setStatus({ linked: true, chat_id: json.chat_id, linked_at: new Date().toISOString() });
      setLinkCode("");
      setMessage({ type: "success", text: "🎉 Telegram berhasil dihubungkan! Cek bot kamu." });
    } catch (err: unknown) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Terjadi kesalahan. Coba lagi.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnlink = async () => {
    if (!confirm("Putuskan koneksi Telegram dari akun ini?")) return;

    setUnlinking(true);
    setMessage(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Sesi tidak valid.");

      const res = await fetch(`${BASE}/telegram/unlink`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Gagal memutus koneksi.");

      setStatus({ linked: false, chat_id: null, linked_at: null });
      setMessage({ type: "success", text: "Telegram berhasil diputus dari akun ini." });
    } catch (err: unknown) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Terjadi kesalahan.",
      });
    } finally {
      setUnlinking(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const formattedDate = status.linked_at
    ? new Date(status.linked_at).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="min-h-screen" style={{ background: "#f8fafc" }}>
      {/* Top bar */}
      <div
        className="sticky top-0 z-40 w-full"
        style={{
          background: "rgba(255,255,255,0.9)",
          borderBottom: "1px solid rgba(20,184,166,0.12)",
          backdropFilter: "blur(20px)",
        }}
      >
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <NextLink
            href="/"
            className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali
          </NextLink>
          <ChevronRight className="w-3 h-3 text-slate-700" />
          <span className="text-xs font-medium text-slate-700">Pengaturan</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">

        {/* Page title & Avatar */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Pengaturan Akun</h1>
            <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>
          </div>

          <div className="rounded-2xl bg-white p-5" style={{ border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <p className="text-sm font-medium text-slate-800 mb-3">Avatar Profil</p>
            <div className="flex flex-wrap gap-3">
              {Array.from({ length: 15 }, (_, i) => {
                const seedUrl = `https://api.dicebear.com/8.x/adventurer/svg?seed=Avatar${i}`;
                const isSelected = user.user_metadata?.avatar_url === seedUrl;
                return (
                  <button
                    key={i}
                    onClick={async () => {
                      try {
                        await supabase.auth.updateUser({ data: { avatar_url: seedUrl } });
                        router.refresh();
                        setMessage({ type: "success", text: "Avatar berhasil diperbarui!" });
                      } catch {
                         setMessage({ type: "error", text: "Gagal memperbarui avatar." });
                      }
                    }}
                    className={`relative w-12 h-12 rounded-xl border-2 transition-all overflow-hidden ${isSelected ? "border-teal-500 scale-110 shadow-md" : "border-slate-100 hover:border-teal-300"}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={seedUrl} alt={`Avatar ${i}`} className="w-full h-full object-cover bg-slate-50" />
                    {isSelected && (
                      <div className="absolute inset-0 bg-teal-500/20 flex items-center justify-center">
                        <Check className="w-5 h-5 text-teal-700 font-bold drop-shadow-md" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-400 mt-3">Pilih avatar yang mewakili kamu.</p>
          </div>
        </div>

        {/* Global message */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-xl px-4 py-3 text-xs"
              style={
                message.type === "success"
                  ? { background: "rgba(20,184,166,0.08)", color: "#0f766e", border: "1px solid rgba(20,184,166,0.2)" }
                  : { background: "rgba(239,68,68,0.07)", color: "#b91c1c", border: "1px solid rgba(239,68,68,0.2)" }
              }
            >
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Telegram Card ────────────────────────────────────────────────── */}
        <div
          className="rounded-2xl bg-white"
          style={{ border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
        >
          {/* Header */}
          <div className="flex items-start justify-between px-5 pt-5 pb-4" style={{ borderBottom: "1px solid #f1f5f9" }}>
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(20,184,166,0.08)" }}
              >
                <MessageCircle className="w-4.5 h-4.5 text-teal-600" style={{ width: 18, height: 18 }} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">Telegram Bot</p>
                <p className="text-[11px] text-slate-400 mt-0.5">@OprexDuidbot</p>
              </div>
            </div>

            {loadingStatus ? (
              <div className="w-4 h-4 border-2 border-teal-400 border-t-transparent rounded-full animate-spin mt-1" />
            ) : (
              <StatusBadge linked={status.linked} />
            )}
          </div>

          <div className="px-5 py-5 space-y-5">

            {/* ─ Connected state ─ */}
            {!loadingStatus && status.linked && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                {/* Info row */}
                <div
                  className="rounded-xl px-4 py-3 space-y-2 text-xs"
                  style={{ background: "rgba(20,184,166,0.05)", border: "1px solid rgba(20,184,166,0.15)" }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700">Chat ID</span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono font-medium text-slate-700">{status.chat_id}</span>
                      {status.chat_id && <CopyButton text={status.chat_id} />}
                    </div>
                  </div>
                  {formattedDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-700">Dihubungkan</span>
                      <span className="text-slate-700">{formattedDate}</span>
                    </div>
                  )}
                </div>

                {/* What you get */}
                <div className="space-y-1.5">
                  {[
                    "Catat transaksi kapan saja via Telegram",
                    "Laporan harian otomatis tiap pagi",
                    "Ringkasan mingguan setiap Senin",
                    "Notif budget saat hampir melebihi limit",
                  ].map((f) => (
                    <div key={f} className="flex items-center gap-2 text-xs text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>

                {/* Unlink */}
                <button
                  onClick={handleUnlink}
                  disabled={unlinking}
                  className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
                >
                  <Unlink className="w-3.5 h-3.5" />
                  {unlinking ? "Memutus…" : "Putuskan koneksi Telegram"}
                </button>
              </motion.div>
            )}

            {/* ─ Not connected state ─ */}
            {!loadingStatus && !status.linked && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-5"
              >
                {/* Steps */}
                <div className="space-y-3">
                  <p className="text-xs font-medium text-slate-700">Cara menghubungkan:</p>
                  {[
                    { step: "1", text: "Buka Telegram, cari @OprexDuidbot" },
                    { step: "2", text: 'Ketik /start → bot akan memberi kode link 8 karakter' },
                    { step: "3", text: "Tempel kode di bawah ini, lalu klik Hubungkan" },
                  ].map(({ step, text }) => (
                    <div key={step} className="flex items-start gap-3">
                      <div
                        className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: "rgba(20,184,166,0.12)", color: "#0f766e" }}
                      >
                        {step}
                      </div>
                      <p className="text-xs text-slate-700">{text}</p>
                    </div>
                  ))}
                </div>

                {/* Form */}
                <form onSubmit={handleLink} className="space-y-3">
                  <div>
                    <label
                      htmlFor="link-code"
                      className="block text-xs font-medium text-slate-800 mb-1.5"
                    >
                      Kode link dari bot
                    </label>
                    <input
                      id="link-code"
                      type="text"
                      value={linkCode}
                      onChange={(e) => setLinkCode(e.target.value.toUpperCase())}
                      placeholder="Contoh: AB3X9Q2F"
                      maxLength={16}
                      className="w-full rounded-xl px-3.5 py-2.5 text-sm font-mono tracking-wider outline-none transition-all"
                      style={{
                        border: "1.5px solid #e2e8f0",
                        background: "#f8fafc",
                        color: "#1e293b",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = "#14b8a6")}
                      onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || !linkCode.trim()}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: "#14b8a6", color: "#fff" }}
                  >
                    <Link2 className="w-4 h-4" />
                    {submitting ? "Menghubungkan…" : "Hubungkan Telegram"}
                  </button>
                </form>
              </motion.div>
            )}

            {/* Loading skeleton */}
            {loadingStatus && (
              <div className="space-y-3 animate-pulse">
                <div className="h-3 bg-slate-100 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            )}
          </div>
        </div>

        {/* Bot commands reference */}
        <div
          className="rounded-2xl bg-white px-5 py-5"
          style={{ border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
        >
          <p className="text-xs font-medium text-slate-700 mb-3">Perintah bot</p>
          <div className="space-y-2">
            {[
              { cmd: "/start",      desc: "Mulai & dapatkan kode link" },
              { cmd: "50rb makan",  desc: "Catat pengeluaran Rp50.000" },
              { cmd: "+2jt gaji",   desc: "Catat pemasukan Rp2.000.000" },
              { cmd: "/ringkasan",  desc: "Ringkasan hari ini" },
              { cmd: "/laporan",    desc: "Laporan bulan ini" },
              { cmd: "/budget",     desc: "Status budget vs limit" },
              { cmd: "/bantuan",    desc: "Lihat semua perintah" },
            ].map(({ cmd, desc }) => (
              <div key={cmd} className="flex items-center justify-between gap-4">
                <code
                  className="text-[11px] px-2 py-0.5 rounded-md font-mono"
                  style={{ background: "rgba(20,184,166,0.07)", color: "#0f766e" }}
                >
                  {cmd}
                </code>
                <span className="text-[11px] text-slate-400 text-right">{desc}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <SettingsContent />
    </Suspense>
  );
}
