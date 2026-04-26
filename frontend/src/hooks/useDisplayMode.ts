"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useReducedMotion } from "framer-motion";

export type DisplayMode = "ringkas" | "showtime";

type MotionTier = {
  micro: number;
  context: number;
  signature: number;
};

const STORAGE_KEY = "oprex_display_mode";
const MODE_EVENT = "oprex:display-mode";

function readMode(): DisplayMode {
  if (typeof window === "undefined") return "ringkas";
  const value = window.localStorage.getItem(STORAGE_KEY);
  return value === "showtime" ? "showtime" : "ringkas";
}

export function useDisplayMode() {
  const prefersReducedMotion = !!useReducedMotion();
  const [mode, setModeState] = useState<DisplayMode>(() => readMode());

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncMode = () => {
      setModeState(readMode());
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        syncMode();
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener(MODE_EVENT, syncMode as EventListener);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(MODE_EVENT, syncMode as EventListener);
    };
  }, []);

  const setMode = useCallback((nextMode: DisplayMode) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, nextMode);
    setModeState(nextMode);
    window.dispatchEvent(new Event(MODE_EVENT));
  }, []);

  const isShowtime = mode === "showtime" && !prefersReducedMotion;

  const motionTier: MotionTier = useMemo(() => {
    if (prefersReducedMotion) {
      return { micro: 0.1, context: 0.14, signature: 0.2 };
    }

    if (isShowtime) {
      return { micro: 0.16, context: 0.28, signature: 0.85 };
    }

    return { micro: 0.13, context: 0.2, signature: 0.45 };
  }, [isShowtime, prefersReducedMotion]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    document.documentElement.setAttribute("data-visual-mode", isShowtime ? "showtime" : "ringkas");
    document.documentElement.setAttribute("data-motion", prefersReducedMotion ? "reduced" : "normal");
  }, [isShowtime, prefersReducedMotion]);

  return {
    mode,
    setMode,
    isShowtime,
    prefersReducedMotion,
    motionTier,
  };
}
