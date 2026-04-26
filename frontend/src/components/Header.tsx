"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogIn, LogOut, ChevronDown, Settings, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { parseAnimalAvatarToken } from "@/lib/avatar";
import { useDisplayMode, type DisplayMode } from "@/hooks/useDisplayMode";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onDonasi?: () => void;
}

function UserMenu({ onSignOut, showtime }: { onSignOut: () => void; showtime: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="absolute right-0 top-full z-50 mt-2 w-44"
    >
      <div
        className={cn(
          "rounded-xl py-1 text-xs shadow-lg",
          showtime ? "border border-white/[0.12] bg-[#0b1020]/95" : "border border-slate-200 bg-white"
        )}
      >
        <Link
          href="/settings"
          className={cn(
            "flex w-full items-center gap-2 px-3 py-2 transition-colors",
            showtime ? "text-slate-100 hover:bg-white/5" : "text-slate-800 hover:bg-slate-50"
          )}
        >
          <Settings className="h-3.5 w-3.5" />
          Pengaturan
        </Link>
        <div className={cn("my-[2px] h-px", showtime ? "bg-white/10" : "bg-slate-100")} />
        <button
          onClick={onSignOut}
          className={cn(
            "flex w-full items-center gap-2 px-3 py-2 transition-colors",
            showtime ? "text-rose-200 hover:bg-rose-400/10" : "text-red-500 hover:bg-red-50"
          )}
        >
          <LogOut className="h-3.5 w-3.5" />
          Keluar
        </button>
        <div
          className={cn(
            "absolute -top-1.5 right-6 h-3 w-3 rotate-45",
            showtime ? "border-l border-t border-white/[0.12] bg-[#0b1020]" : "border-l border-t border-slate-200 bg-white"
          )}
        />
      </div>
    </motion.div>
  );
}

function ModeMenu({
  showtime,
  mode,
  onSelect,
  prefersReducedMotion,
}: {
  showtime: boolean;
  mode: DisplayMode;
  onSelect: (next: DisplayMode) => void;
  prefersReducedMotion: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="absolute right-0 top-full z-50 mt-2 w-40"
    >
      <div
        className={cn(
          "rounded-xl py-1 text-xs shadow-lg",
          showtime ? "border border-white/[0.12] bg-[#0b1020]/95" : "border border-slate-200 bg-white"
        )}
      >
        <p
          className={cn(
            "px-3 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wide",
            showtime ? "text-slate-300/75" : "text-slate-500"
          )}
        >
          Visual Mode
        </p>

        <button
          onClick={() => onSelect("ringkas")}
          className={cn(
            "mx-2 mt-1 flex w-[calc(100%-1rem)] items-center justify-between rounded-md px-2 py-1.5 text-left transition",
            mode === "ringkas"
              ? showtime
                ? "bg-emerald-400/12 text-emerald-100"
                : "bg-teal-50 text-teal-700"
              : showtime
                ? "text-slate-200 hover:bg-white/10"
                : "text-slate-700 hover:bg-slate-50"
          )}
        >
          <span>Ringkas</span>
          {mode === "ringkas" ? <span className="text-[10px] font-bold">Aktif</span> : null}
        </button>

        <button
          onClick={() => onSelect("showtime")}
          disabled={prefersReducedMotion}
          className={cn(
            "mx-2 mb-1 mt-1 flex w-[calc(100%-1rem)] items-center justify-between rounded-md px-2 py-1.5 text-left transition",
            mode === "showtime"
              ? showtime
                ? "bg-cyan-400/12 text-cyan-100"
                : "bg-indigo-50 text-indigo-700"
              : showtime
                ? "text-slate-200 hover:bg-white/10"
                : "text-slate-700 hover:bg-slate-50",
            prefersReducedMotion ? "cursor-not-allowed opacity-50" : ""
          )}
        >
          <span>Showtime</span>
          {mode === "showtime" ? <span className="text-[10px] font-bold">Aktif</span> : null}
        </button>

        {prefersReducedMotion ? (
          <p
            className={cn(
              "mx-2 mb-2 rounded-md border px-2 py-1 text-[10px]",
              showtime ? "border-amber-300/30 bg-amber-400/10 text-amber-100" : "border-amber-200 bg-amber-50 text-amber-700"
            )}
          >
            Reduced-motion aktif.
          </p>
        ) : null}

        <div
          className={cn(
            "absolute -top-1.5 right-6 h-3 w-3 rotate-45",
            showtime ? "border-l border-t border-white/[0.12] bg-[#0b1020]" : "border-l border-t border-slate-200 bg-white"
          )}
        />
      </div>
    </motion.div>
  );
}

