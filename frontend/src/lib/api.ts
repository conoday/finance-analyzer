import type { AnalysisResult, SimulateRequest, SimulateResult } from "@/types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

import { createClient } from "@/utils/supabase/client";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");
  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }

  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export const api = {

  /** Analyze user's Supabase transactions */
  analyzeMe: (forecastPeriods = 30): Promise<AnalysisResult> =>
    request<AnalysisResult>(
      `/analyze/me?forecast_periods=${forecastPeriods}&forecast_method=linear_regression`
    ),

  /** Analyze uploaded file */
  analyzeFile: (file: File, forecastPeriods = 30): Promise<AnalysisResult> => {
    const form = new FormData();
    form.append("file", file);
    return request<AnalysisResult>(
      `/analyze?forecast_periods=${forecastPeriods}&forecast_method=linear_regression`,
      { method: "POST", body: form }
    );
  },

  /** Analyze built-in sample data */
  analyzeSample: (forecastPeriods = 30): Promise<AnalysisResult> =>
    request<AnalysisResult>(
      `/analyze/sample?forecast_periods=${forecastPeriods}&forecast_method=linear_regression`
    ),

  /** Run future simulation */
  simulate: (body: SimulateRequest): Promise<SimulateResult> =>
    request<SimulateResult>("/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),

  /** Health check */
  health: (): Promise<{ status: string }> => request("/health"),
};
