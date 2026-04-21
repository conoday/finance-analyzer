"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Settings, Bell, Search, LayoutDashboard, Receipt, BarChart3, PiggyBank, Target } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

function UserMenu({ onSignOut }: { onSignOut: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="absolute top-full right-0 mt-3 z-50 w-48 shadow-lg rounded-2xl"
      style={{ background: "#ffffff", border: "1px solid #e2e8f0" }}
    >
      <div className="py-2 text-sm font-medium">
        <Link href="/settings" className="w-full flex items-center gap-3 px-4 py-2 text-slate-700 hover:bg-slate-50 transition-colors">
          <Settings className="w-4 h-4 text-slate-400" />
          Settings
        </Link>
        <div style={{ height: "1px", background: "#f1f5f9", margin: "4px 0" }} />
        <button onClick={onSignOut} className="w-full flex items-center gap-3 px-4 py-2 text-red-500 hover:bg-red-50 transition-colors">
          <LogOut className="w-4 h-4 text-red-400" />
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

  const menuItems = [
    { name: "Overview", path: "/", icon: LayoutDashboard },
    { name: "Transaksi", path: "/transaksi", icon: Receipt },
    { name: "Laporan", path: "/laporan", icon: BarChart3 },
    { name: "Aset", path: "/aset", icon: PiggyBank },
    { name: "Budget", path: "/budget", icon: Target },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#fcfcfc] border-b border-slate-200 hidden md:block">
      <div className="px-6 lg:px-10 h-[72px] mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 w-[200px]">
          <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center shadow-sm">
             <span className="text-white font-black text-sm">O</span>
          </div>
          <span className="text-lg font-extrabold text-slate-900 tracking-tight">
            Oprex<span className="text-orange-500">Duit.</span>
          </span>
        </Link>

        {/* Center Menu */}
        <nav className="flex items-center gap-2">
          {menuItems.map((item) => {
            const isActive = item.path === "/" ? pathname === "/" : pathname.startsWith(item.path);
            return (
              <Link
                key={item.name}
                href={item.path}
                className={`relative px-4 py-2 text-[13px] font-semibold transition-all rounded-full ${
                  isActive ? "text-slate-900 bg-orange-50" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                {item.name}
                {isActive && (
                  <motion.div
                    layoutId="topnav-indicator"
                    className="absolute -bottom-[20px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-orange-500"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-4 w-[200px] justify-end">
          <button className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm">
            <Search className="w-4 h-4" />
          </button>
          <button className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm relative">
            <Bell className="w-4 h-4" />
            <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-orange-500 border border-white" />
          </button>
          
          <div className="h-6 w-px bg-slate-200 mx-1" />

          {!loading && user && (
            <div className="relative">
              <button
                onClick={() => setShowMenu((p) => !p)}
                className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm overflow-hidden p-0.5"
              >
                {avatar ? (
                  <Image src={avatar} alt={firstName} width={34} height={34} className="rounded-full w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm">
                    {firstName.charAt(0).toUpperCase()}
                  </div>
                )}
              </button>
              <AnimatePresence>
                {showMenu && (
                  <UserMenu onSignOut={async () => { await signOut(); setShowMenu(false); }} />
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