export function Header({ onDonasi }: HeaderProps) {
  void onDonasi;

  const [showMenu, setShowMenu] = useState(false);
  const [showModeMenu, setShowModeMenu] = useState(false);

  const { user, profile, loading, signOut } = useAuth();
  const { mode, setMode, isShowtime, prefersReducedMotion } = useDisplayMode();
  const pathname = usePathname();

  const modeMenuRef = useRef<HTMLDivElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  const avatarToken = String(profile?.avatar_url ?? user?.user_metadata?.avatar_url ?? "");
  const animalAvatar = parseAnimalAvatarToken(avatarToken);
  const imageAvatar = animalAvatar ? "" : avatarToken;
  const fullName = profile?.full_name ?? (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? "";
  const firstName = fullName.split(" ")[0];
  const visualModeLabel = mode === "showtime" ? "Show" : "Ring";

  useEffect(() => {
    setShowMenu(false);
    setShowModeMenu(false);
  }, [pathname]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (showMenu && userMenuRef.current && !userMenuRef.current.contains(target)) {
        setShowMenu(false);
      }
      if (showModeMenu && modeMenuRef.current && !modeMenuRef.current.contains(target)) {
        setShowModeMenu(false);
      }
    };

    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, [showMenu, showModeMenu]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b backdrop-blur-xl md:hidden",
        isShowtime
          ? "border-white/10 bg-[#090d16]/70 shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
          : "border-slate-200/50 bg-white/80 shadow-sm"
      )}
    >
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="OprexDuit" width={28} height={28} className="rounded-xl" />
          <span className={cn("text-sm font-bold tracking-tight", isShowtime ? "text-slate-100" : "text-slate-800")}>
            Oprex<span className={cn(isShowtime ? "text-emerald-300" : "text-teal-600")}>Duit</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div ref={modeMenuRef} className="relative">
            <button
              onClick={() => setShowModeMenu((v) => !v)}
              className={cn(
                "inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-[11px] font-semibold transition",
                isShowtime
                  ? "border-white/[0.12] bg-white/[0.04] text-slate-100"
                  : "border-slate-200 bg-white text-slate-600"
              )}
            >
              <Sparkles className={cn("h-3 w-3", isShowtime ? "text-emerald-300" : "text-teal-600")} />
              {visualModeLabel}
            </button>
            <AnimatePresence>
              {showModeMenu && (
                <ModeMenu
                  showtime={isShowtime}
                  mode={mode}
                  prefersReducedMotion={prefersReducedMotion}
                  onSelect={(next) => {
                    setMode(next);
                    setShowModeMenu(false);
                  }}
                />
              )}
            </AnimatePresence>
          </div>

          {!loading && (
            user ? (
              <div ref={userMenuRef} className="relative">
                <button
                  onClick={() => setShowMenu((p) => !p)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs transition-all",
                    isShowtime
                      ? "border-white/[0.12] bg-white/[0.04] text-slate-200"
                      : "border-slate-200 text-slate-500"
                  )}
                >
                  {animalAvatar ? (
                    <span className="inline-flex h-5 w-5 items-center justify-center text-base" title={animalAvatar.label}>
                      {animalAvatar.emoji}
                    </span>
                  ) : imageAvatar ? (
                    <Image src={imageAvatar} alt={firstName} width={22} height={22} className="rounded-full" />
                  ) : (
                    <div
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white",
                        isShowtime ? "bg-emerald-400/70" : "bg-teal-600"
                      )}
                    >
                      {firstName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className={cn("hidden max-w-[80px] truncate sm:inline", isShowtime ? "text-slate-100" : "text-slate-700")}>{firstName}</span>
                  <ChevronDown className={cn("h-3 w-3", isShowtime ? "text-slate-200" : "text-slate-700")} />
                </button>
                <AnimatePresence>
                  {showMenu && <UserMenu showtime={isShowtime} onSignOut={async () => {
                    await signOut();
                    setShowMenu(false);
                  }} />}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                href="/auth/login"
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-all",
                  isShowtime
                    ? "border-emerald-300/35 bg-emerald-400/[0.12] text-emerald-100"
                    : "border-teal-500/30 bg-teal-500/5 text-teal-700"
                )}
              >
                <LogIn className="h-3.5 w-3.5" />
                Masuk
              </Link>
            )
          )}
        </div>
      </div>
    </header>
  );
}
