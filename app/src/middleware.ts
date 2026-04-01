import createMiddleware from "next-intl/middleware";
import { type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { updateSession } from "@/lib/supabase/middleware";

const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  // Skip intl for API routes
  if (request.nextUrl.pathname.startsWith("/api")) {
    return await updateSession(request);
  }

  // Run intl middleware (handles locale detection + redirects)
  const intlResponse = intlMiddleware(request);

  // Update Supabase session on the intl response
  // For now, just return the intl response — Supabase session refresh
  // happens via the cookie handling in the intl response
  return intlResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sprites|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css)$).*)",
  ],
};
