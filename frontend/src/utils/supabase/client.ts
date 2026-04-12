import { createBrowserClient } from "@supabase/ssr";

// Placeholders prevent @supabase/ssr from throwing during Next.js build.
// Real values must be set as env vars in Vercel/local .env.local.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "placeholder";

export const createClient = () =>
  createBrowserClient(supabaseUrl, supabaseKey);
