import createIntlMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "@/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

// Content-Security-Policy directives (Report-Only for now)
const CSP_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data: *.supabase.co",
  "font-src 'self'",
  "connect-src 'self' *.supabase.co *.googleapis.com *.google.com",
  "media-src 'self' blob:",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
].join("; ");

/** Attach CSP Report-Only header to a response */
function applyCSPHeaders(response: NextResponse): NextResponse {
  response.headers.set(
    "Content-Security-Policy-Report-Only",
    CSP_DIRECTIVES
  );
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API routes: no intl, but still refresh session cookie
  if (pathname.startsWith("/api")) {
    return applyCSPHeaders(
      await refreshSession(request, NextResponse.next({ request }))
    );
  }

  // Auth callback: skip intl (not a locale-prefixed route)
  if (pathname.startsWith("/auth")) {
    return applyCSPHeaders(NextResponse.next({ request }));
  }

  // Run intl middleware first (handles locale detection + redirects)
  const intlResponse = intlMiddleware(request);

  // If the intl middleware issued a redirect, refresh session cookies and pass through
  if (intlResponse.status >= 300 && intlResponse.status < 400) {
    return applyCSPHeaders(await refreshSession(request, intlResponse));
  }

  // Dev mode: skip auth when Supabase is not configured
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    return applyCSPHeaders(intlResponse);
  }

  // Create Supabase client that reads/writes cookies on the intl response
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            intlResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Single getUser() call: refreshes session + tells us auth status
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Determine the resolved pathname (intl middleware may rewrite the URL)
  const resolvedPathname =
    intlResponse.headers.get("x-middleware-rewrite") ??
    intlResponse.headers.get("location") ??
    pathname;

  // Check if this is a public page (no auth required)
  const isPublicPage =
    /\/(prihlasenie|registracia|landing|login|signup|kniznica|library|reset-hesla|ochrana-sukromia|podmienky|privacy|terms|quiz)(\/|$)/.test(
      resolvedPathname
    ) ||
    /\/(prihlasenie|registracia|landing|login|signup|kniznica|library|reset-hesla|ochrana-sukromia|podmienky|privacy|terms|quiz)(\/|$)/.test(pathname);

  // Public pages accessible to everyone (no redirect for auth users)
  const isOpenPage =
    /\/(kniznica|library|ochrana-sukromia|podmienky|privacy|terms|quiz)(\/|$)/.test(
      resolvedPathname
    ) ||
    /\/(kniznica|library|ochrana-sukromia|podmienky|privacy|terms|quiz)(\/|$)/.test(pathname);

  // Redirect unauthenticated users to landing (except public pages)
  if (!user && !isPublicPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/landing";
    const redirectResponse = NextResponse.redirect(url);
    // Copy session cookies to the redirect response
    intlResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return applyCSPHeaders(redirectResponse);
  }

  // Redirect authenticated users away from auth/landing pages to home
  // (but not from open pages like quiz, library, legal)
  if (user && isPublicPage && !isOpenPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    const redirectResponse = NextResponse.redirect(url);
    intlResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return applyCSPHeaders(redirectResponse);
  }

  return applyCSPHeaders(intlResponse);
}

/**
 * Refresh the Supabase session by reading/writing auth cookies.
 * Used for API routes and intl redirects where we don't need auth checking.
 */
async function refreshSession(
  request: NextRequest,
  response: NextResponse
): Promise<NextResponse> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // This call refreshes the session and updates cookies
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sprites|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css)$).*)",
  ],
};
