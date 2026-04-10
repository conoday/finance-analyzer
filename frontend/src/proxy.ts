import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

// Routes that don't require authentication
const PUBLIC_PATHS = ["/auth/login", "/auth/register", "/auth/verify", "/auth/callback"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always refresh the session
  const response = await updateSession(request);

  // Check if the route is public
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  if (isPublic) return response;

  // Read the refreshed session from the response cookies
  const sessionCookie =
    response.cookies.get("sb-zhvrtlmmtmrthfhoeltc-auth-token") ??
    response.cookies.get("sb-access-token");

  // Also check the original request cookies (already valid session)
  const hasSession =
    sessionCookie != null ||
    request.cookies.getAll().some((c) => c.name.startsWith("sb-") && c.name.includes("auth-token"));

  if (!hasSession) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/auth/login";
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

