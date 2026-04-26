"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useDisplayMode } from "@/hooks/useDisplayMode";

type MotionSectionProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  once?: boolean;
  amount?: number;
};

export function MotionSection({
  children,
  className,
  delay = 0,
  y = 16,
  once = true,
  amount = 0.2,
}: MotionSectionProps) {
  const { isShowtime, prefersReducedMotion, motionTier } = useDisplayMode();
  const effectiveY = isShowtime ? y : Math.max(6, Math.round(y * 0.55));
  const duration = isShowtime ? 0.55 : motionTier.context;

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: effectiveY, filter: "blur(5px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once, amount }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.section>
  );
}
