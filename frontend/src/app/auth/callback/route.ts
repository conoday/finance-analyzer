import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * /auth/callback — handles both:
 *  - Google OAuth redirect (code exchange)
 *  - Magic link / email confirmation deep link
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // If Supabase returned an error (e.g. email link expired)
  if (error) {
    const params = new URLSearchParams({ error: errorDescription ?? error });
    return NextResponse.redirect(`${origin}/auth/login?${params}`);
  }

  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (!exchangeError) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Fallback — redirect to login with a generic error
  return NextResponse.redirect(`${origin}/auth/login?error=Sesi+tidak+valid,+coba+masuk+kembali`);
}
