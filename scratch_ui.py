import re

with open('frontend/src/lib/api.ts', 'r', encoding='utf-8') as f:
    text = f.read()

# Add supabase client to api.ts to grab the access_token
inject = """
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
"""

text = re.sub(
    r'async function request<T>\(path: string, init\?: RequestInit\): Promise<T> \{.*?\n[ \t]*\}\);',
    inject.strip() + '\n',
    text,
    flags=re.DOTALL
)

# Also add analyzeMe:
api_methods = """
  /** Analyze user's Supabase transactions */
  analyzeMe: (forecastPeriods = 30): Promise<AnalysisResult> =>
    request<AnalysisResult>(
      `/analyze/me?forecast_periods=${forecastPeriods}&forecast_method=linear_regression`
    ),
"""
text = re.sub(
    r'(export const api = \{)',
    r'\1\n' + api_methods,
    text
)

with open('frontend/src/lib/api.ts', 'w', encoding='utf-8') as f:
    f.write(text)

print('Patched api.ts')
