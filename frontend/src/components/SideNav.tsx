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
  { href: "/laporan",      label: "Laporan",      icon: BarChart3,       mobileShow: false },
  { href: "/budget",       label: "Budget",       icon: Wallet,          mobileShow: true },
  { href: "/aset",         label: "Aset",         icon: PiggyBank,       mobileShow: true },
  { href: "/settings",     label: "Menu",         icon: Settings,        mobileShow: true },
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

export function SideNav({ onDonasi, hideOnDesktop }: { onDonasi?: () => void; hideOnDesktop?: boolean }) {
  return (
    <>
      {/* ── Mobile Bottom Nav ── */}
      <nav className={`fixed bottom-0 left-0 right-0 z-50 bg-white border-t flex items-center justify-around px-2 py-2 safe-pb ${hideOnDesktop ? 'md:hidden' : ''}`}
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
