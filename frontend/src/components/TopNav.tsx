"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  ShoppingBag,
  Target,
  X,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { parseAnimalAvatarToken } from "@/lib/avatar";
import { useDisplayMode } from "@/hooks/useDisplayMode";
import { cn } from "@/lib/utils";

type MenuItem = {
  name: string;
  path: string;
  icon: LucideIcon;
  keywords: string[];
};

function UserMenu({ onSignOut, email, showtime }: { onSignOut: () => void; email?: string | null; showtime: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className={cn(
        "absolute right-0 top-full z-50 mt-3 w-56 overflow-hidden rounded-2xl border shadow-xl",
        showtime ? "border-white/[0.12] bg-[#0b1020]/95" : "border-slate-200 bg-white"
      )}
    >
      <div className={cn("border-b px-4 py-3", showtime ? "border-white/10" : "border-slate-100")}>
        <p className={cn("text-xs font-semibold uppercase tracking-wide", showtime ? "text-slate-300/75" : "text-slate-500")}>Signed in</p>
        <p className={cn("mt-1 truncate text-sm font-semibold", showtime ? "text-slate-100" : "text-slate-900")}>{email ?? "Pengguna"}</p>
      </div>
      <div className="py-2 text-sm font-medium">
        <Link
          href="/settings"
          className={cn(
            "flex w-full items-center gap-3 px-4 py-2 transition-colors",
            showtime ? "text-slate-200 hover:bg-white/5" : "text-slate-700 hover:bg-slate-50"
          )}
        >
          <Settings className={cn("h-4 w-4", showtime ? "text-slate-400" : "text-slate-400")} />
          Settings
        </Link>
        <div className={cn("my-1 h-px", showtime ? "bg-white/10" : "bg-slate-100")} />
        <button
          onClick={onSignOut}
          className={cn(
            "flex w-full items-center gap-3 px-4 py-2 transition-colors",
            showtime ? "text-rose-200 hover:bg-rose-400/10" : "text-rose-600 hover:bg-rose-50"
          )}
        >
          <LogOut className={cn("h-4 w-4", showtime ? "text-rose-300" : "text-rose-500")} />
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

  const modeMenuRef = useRef<HTMLDivElement | null>(null);
  const alertsRef = useRef<HTMLDivElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  const { user, profile, loading, signOut } = useAuth();
  const { mode, setMode, isShowtime, prefersReducedMotion } = useDisplayMode();
  const pathname = usePathname();
  const router = useRouter();

  const avatarToken = String(profile?.avatar_url ?? user?.user_metadata?.avatar_url ?? "");
  const animalAvatar = parseAnimalAvatarToken(avatarToken);
  const avatarImage = animalAvatar ? "" : avatarToken;
  const fullName = profile?.full_name ?? (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? "User";
  const firstName = fullName.split(" ")[0];
  const email = user?.email;

  const menuItems: MenuItem[] = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard, keywords: ["home", "ringkasan", "overview"] },
    { name: "Transaksi", path: "/transaksi", icon: Receipt, keywords: ["catat", "riwayat", "hapus", "delete"] },
    { name: "Laporan", path: "/laporan", icon: BarChart3, keywords: ["report", "analisis", "chart", "grafik"] },
    { name: "Budget", path: "/budget", icon: Target, keywords: ["anggaran", "limit", "target"] },
    { name: "Belanja AI", path: "/belanja", icon: ShoppingBag, keywords: ["shop", "shopping", "produk", "affiliate"] },
    { name: "Aset", path: "/aset", icon: PiggyBank, keywords: ["asset", "utang", "networth"] },
    { name: "Perencanaan", path: "/perencanaan", icon: Compass, keywords: ["planner", "rencana", "goal"] },
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

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (showModeMenu && modeMenuRef.current && !modeMenuRef.current.contains(target)) {
        setShowModeMenu(false);
      }
      if (showAlerts && alertsRef.current && !alertsRef.current.contains(target)) {
        setShowAlerts(false);
      }
      if (showMenu && userMenuRef.current && !userMenuRef.current.contains(target)) {
        setShowMenu(false);
      }
    };

    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, [showAlerts, showMenu, showModeMenu]);

  const activeMenu =
    menuItems.find((item) => (item.path === "/" ? pathname === "/" : pathname.startsWith(item.path)))?.name ??
    "Dashboard";
  const visualModeLabel = isShowtime ? "Showtime" : "Ringkas";

  const quickActions: MenuItem[] = [
    ...menuItems,
    { name: "Pengaturan", path: "/settings", icon: Settings, keywords: ["settings", "akun", "telegram", "avatar", "notifikasi"] },
  ];

  const normalizedQuery = searchQuery.toLowerCase().trim();

  const filteredQuickActions = quickActions.filter((item) => {
    if (!normalizedQuery) return true;
    const haystack = `${item.name} ${item.keywords.join(" ")}`.toLowerCase();
    return haystack.includes(normalizedQuery);
  });

  const alertItems = useMemo(() => {
    return [
      {
        title: `Mode ${visualModeLabel} aktif`,
        body: `Halaman ${activeMenu} sedang ditampilkan dalam mode ${visualModeLabel}.`,
        path: pathname,
      },
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
  }, [activeMenu, pathname, visualModeLabel]);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 hidden w-full border-b backdrop-blur-xl md:block",
          isShowtime
            ? "border-white/10 bg-[#090d16]/70 shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
            : "border-white/70 bg-white/75"
        )}
      >
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
              <span className={cn("text-lg font-extrabold tracking-tight", isShowtime ? "text-slate-100" : "text-slate-900")}>
                Oprex<span className={cn(isShowtime ? "text-emerald-300" : "text-teal-500")}>Duit.</span>
              </span>
              <p className={cn("text-[10px] font-semibold uppercase tracking-wider", isShowtime ? "text-slate-300/60" : "text-slate-400")}>
                Platform Analitik Keuangan
              </p>
            </div>
          </Link>

          <nav
            className={cn(
              "hidden items-center gap-1.5 rounded-2xl p-1.5 lg:flex",
              isShowtime ? "border border-white/[0.12] bg-white/[0.04]" : "border border-slate-200/80 bg-white/85 shadow-sm"
            )}
          >
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.path === "/" ? pathname === "/" : pathname.startsWith(item.path);

              return (
                <Link
                  key={item.name}
                  href={item.path}
                  className={cn(
                    "relative flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all",
                    isShowtime
                      ? isActive
                        ? "text-emerald-100"
                        : "text-slate-300/80 hover:text-slate-100"
                      : isActive
                        ? "text-teal-700"
                        : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="topnav-active-pill"
                      className={cn(
                        "absolute inset-0 -z-10 rounded-xl border",
                        isShowtime ? "border-emerald-300/35 bg-emerald-400/10" : "border-teal-200 bg-teal-50"
                      )}
                      transition={{ type: "spring", stiffness: 420, damping: 30 }}
                    />
                  )}
                  <Icon className="h-3.5 w-3.5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="flex w-[440px] items-center justify-end gap-2">
            <div ref={modeMenuRef} className="relative hidden xl:block">
              <button
                onClick={() => setShowModeMenu((v) => !v)}
                className={cn(
                  "inline-flex items-center rounded-xl border px-3 py-1.5 text-[11px] font-semibold transition",
                  isShowtime
                    ? "border-white/[0.12] bg-white/[0.04] text-slate-200 hover:border-emerald-300/60 hover:text-emerald-100"
                    : "border-slate-200 bg-white/90 text-slate-500 hover:border-teal-200 hover:text-teal-700"
                )}
              >
                Mode: <span className={cn("ml-1", isShowtime ? "text-slate-100" : "text-slate-800")}>{visualModeLabel}</span>
              </button>
              <AnimatePresence>
                {showModeMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className={cn(
                      "absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border p-2 shadow-xl",
                      isShowtime ? "border-white/[0.12] bg-[#0b1020]/95" : "border-slate-200 bg-white"
                    )}
                  >
                    <p className={cn("px-2 pb-1 text-[10px] font-bold uppercase tracking-wide", isShowtime ? "text-slate-300/75" : "text-slate-500")}>
                      Tampilan
                    </p>
                    <div className="mb-2 grid grid-cols-2 gap-1">
                      <button
                        onClick={() => setMode("ringkas")}
                        className={cn(
                          "rounded-lg border px-2 py-1.5 text-[11px] font-semibold transition",
                          mode === "ringkas"
                            ? isShowtime
                              ? "border-emerald-300/45 bg-emerald-400/[0.12] text-emerald-100"
                              : "border-teal-200 bg-teal-50 text-teal-700"
                            : isShowtime
                              ? "border-white/[0.12] bg-white/[0.03] text-slate-200 hover:border-white/25"
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                        )}
                      >
                        Ringkas
                      </button>
                      <button
                        onClick={() => setMode("showtime")}
                        disabled={prefersReducedMotion}
                        className={cn(
                          "rounded-lg border px-2 py-1.5 text-[11px] font-semibold transition",
                          mode === "showtime"
                            ? isShowtime
                              ? "border-cyan-300/45 bg-cyan-400/[0.12] text-cyan-100"
                              : "border-indigo-200 bg-indigo-50 text-indigo-700"
                            : isShowtime
                              ? "border-white/[0.12] bg-white/[0.03] text-slate-200 hover:border-white/25"
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                          prefersReducedMotion ? "cursor-not-allowed opacity-45" : ""
                        )}
                      >
                        Showtime
                      </button>
                    </div>

                    {prefersReducedMotion ? (
                      <p
                        className={cn(
                          "mb-2 rounded-lg border px-2 py-1 text-[10px]",
                          isShowtime
                            ? "border-amber-300/30 bg-amber-400/10 text-amber-100"
                            : "border-amber-200 bg-amber-50 text-amber-700"
                        )}
                      >
                        Reduced-motion aktif di perangkat, efek Showtime dibatasi.
                      </p>
                    ) : null}

                    <div className={cn("mb-2 h-px", isShowtime ? "bg-white/10" : "bg-slate-100")} />
                    <p className={cn("px-2 pb-1 text-[10px] font-bold uppercase tracking-wide", isShowtime ? "text-slate-300/75" : "text-slate-500")}>
                      Pindah Halaman
                    </p>
                    {menuItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.path}
                          onClick={() => {
                            setShowModeMenu(false);
                            router.push(item.path);
                          }}
                          className={cn(
                            "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition",
                            isShowtime ? "text-slate-200 hover:bg-white/5" : "text-slate-700 hover:bg-slate-50"
                          )}
                        >
                          <Icon className={cn("h-3.5 w-3.5", isShowtime ? "text-slate-300/75" : "text-slate-500")} />
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
              className={cn(
                "hidden items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[11px] font-semibold transition lg:flex",
                isShowtime
                  ? "border-white/[0.12] bg-white/[0.04] text-slate-200 hover:border-emerald-300/60 hover:text-emerald-100"
                  : "border-slate-200 bg-white text-slate-500 hover:border-teal-200 hover:text-teal-700"
              )}
            >
              <Command className="h-3.5 w-3.5" />
              Search
            </button>

            <div ref={alertsRef} className="relative">
              <button
                onClick={() => setShowAlerts((v) => !v)}
                className={cn(
                  "relative flex h-9 w-9 items-center justify-center rounded-xl border transition-all",
                  isShowtime
                    ? "border-white/[0.12] bg-white/[0.04] text-slate-200 hover:border-white/30 hover:text-slate-100"
                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-900"
                )}
              >
                <Bell className="h-4 w-4" />
                <motion.span
                  className={cn(
                    "absolute right-1.5 top-1.5 h-2 w-2 rounded-full border",
                    isShowtime ? "border-[#090d16] bg-emerald-400" : "border-white bg-teal-500"
                  )}
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                />
              </button>

              <AnimatePresence>
                {showAlerts && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className={cn(
                      "absolute right-0 top-full z-50 mt-2 w-80 rounded-2xl border p-2 shadow-xl",
                      isShowtime ? "border-white/[0.12] bg-[#0b1020]/95" : "border-slate-200 bg-white"
                    )}
                  >
                    <div className="px-2 pb-1 pt-0.5">
                      <p className={cn("text-xs font-bold uppercase tracking-wide", isShowtime ? "text-slate-300/75" : "text-slate-500")}>
                        Notifikasi
                      </p>
                    </div>
                    <div className="space-y-1">
                      {alertItems.map((item) => (
                        <Link
                          key={item.title}
                          href={item.path}
                          onClick={() => setShowAlerts(false)}
                          className={cn(
                            "block rounded-xl border px-3 py-2 transition",
                            isShowtime
                              ? "border-white/10 hover:border-emerald-300/40 hover:bg-emerald-400/10"
                              : "border-slate-100 hover:border-teal-100 hover:bg-teal-50/50"
                          )}
                        >
                          <p className={cn("text-xs font-semibold", isShowtime ? "text-slate-100" : "text-slate-900")}>{item.title}</p>
                          <p className={cn("mt-0.5 text-[11px]", isShowtime ? "text-slate-300/75" : "text-slate-500")}>{item.body}</p>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className={cn("mx-1 h-6 w-px", isShowtime ? "bg-white/15" : "bg-slate-200")} />

            {!loading && user && (
              <div ref={userMenuRef} className="relative">
                <button
                  onClick={() => setShowMenu((prev) => !prev)}
                  className={cn(
                    "group flex items-center gap-2 rounded-2xl border px-2 py-1.5 transition",
                    isShowtime
                      ? "border-white/[0.12] bg-white/[0.04] hover:border-emerald-300/60"
                      : "border-slate-200 bg-white/90 shadow-sm hover:border-teal-200"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl p-0.5",
                      isShowtime ? "bg-emerald-300/10" : "bg-teal-50"
                    )}
                  >
                    {animalAvatar ? (
                      <span className="text-lg" title={animalAvatar.label}>{animalAvatar.emoji}</span>
                    ) : avatarImage ? (
                      <Image src={avatarImage} alt={firstName} width={30} height={30} className="h-full w-full rounded-lg object-cover" />
                    ) : (
                      <span className={cn("text-sm font-bold", isShowtime ? "text-emerald-200" : "text-teal-700")}>
                        {firstName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="hidden text-left lg:block">
                    <p className={cn("text-xs font-bold", isShowtime ? "text-slate-100" : "text-slate-800")}>{firstName}</p>
                    <p className={cn("text-[10px]", isShowtime ? "text-slate-300/70" : "text-slate-500")}>Akun aktif</p>
                  </div>
                </button>

                <AnimatePresence>
                  {showMenu && (
                    <UserMenu
                      showtime={isShowtime}
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
                className={cn(
                  "rounded-xl border px-3 py-1.5 text-xs font-semibold transition",
                  isShowtime
                    ? "border-emerald-300/35 bg-emerald-400/[0.12] text-emerald-100 hover:border-emerald-300/60"
                    : "border-teal-200 bg-teal-50 text-teal-700 hover:border-teal-300 hover:bg-teal-100"
                )}
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
            className={cn(
              "fixed inset-0 z-[70] hidden items-start justify-center pt-24 backdrop-blur-sm md:flex",
              isShowtime ? "bg-black/55" : "bg-slate-900/40"
            )}
            onClick={() => setShowSearch(false)}
          >
            <motion.div
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -8, opacity: 0 }}
              className={cn(
                "w-full max-w-xl rounded-3xl border p-4 shadow-2xl",
                isShowtime ? "border-white/[0.12] bg-[#0b1020]/95" : "border-slate-200 bg-white"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between">
                <p className={cn("text-sm font-bold", isShowtime ? "text-slate-100" : "text-slate-900")}>Pencarian Cepat</p>
                <button
                  onClick={() => setShowSearch(false)}
                  className={cn(
                    "inline-flex h-7 w-7 items-center justify-center rounded-lg transition",
                    isShowtime ? "text-slate-300 hover:bg-white/10 hover:text-slate-100" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  const first = filteredQuickActions[0];
                  if (!first) return;
                  setShowSearch(false);
                  router.push(first.path);
                }}
                className={cn(
                  "mb-3 flex items-center gap-2 rounded-xl border px-3 py-2",
                  isShowtime ? "border-white/[0.12] bg-black/25" : "border-slate-200 bg-slate-50"
                )}
              >
                <Search className={cn("h-4 w-4", isShowtime ? "text-slate-300/70" : "text-slate-400")} />
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari menu: transaksi, belanja, laporan..."
                  className={cn(
                    "w-full bg-transparent text-sm outline-none",
                    isShowtime ? "text-slate-100 placeholder:text-slate-400/70" : "text-slate-700 placeholder:text-slate-400"
                  )}
                />
              </form>

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
                        className={cn(
                          "flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition",
                          isShowtime
                            ? "border-white/10 hover:border-emerald-300/45 hover:bg-emerald-400/10"
                            : "border-slate-100 hover:border-teal-100 hover:bg-teal-50/50"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "inline-flex h-7 w-7 items-center justify-center rounded-lg",
                              isShowtime ? "bg-white/10 text-slate-100" : "bg-slate-100 text-slate-700"
                            )}
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <span className={cn("text-sm font-semibold", isShowtime ? "text-slate-100" : "text-slate-800")}>{item.name}</span>
                        </div>
                        <ChevronRight className={cn("h-4 w-4", isShowtime ? "text-slate-300/75" : "text-slate-400")} />
                      </button>
                    );
                  })
                ) : (
                  <p
                    className={cn(
                      "rounded-xl border px-3 py-3 text-sm",
                      isShowtime ? "border-white/10 bg-black/25 text-slate-300/80" : "border-slate-100 bg-slate-50 text-slate-500"
                    )}
                  >
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
