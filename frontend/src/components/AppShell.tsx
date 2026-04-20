"use client";

import { useState } from "react";
import { SideNav } from "@/components/SideNav";
import { Header } from "@/components/Header";
import { AnimatePresence } from "framer-motion";
import { DonasiModal } from "@/components/SharePanel";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [showDonasi, setShowDonasi] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar (desktop) */}
      <SideNav onDonasi={() => setShowDonasi(true)} />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header: logo (mobile only) + auth */}
        <Header onDonasi={() => setShowDonasi(true)} />

        {/* Page content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8 max-w-screen-xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Donation modal */}
      <AnimatePresence>
        {showDonasi && <DonasiModal onClose={() => setShowDonasi(false)} />}
      </AnimatePresence>
    </div>
  );
}
