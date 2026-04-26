"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { SideNav } from "@/components/SideNav";
import { Header } from "@/components/Header";
import { TopNav } from "@/components/TopNav";
import { AnimatePresence, motion, useScroll, useSpring, useTransform } from "framer-motion";
import { DonasiModal } from "@/components/SharePanel";
import { useDisplayMode } from "@/hooks/useDisplayMode";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [showDonasi, setShowDonasi] = useState(false);
  const pathname = usePathname();
  const { isShowtime, prefersReducedMotion, motionTier } = useDisplayMode();
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 130, damping: 24, mass: 0.25 });
  const orbLeftY = useTransform(scrollYProgress, [0, 1], [0, isShowtime ? -42 : -14]);
  const orbRightY = useTransform(scrollYProgress, [0, 1], [0, isShowtime ? 28 : 9]);
  const orbBottomY = useTransform(scrollYProgress, [0, 1], [0, isShowtime ? -26 : -8]);

  return (
    <div className={`relative min-h-screen overflow-x-hidden bg-[#f4f8fb] ${isShowtime ? "ui-showtime" : "ui-ringkas"}`}>
      <div className="motion-ambient pointer-events-none absolute inset-0">
        <motion.div
          style={{ y: orbLeftY }}
          className="absolute left-[-120px] top-[-120px] h-80 w-80 rounded-full bg-teal-200/30 blur-3xl"
        />
        <motion.div
          style={{ y: orbRightY }}
          className="absolute right-[-120px] top-10 h-80 w-80 rounded-full bg-sky-200/25 blur-3xl"
        />
        <motion.div
          style={{ y: orbBottomY }}
          className="absolute bottom-[-140px] left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-orange-200/20 blur-3xl"
        />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        <motion.div
          className="fixed left-0 right-0 top-0 z-[60] h-[3px] origin-left bg-gradient-to-r from-teal-500 via-sky-500 to-amber-400"
          style={{ scaleX: prefersReducedMotion ? 1 : progress }}
        />

        {/* Desktop Top Navigation */}
        <TopNav />
        {/* Mobile Top Header (Keeps the logo and auth) */}
        <Header onDonasi={() => setShowDonasi(true)} />

        {/* Main content */}
        <div className="min-w-0 flex-1 pb-20 md:pb-0">
          <AnimatePresence mode="wait" initial={false}>
            {prefersReducedMotion ? (
              <main
                key={pathname}
                className="mx-auto w-full max-w-[1540px] flex-1 px-4 py-5 sm:px-6 md:py-6 lg:px-10 lg:py-8"
              >
                {children}
              </main>
            ) : (
              <motion.main
                key={pathname}
                initial={{ opacity: 0, y: isShowtime ? 12 : 7, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: isShowtime ? -8 : -4, filter: "blur(4px)" }}
                transition={{ duration: motionTier.context, ease: "easeOut" }}
                className="mx-auto w-full max-w-[1540px] flex-1 px-4 py-5 sm:px-6 md:py-6 lg:px-10 lg:py-8"
              >
                {children}
              </motion.main>
            )}
          </AnimatePresence>
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
