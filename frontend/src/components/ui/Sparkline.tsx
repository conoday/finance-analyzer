"use client";

import { useId, useMemo } from "react";

type SparklinePoint = {
  value: number;
};

type SparklineProps = {
  data: SparklinePoint[];
  color?: string;
  className?: string;
};

function toPath(values: number[], width: number, height: number) {
  if (values.length === 0) return "";

  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = Math.max(1, max - min);

  return values
    .map((value, index) => {
      const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

export function Sparkline({ data, color = "#00ff94", className }: SparklineProps) {
  const gradientId = useId().replace(/:/g, "");
  const width = 320;
  const height = 80;

  const path = useMemo(() => {
    const values = data.map((point) => point.value);
    return toPath(values, width, height);
  }, [data]);

  if (!path) {
    return <div className={className} />;
  }

  return (
    <svg className={className} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={color} stopOpacity="0.35" />
          <stop offset="95%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L ${width},${height} L 0,${height} Z`} fill={`url(#${gradientId})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
