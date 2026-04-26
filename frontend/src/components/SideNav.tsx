"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Receipt, BarChart3, Wallet,
  PiggyBank, Settings, ShoppingBag
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
  { href: "/belanja",      label: "Belanja AI",   icon: ShoppingBag,     mobileShow: true },
  { href: "/aset",         label: "Aset",         icon: PiggyBank,       mobileShow: true },
  { href: "/settings",     label: "Menu",         icon: Settings,        mobileShow: true },
];


export function SideNav({ onDonasi, hideOnDesktop }: { onDonasi?: () => void; hideOnDesktop?: boolean }) {
  void onDonasi;
  return (
    <>
      {/* ── Mobile Bottom Nav ── */}
      <nav className={`fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-2xl border-t border-slate-200/50 shadow-[0_-4px_24px_rgba(0,0,0,0.02)] flex items-center justify-around px-2 py-2 safe-pb ${hideOnDesktop ? 'md:hidden' : ''}`}
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
    <motion.div whileTap={{ scale: 0.94 }} whileHover={{ y: -1 }} transition={{ duration: 0.18 }}>
      <Link href={item.href} className="relative flex min-w-[44px] flex-col items-center gap-0.5 rounded-xl px-3 py-1">
        {isActive && (
          <motion.span
            layoutId="mobile-active-pill"
            className="absolute inset-0 rounded-xl border border-teal-200 bg-teal-50/90"
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
          />
        )}
        <Icon
          className="relative z-10 h-5 w-5 transition-colors"
          style={{ color: isActive ? "#0f766e" : "#94a3b8" }}
        />
        <span
          className="relative z-10 text-[9px] font-medium leading-none transition-colors"
          style={{ color: isActive ? "#0f766e" : "#94a3b8" }}
        >
          {item.label.split(" ")[0]}
        </span>
      </Link>
    </motion.div>
  );
}
