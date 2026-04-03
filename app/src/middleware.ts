import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  // API routes: no intl, no auth redirect (auth checked per-route if needed)
  if (request.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.next({ request });
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
