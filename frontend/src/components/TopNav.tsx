"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  BarChart3,
  ChevronRight,
  Command,
  Compass,
  LayoutDashboard,
  LogOut,
  PiggyBank,
  Receipt,
  Search,
  Settings,
  Target,
  X,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { parseAnimalAvatarToken } from "@/lib/avatar";

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
  const [showModeMenu, setShowModeMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { user, loading, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const avatar = user?.user_metadata?.avatar_url as string | undefined;
  const animalAvatar = parseAnimalAvatarToken(avatar);
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
    setShowModeMenu(false);
    setShowAlerts(false);
  }, [pathname]);

  useEffect(() => {
    if (!showSearch) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowSearch(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showSearch]);

  useEffect(() => {
    const onShortcut = (event: KeyboardEvent) => {
      const isOpenSearch = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k";
      if (!isOpenSearch) return;
      event.preventDefault();
      setShowSearch(true);
      setSearchQuery("");
    };

    window.addEventListener("keydown", onShortcut);
    return () => window.removeEventListener("keydown", onShortcut);
  }, []);

  const activeMenu =
    menuItems.find((item) => (item.path === "/" ? pathname === "/" : pathname.startsWith(item.path)))?.name ??
    "Dashboard";

  const quickActions = [...menuItems, { name: "Pengaturan", path: "/settings", icon: Settings }];

  const filteredQuickActions = quickActions.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const alertItems = [
    {
      title: "Review kategori Lainnya",
      body: "Periksa transaksi terbaru dan rapikan kategori agar insight makin akurat.",
      path: "/transaksi",
    },
    {
      title: "Pantau arus kas bulan ini",
      body: "Buka laporan untuk melihat tren pemasukan vs pengeluaran.",
      path: "/laporan",
    },
    {
      title: "Update profil keamanan",
      body: "Atur avatar dan koneksi Telegram di Pengaturan.",
      path: "/settings",
    },
  ];

  return (
    <>
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

          <div className="flex w-[400px] items-center justify-end gap-2">
            <div className="relative hidden xl:block">
              <button
                onClick={() => setShowModeMenu((v) => !v)}
                className="inline-flex items-center rounded-xl border border-slate-200 bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-slate-500 transition hover:border-teal-200 hover:text-teal-700"
              >
                Mode: <span className="ml-1 text-slate-800">{activeMenu}</span>
              </button>
              <AnimatePresence>
                {showModeMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="absolute right-0 top-full z-50 mt-2 w-48 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl"
                  >
                    {menuItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.path}
                          onClick={() => {
                            setShowModeMenu(false);
                            router.push(item.path);
                          }}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          <Icon className="h-3.5 w-3.5 text-slate-500" />
                          {item.name}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={() => {
                setShowSearch(true);
                setSearchQuery("");
              }}
              className="hidden items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-500 transition hover:border-teal-200 hover:text-teal-700 lg:flex"
            >
              <Command className="h-3.5 w-3.5" />
              Search
            </button>

            <div className="relative">
              <button
                onClick={() => setShowAlerts((v) => !v)}
                className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-all hover:border-slate-300 hover:text-slate-900"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border border-white bg-teal-500" />
              </button>

              <AnimatePresence>
                {showAlerts && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="absolute right-0 top-full z-50 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl"
                  >
                    <div className="px-2 pb-1 pt-0.5">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Notifikasi</p>
                    </div>
                    <div className="space-y-1">
                      {alertItems.map((item) => (
                        <Link
                          key={item.title}
                          href={item.path}
                          className="block rounded-xl border border-slate-100 px-3 py-2 transition hover:border-teal-100 hover:bg-teal-50/50"
                        >
                          <p className="text-xs font-semibold text-slate-900">{item.title}</p>
                          <p className="mt-0.5 text-[11px] text-slate-500">{item.body}</p>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="mx-1 h-6 w-px bg-slate-200" />

            {!loading && user && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu((prev) => !prev)}
                  className="group flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/90 px-2 py-1.5 shadow-sm transition hover:border-teal-200"
                >
                  <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl bg-teal-50 p-0.5">
                    {animalAvatar ? (
                      <span className="text-lg" title={animalAvatar.label}>{animalAvatar.emoji}</span>
                    ) : avatar ? (
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

      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] hidden items-start justify-center bg-slate-900/40 pt-24 backdrop-blur-sm md:flex"
            onClick={() => setShowSearch(false)}
          >
            <motion.div
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -8, opacity: 0 }}
              className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-bold text-slate-900">Pencarian Cepat</p>
                <button
                  onClick={() => setShowSearch(false)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mb-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari menu: transaksi, laporan, budget..."
                  className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>

              <div className="max-h-[280px] space-y-1 overflow-y-auto pr-1">
                {filteredQuickActions.length > 0 ? (
                  filteredQuickActions.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.path}
                        onClick={() => {
                          setShowSearch(false);
                          router.push(item.path);
                        }}
                        className="flex w-full items-center justify-between rounded-xl border border-slate-100 px-3 py-2 text-left transition hover:border-teal-100 hover:bg-teal-50/50"
                      >
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <span className="text-sm font-semibold text-slate-800">{item.name}</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </button>
                    );
                  })
                ) : (
                  <p className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 text-sm text-slate-500">
                    Tidak ada menu yang cocok dengan kata kunci tersebut.
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
