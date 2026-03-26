import type { AnalysisResult, SimulateRequest, SimulateResult } from "@/types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Accept: "application/json" },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
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
