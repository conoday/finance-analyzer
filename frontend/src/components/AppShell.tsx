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
    <div className="relative min-h-screen overflow-x-hidden bg-[#f4f8fb]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-120px] top-[-120px] h-80 w-80 rounded-full bg-teal-200/30 blur-3xl" />
        <div className="absolute right-[-120px] top-10 h-80 w-80 rounded-full bg-sky-200/25 blur-3xl" />
        <div className="absolute bottom-[-140px] left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-orange-200/20 blur-3xl" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Desktop Top Navigation */}
        <TopNav />
        {/* Mobile Top Header (Keeps the logo and auth) */}
        <Header onDonasi={() => setShowDonasi(true)} />

        {/* Main content */}
        <div className="min-w-0 flex-1 pb-20 md:pb-0">
          <main className="mx-auto w-full max-w-[1540px] flex-1 px-4 py-5 sm:px-6 md:py-6 lg:px-10 lg:py-8">
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
