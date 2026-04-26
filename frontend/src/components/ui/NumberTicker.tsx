"use client";

import { useEffect, useRef } from "react";
import { useSpring } from "framer-motion";

type NumberTickerProps = {
  value: number;
  className?: string;
  delay?: number;
  format?: (value: number) => string;
};

export function NumberTicker({
  value,
  className,
  delay = 0,
  format = (v) => new Intl.NumberFormat("id-ID").format(v),
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const springValue = useSpring(0, {
    damping: 52,
    stiffness: 110,
  });

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      springValue.set(value);
    }, delay * 1000);

    return () => window.clearTimeout(timeout);
  }, [delay, springValue, value]);

  useEffect(() => {
    const unsubscribe = springValue.on("change", (latest) => {
      if (!ref.current) return;
      ref.current.textContent = format(Math.round(latest));
    });

    return () => unsubscribe();
  }, [format, springValue]);

  return (
    <span ref={ref} className={className}>
      {format(0)}
    </span>
  );
}
