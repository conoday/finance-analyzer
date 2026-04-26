"use client";

import { useEffect, useState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  CheckCircle2,
  XCircle,
  Link2,
  Unlink,
  ArrowLeft,
  Copy,
  Check,
  Settings2,
} from "lucide-react";
import NextLink from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { PageHero } from "@/components/PageHero";
import { ANIMAL_AVATARS, parseAnimalAvatarToken, toAnimalAvatarToken } from "@/lib/avatar";

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
      className={[
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
        linked
          ? "border border-teal-200 bg-teal-50 text-teal-700"
          : "border border-slate-200 bg-slate-100 text-slate-500",
      ].join(" ")}
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
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
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
  const [savingAvatarId, setSavingAvatarId] = useState<string | null>(null);
  const [selectedAvatarToken, setSelectedAvatarToken] = useState<string>("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const token = String(profile?.avatar_url ?? user?.user_metadata?.avatar_url ?? "");
    setSelectedAvatarToken(token);
  }, [profile?.avatar_url, user?.user_metadata?.avatar_url]);

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
      const movedTx = Number(json?.migration?.transactions_moved ?? 0);
      const mergeInfo = movedTx > 0
        ? ` ${movedTx} transaksi Telegram lama juga disinkronkan otomatis.`
        : "";
      setMessage({ type: "success", text: `🎉 Telegram berhasil dihubungkan! Cek bot kamu.${mergeInfo}` });
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
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <PageHero
        icon={Settings2}
        tone="teal"
        badge="Akun"
        title="Pengaturan akun dan integrasi"
        subtitle="Atur profil, hubungkan Telegram, dan kelola preferensi notifikasi dari satu panel yang rapi."
        actions={
          <div className="flex items-center justify-start md:justify-end">
            <NextLink
              href="/"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-teal-200 hover:text-teal-700"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Kembali ke dashboard
            </NextLink>
          </div>
        }
      />

      <div className="space-y-5">
        {/* Page title & Avatar */}
        <div className="space-y-4 rounded-[24px] border border-white/80 bg-white/88 p-5 shadow-[0_14px_36px_rgba(15,23,42,0.07)] backdrop-blur">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Profil pengguna</h2>
            <p className="mt-1 text-xs text-slate-500">{user.email}</p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-slate-800">Avatar Profil Hewan</p>
              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                {parseAnimalAvatarToken(selectedAvatarToken)?.label ?? "Belum dipilih"}
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              {ANIMAL_AVATARS.map((avatar) => {
                const token = toAnimalAvatarToken(avatar.id);
                const isSelected = selectedAvatarToken === token;
                const isSaving = savingAvatarId === avatar.id;

                return (
                  <button
                    key={avatar.id}
                    onClick={async () => {
                      setSavingAvatarId(avatar.id);
                      try {
                        const { error: authError } = await supabase.auth.updateUser({
                          data: { avatar_url: token },
                        });
                        if (authError) {
                          throw authError;
                        }

                        setSelectedAvatarToken(token);

                        // Keep profile table in sync for server-side usage.
                        await supabase
                          .from("profiles")
                          .update({ avatar_url: token })
                          .eq("id", user.id);

                        try {
                          localStorage.setItem("oprex_avatar_token", token);
                        } catch {
                          // Ignore localStorage failures.
                        }

                        await refreshProfile();
                        await supabase.auth.refreshSession();
                        router.refresh();
                        setMessage({ type: "success", text: "Avatar berhasil diperbarui!" });
                      } catch (err: unknown) {
                        const msg = err instanceof Error ? err.message : "Gagal memperbarui avatar.";
                        setMessage({ type: "error", text: msg });
                        if (msg) {
                          console.warn("Avatar update failed:", msg);
                        }
                      } finally {
                        setSavingAvatarId(null);
                      }
                    }}
                    disabled={isSaving}
                    className={[
                      "relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border-2 text-2xl transition-all",
                      isSelected
                        ? "scale-110 border-teal-500 bg-teal-50 shadow-md"
                        : "border-slate-100 bg-white hover:border-teal-300",
                      isSaving ? "cursor-wait opacity-70" : "",
                    ].join(" ")}
                    title={avatar.label}
                  >
                    <span>{avatar.emoji}</span>
                    {isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center bg-teal-500/20">
                        <Check className="w-5 h-5 text-teal-700 font-bold drop-shadow-md" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-[10px] text-slate-400">Pilih avatar hewan yang paling cocok sama karakter kamu.</p>
          </div>
        </div>

        {/* Global message */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={[
                "rounded-xl border px-4 py-3 text-xs",
                message.type === "success"
                  ? "border-teal-200 bg-teal-50 text-teal-700"
                  : "border-rose-200 bg-rose-50 text-rose-700",
              ].join(" ")}
            >
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Telegram Card ────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-white/80 bg-white/88 shadow-[0_14px_36px_rgba(15,23,42,0.07)] backdrop-blur">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-100 px-5 pb-4 pt-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                <MessageCircle className="h-[18px] w-[18px]" />
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
                <div className="space-y-2 rounded-xl border border-teal-100 bg-teal-50/60 px-4 py-3 text-xs">
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
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-100 text-[10px] font-bold text-teal-700">
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
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-mono tracking-wider text-slate-800 outline-none transition-all focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || !linkCode.trim()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 py-2.5 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(20,184,166,0.28)] transition-all disabled:cursor-not-allowed disabled:opacity-50"
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
        <div className="rounded-2xl border border-white/80 bg-white/88 px-5 py-5 shadow-[0_14px_36px_rgba(15,23,42,0.07)] backdrop-blur">
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
                <code className="rounded-md border border-teal-100 bg-teal-50 px-2 py-0.5 font-mono text-[11px] text-teal-700">
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
