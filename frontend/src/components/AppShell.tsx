"use client";

import { useState } from "react";
import { SideNav } from "@/components/SideNav";
import { Header } from "@/components/Header";
import { TopNav } from "@/components/TopNav";
import { AnimatePresence } from "framer-motion";
import { DonasiModal } from "@/components/SharePanel";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [showDonasi, setShowDonasi] = useState(false);

  return (
    <div className="relative flex flex-col min-h-screen bg-slate-50 overflow-x-hidden">
      
      <div className="relative z-10 flex flex-col flex-1">
        {/* Desktop Top Navigation */}
        <TopNav />
        {/* Mobile Top Header (Keeps the logo and auth) */}
        <Header onDonasi={() => setShowDonasi(true)} />

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">
          <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 mx-auto w-full max-w-[1440px]">
            {children}
          </main>
        </div>

        {/* Mobile Bottom Navigation (SideNav is hidden on md+ via CSS in its internal component) */}
        <SideNav onDonasi={() => setShowDonasi(true)} hideOnDesktop />

        {/* Donation modal */}
        <AnimatePresence>
          {showDonasi && <DonasiModal onClose={() => setShowDonasi(false)} />}
        </AnimatePresence>
      </div>
    </div>
  );
}
