"use client";

import { useState, useCallback } from "react";
import { api } from "@/lib/api";
import type { AnalysisResult, SimulateRequest, SimulateResult } from "@/types";

type Status = "idle" | "loading" | "success" | "error";

export function useAnalysis() {
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (file: File | "sample") => {
    setStatus("loading");
    setError(null);
    try {
      const result =
        file === "sample" ? await api.analyzeSample() : await api.analyzeFile(file);
      setData(result);
      setStatus("success");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setStatus("error");
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setStatus("idle");
    setError(null);
  }, []);

  return { data, status, error, analyze, reset };
}

export function useSimulator(data: AnalysisResult | null) {
  const [result, setResult] = useState<SimulateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const simulate = useCallback(
    async (adjustments: Record<string, number>, horizonMonths: number) => {
      if (!data) return;
      setLoading(true);
      setError(null);
      try {
        const body: SimulateRequest = {
          adjustments,
          horizon_months: horizonMonths,
          summary: data.summary,
          monthly: data.monthly,
          by_category: data.by_category,
        };
        const res = await api.simulate(body);
        setResult(res);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Simulation error");
      } finally {
        setLoading(false);
      }
    },
    [data]
  );

  return { result, loading, error, simulate };
}
