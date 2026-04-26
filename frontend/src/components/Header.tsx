"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogIn, LogOut, ChevronDown, Settings } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { parseAnimalAvatarToken } from "@/lib/avatar";
import { useDisplayMode } from "@/hooks/useDisplayMode";
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
      className="absolute top-full right-0 mt-2 z-50 w-44"
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
          <Settings className="w-3.5 h-3.5" />
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
          <LogOut className="w-3.5 h-3.5" />
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

export function Header({ onDonasi }: HeaderProps) {
  void onDonasi;
  const [showMenu, setShowMenu] = useState(false);
  const { user, profile, loading, signOut } = useAuth();
  const { isShowtime } = useDisplayMode();

  const avatarToken = String(profile?.avatar_url ?? user?.user_metadata?.avatar_url ?? "");
  const animalAvatar = parseAnimalAvatarToken(avatarToken);
  const imageAvatar = animalAvatar ? "" : avatarToken;
  const fullName = profile?.full_name ?? (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? "";
  const firstName = fullName.split(" ")[0];

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b backdrop-blur-xl md:hidden",
        isShowtime
          ? "border-white/10 bg-[#090d16]/70 shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
          : "border-slate-200/50 bg-white/80 shadow-sm"
      )}
    >
      <div className="px-4 h-14 flex items-center justify-between">
        {/* Logo — mobile only */}
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="OprexDuit" width={28} height={28} className="rounded-xl" />
          <span className={cn("text-sm font-bold tracking-tight", isShowtime ? "text-slate-100" : "text-slate-800")}>
            Oprex<span className={cn(isShowtime ? "text-emerald-300" : "text-teal-600")}>Duit</span>
          </span>
        </div>

        {/* Auth button */}
        {!loading && (
          user ? (
            <div className="relative">
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
                  <div className={cn("flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white", isShowtime ? "bg-emerald-400/70" : "bg-teal-600")}>
                    {firstName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className={cn("hidden max-w-[80px] truncate sm:inline", isShowtime ? "text-slate-100" : "text-slate-700")}>{firstName}</span>
                <ChevronDown className={cn("h-3 w-3", isShowtime ? "text-slate-200" : "text-slate-700")} />
              </button>
              <AnimatePresence>
                {showMenu && (
                  <UserMenu showtime={isShowtime} onSignOut={async () => { await signOut(); setShowMenu(false); }} />
                )}
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
              <LogIn className="w-3.5 h-3.5" />
              Masuk
            </Link>
          )
        )}
      </div>
    </header>
  );
}
