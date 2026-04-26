"use client";

import type { MouseEvent, ReactNode } from "react";
import { useRef } from "react";
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

type TiltCardProps = Omit<HTMLMotionProps<"div">, "onMouseMove" | "onMouseLeave" | "children"> & {
  children?: ReactNode;
  glow?: boolean;
  enabled?: boolean;
};

export function TiltCard({ className, children, glow = true, enabled = true, ...props }: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);

  const springX = useSpring(tiltX, { stiffness: 140, damping: 18, mass: 0.2 });
  const springY = useSpring(tiltY, { stiffness: 140, damping: 18, mass: 0.2 });

  const rotateX = useTransform(springY, [-0.5, 0.5], ["8deg", "-8deg"]);
  const rotateY = useTransform(springX, [-0.5, 0.5], ["-8deg", "8deg"]);

  const glowBackground = useMotionTemplate`radial-gradient(540px circle at ${mouseX}px ${mouseY}px, rgba(255,255,255,0.14), transparent 42%)`;

  const onMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (!enabled || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const localX = event.clientX - rect.left;
    const localY = event.clientY - rect.top;
    const normalizedX = localX / rect.width - 0.5;
    const normalizedY = localY / rect.height - 0.5;

    mouseX.set(localX);
    mouseY.set(localY);
    tiltX.set(normalizedX);
    tiltY.set(normalizedY);
  };

  const onMouseLeave = () => {
    tiltX.set(0);
    tiltY.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={enabled ? { rotateX, rotateY, transformStyle: "preserve-3d" } : undefined}
      className={cn("group relative overflow-hidden rounded-3xl", className)}
      {...props}
    >
      {enabled && glow ? (
        <motion.div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: glowBackground }}
        />
      ) : null}
      <div style={enabled ? { transform: "translateZ(42px)" } : undefined} className="relative z-10 h-full w-full">
        {children}
      </div>
    </motion.div>
  );
}
