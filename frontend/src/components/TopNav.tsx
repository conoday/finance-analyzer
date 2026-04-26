"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  BarChart3,
  Command,
  Compass,
  LayoutDashboard,
  LogOut,
  PiggyBank,
  Receipt,
  Settings,
  Target,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

function UserMenu({ onSignOut, email }: { onSignOut: () => void; email?: string | null }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="absolute right-0 top-full z-50 mt-3 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
    >
      <div className="border-b border-slate-100 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Signed in</p>
        <p className="mt-1 truncate text-sm font-semibold text-slate-900">{email ?? "Pengguna"}</p>
      </div>
      <div className="py-2 text-sm font-medium">
        <Link
          href="/settings"
          className="flex w-full items-center gap-3 px-4 py-2 text-slate-700 transition-colors hover:bg-slate-50"
        >
          <Settings className="h-4 w-4 text-slate-400" />
          Settings
        </Link>
        <div className="my-1 h-px bg-slate-100" />
        <button
          onClick={onSignOut}
          className="flex w-full items-center gap-3 px-4 py-2 text-rose-600 transition-colors hover:bg-rose-50"
        >
          <LogOut className="h-4 w-4 text-rose-500" />
          Sign Out
        </button>
      </div>
    </motion.div>
  );
}

export function TopNav() {
  const [showMenu, setShowMenu] = useState(false);
  const { user, loading, signOut } = useAuth();
  const pathname = usePathname();

  const avatar = user?.user_metadata?.avatar_url as string | undefined;
  const fullName = (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? "User";
  const firstName = fullName.split(" ")[0];
  const email = user?.email;

  const menuItems: Array<{ name: string; path: string; icon: LucideIcon }> = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Transaksi", path: "/transaksi", icon: Receipt },
    { name: "Laporan", path: "/laporan", icon: BarChart3 },
    { name: "Budget", path: "/budget", icon: Target },
    { name: "Aset", path: "/aset", icon: PiggyBank },
    { name: "Perencanaan", path: "/perencanaan", icon: Compass },
  ];

  useEffect(() => {
    setShowMenu(false);
  }, [pathname]);

  const activeMenu =
    menuItems.find((item) => (item.path === "/" ? pathname === "/" : pathname.startsWith(item.path)))?.name ??
    "Dashboard";

  return (
    <header className="sticky top-0 z-40 hidden w-full border-b border-white/70 bg-white/75 backdrop-blur-xl md:block">
      <div className="mx-auto flex h-[78px] max-w-[1540px] items-center justify-between px-6 lg:px-10">
        <Link href="/" className="group flex w-[230px] items-center gap-3 transition-opacity hover:opacity-90">
          <Image
            src="/logo.png"
            alt="OprexDuit Logo"
            width={36}
            height={36}
            className="h-9 w-9 rounded-xl object-contain"
          />
          <div>
            <span className="text-lg font-extrabold tracking-tight text-slate-900">
              Oprex<span className="text-teal-500">Duit.</span>
            </span>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Financial Command Center
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1.5 rounded-2xl border border-slate-200/80 bg-white/85 p-1.5 shadow-sm lg:flex">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.path === "/" ? pathname === "/" : pathname.startsWith(item.path);

            return (
              <Link
                key={item.name}
                href={item.path}
                className={`relative flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                  isActive ? "text-teal-700" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="topnav-active-pill"
                    className="absolute inset-0 -z-10 rounded-xl border border-teal-200 bg-teal-50"
                    transition={{ type: "spring", stiffness: 420, damping: 30 }}
                  />
                )}
                <Icon className="h-3.5 w-3.5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="flex w-[340px] items-center justify-end gap-2">
          <div className="hidden rounded-xl border border-slate-200 bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-slate-500 xl:flex">
            Mode: <span className="ml-1 text-slate-800">{activeMenu}</span>
          </div>

          <button className="hidden items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-500 transition hover:border-teal-200 hover:text-teal-700 lg:flex">
            <Command className="h-3.5 w-3.5" />
            Search
          </button>

          <button className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-all hover:border-slate-300 hover:text-slate-900">
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border border-white bg-teal-500" />
          </button>

          <div className="mx-1 h-6 w-px bg-slate-200" />

          {!loading && user && (
            <div className="relative">
              <button
                onClick={() => setShowMenu((prev) => !prev)}
                className="group flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/90 px-2 py-1.5 shadow-sm transition hover:border-teal-200"
              >
                <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl bg-teal-50 p-0.5">
                  {avatar ? (
                    <Image src={avatar} alt={firstName} width={30} height={30} className="h-full w-full rounded-lg object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-teal-700">{firstName.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="hidden text-left lg:block">
                  <p className="text-xs font-bold text-slate-800">{firstName}</p>
                  <p className="text-[10px] text-slate-500">Akun aktif</p>
                </div>
              </button>

              <AnimatePresence>
                {showMenu && (
                  <UserMenu
                    email={email}
                    onSignOut={async () => {
                      await signOut();
                      setShowMenu(false);
                    }}
                  />
                )}
              </AnimatePresence>
            </div>
          )}

          {!loading && !user && (
            <Link
              href="/auth/login"
              className="rounded-xl border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 transition hover:border-teal-300 hover:bg-teal-100"
            >
              Masuk
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
