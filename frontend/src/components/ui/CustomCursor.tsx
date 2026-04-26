"use client";

import { useEffect, useState } from "react";

type CustomCursorProps = {
  enabled?: boolean;
};

export function CustomCursor({ enabled = true }: CustomCursorProps) {
  const [isFinePointer, setIsFinePointer] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(pointer: fine)");

    const updatePointer = () => {
      setIsFinePointer(media.matches);
    };

    updatePointer();
    media.addEventListener("change", updatePointer);

    return () => media.removeEventListener("change", updatePointer);
  }, []);

  useEffect(() => {
    if (!enabled || !isFinePointer) {
      document.body.classList.remove("oprex-cursor-enabled");
      return;
    }

    const onMove = (event: MouseEvent) => {
      setPosition({ x: event.clientX, y: event.clientY });
    };

    const onOver = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const isInteractive =
        target.tagName.toLowerCase() === "button" ||
        target.tagName.toLowerCase() === "a" ||
        target.closest("button") ||
        target.closest("a") ||
        target.getAttribute("role") === "button" ||
        target.closest('[role="button"]');
      setHovering(Boolean(isInteractive));
    };

    document.body.classList.add("oprex-cursor-enabled");
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseover", onOver);

    return () => {
      document.body.classList.remove("oprex-cursor-enabled");
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
    };
  }, [enabled, isFinePointer]);

  if (!enabled || !isFinePointer) {
    return null;
  }

  return (
    <div
      id="oprex-custom-cursor"
      data-hovering={hovering ? "true" : "false"}
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      aria-hidden
    />
  );
}
