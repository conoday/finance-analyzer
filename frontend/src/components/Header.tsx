"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogIn, LogOut, ChevronDown, Settings } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

interface HeaderProps {
  hasData?: boolean;
  onReset?: () => void;
  onDonasi?: () => void;
}

function UserMenu({ onSignOut }: { onSignOut: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="absolute top-full right-0 mt-2 z-50 w-44"
    >
      <div
        className="rounded-xl py-1 shadow-lg text-xs"
        style={{ background: "#ffffff", border: "1px solid #e2e8f0" }}
      >
        <Link
          href="/settings"
          className="w-full flex items-center gap-2 px-3 py-2 text-slate-800 hover:bg-slate-50 transition-colors"
        >
          <Settings className="w-3.5 h-3.5" />
          Pengaturan
        </Link>
        <div style={{ height: "1px", background: "#f1f5f9", margin: "2px 0" }} />
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-2 px-3 py-2 text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Keluar
        </button>
        <div
          className="absolute -top-1.5 right-6 w-3 h-3 rotate-45"
          style={{ background: "#ffffff", borderTop: "1px solid #e2e8f0", borderLeft: "1px solid #e2e8f0" }}
        />
      </div>
    </motion.div>
  );
}

export function Header({ onDonasi }: HeaderProps) {
  const [showMenu, setShowMenu] = useState(false);
  const { user, loading, signOut } = useAuth();

  const avatar   = user?.user_metadata?.avatar_url as string | undefined;
  const fullName = (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? "";
  const firstName = fullName.split(" ")[0];

  return (
    <header
      className="sticky top-0 z-40 w-full md:hidden"
      style={{ background: "rgba(255,255,255,0.92)", borderBottom: "1px solid rgba(20,184,166,0.12)", backdropFilter: "blur(20px)" }}
    >
      <div className="px-4 h-14 flex items-center justify-between">
        {/* Logo — mobile only */}
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="OprexDuit" width={28} height={28} className="rounded-xl" />
          <span className="text-sm font-bold text-slate-800 tracking-tight">
            Oprex<span className="text-teal-600">Duit</span>
          </span>
        </div>

        {/* Auth button */}
        {!loading && (
          user ? (
            <div className="relative">
              <button
                onClick={() => setShowMenu((p) => !p)}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs transition-all"
                style={{ color: "#64748b", border: "1px solid #e2e8f0" }}
              >
                {avatar ? (
                  <Image src={avatar} alt={firstName} width={22} height={22} className="rounded-full" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-teal-600 flex items-center justify-center text-[9px] font-bold text-white">
                    {firstName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="hidden sm:inline max-w-[80px] truncate text-slate-700">{firstName}</span>
                <ChevronDown className="w-3 h-3 text-slate-700" />
              </button>
              <AnimatePresence>
                {showMenu && (
                  <UserMenu onSignOut={async () => { await signOut(); setShowMenu(false); }} />
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all"
              style={{ color: "#0f766e", border: "1px solid rgba(20,184,166,0.30)", background: "rgba(20,184,166,0.06)" }}
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
