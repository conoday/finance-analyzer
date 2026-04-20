"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Receipt, BarChart3, Wallet, TrendingUp,
  Upload, PiggyBank, Settings, Heart
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  mobileShow?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/",              label: "Dashboard",    icon: LayoutDashboard, mobileShow: true },
  { href: "/transaksi",    label: "Transaksi",    icon: Receipt,         mobileShow: true },
  { href: "/laporan",      label: "Laporan",      icon: BarChart3,       mobileShow: true },
  { href: "/budget",       label: "Budget",       icon: Wallet,          mobileShow: true },
  { href: "/perencanaan",  label: "Perencanaan",  icon: TrendingUp,      mobileShow: false },
  { href: "/import",       label: "Import Mutasi",icon: Upload,          mobileShow: false },
  { href: "/aset",         label: "Aset & Hutang",icon: PiggyBank,       mobileShow: false },
  { href: "/settings",     label: "Pengaturan",   icon: Settings,        mobileShow: true },
];

function NavLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const pathname = usePathname();
  const isActive = pathname === item.href;
  const Icon = item.icon;

  return (
    <Link href={item.href} className="block">
      <motion.div
        whileHover={{ x: 2 }}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${
          isActive
            ? "bg-teal-600 text-white shadow-sm shadow-teal-200"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        }`}
        title={collapsed ? item.label : undefined}
      >
        <Icon className="w-4.5 h-4.5 shrink-0" style={{ width: "18px", height: "18px" }} />
        {!collapsed && (
          <span className="truncate leading-none">{item.label}</span>
        )}
      </motion.div>
    </Link>
  );
}

export function SideNav({ onDonasi }: { onDonasi?: () => void }) {
  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex flex-col w-52 shrink-0 min-h-screen py-4 px-3 border-r bg-white sticky top-0 self-start"
        style={{ borderColor: "rgba(20,184,166,0.12)", maxHeight: "100vh" }}
      >
        {/* Logo */}
        <div className="px-2 mb-6 flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="OprexDuit" className="w-7 h-7 rounded-xl" />
          <span className="text-sm font-bold text-slate-800 tracking-tight">
            Oprex<span className="text-teal-600">Duit</span>
          </span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} item={item} collapsed={false} />
          ))}
        </nav>

        {/* Bottom */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          {onDonasi && (
            <button
              onClick={onDonasi}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-pink-500 hover:bg-pink-50 transition-all"
            >
              <Heart className="w-4 h-4 shrink-0" />
              <span>Donasi</span>
            </button>
          )}
          <p className="text-[10px] text-slate-400 px-3 mt-3">v1.0 · OprexDuit</p>
        </div>
      </aside>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t flex items-center justify-around px-2 py-2 safe-pb"
        style={{ borderColor: "rgba(20,184,166,0.15)" }}
      >
        {NAV_ITEMS.filter((i) => i.mobileShow).map((item) => (
          <MobileNavItem key={item.href} item={item} />
        ))}
      </nav>
    </>
  );
}

function MobileNavItem({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const isActive = pathname === item.href;
  const Icon = item.icon;

  return (
    <Link href={item.href} className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl min-w-[44px]">
      <Icon
        className="w-5 h-5 transition-colors"
        style={{ color: isActive ? "#0f766e" : "#94a3b8" }}
      />
      <span
        className="text-[9px] font-medium leading-none transition-colors"
        style={{ color: isActive ? "#0f766e" : "#94a3b8" }}
      >
        {item.label.split(" ")[0]}
      </span>
    </Link>
  );
}
