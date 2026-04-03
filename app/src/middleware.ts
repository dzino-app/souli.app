import createIntlMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "@/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API routes: no intl, but still refresh session cookie
  if (pathname.startsWith("/api")) {
    return refreshSession(request, NextResponse.next({ request }));
  }

  // Auth callback: skip intl (not a locale-prefixed route)
  if (pathname.startsWith("/auth")) {
    return NextResponse.next({ request });
  }

  // Run intl middleware first (handles locale detection + redirects)
  const intlResponse = intlMiddleware(request);

  // Now refresh the Supabase session on the intl response so cookies are set
  const response = await refreshSession(request, intlResponse);

  // Determine the resolved pathname (after locale prefix removal)
  // The intl middleware may have added a locale prefix. We check the final URL.
  const resolvedPathname =
    intlResponse.headers.get("x-middleware-rewrite") ??
    intlResponse.headers.get("location") ??
    pathname;

  // Check if this is a public page (no auth required)
  const isPublicPage =
    /\/(prihlasenie|registracia|landing|login|signup)(\/|$)/.test(
      resolvedPathname
    ) || /\/(prihlasenie|registracia|landing|login|signup)(\/|$)/.test(pathname);

  // If the intl middleware issued a redirect, just pass it through with refreshed cookies
  if (intlResponse.status >= 300 && intlResponse.status < 400) {
    return response;
  }

  // Dev mode: skip auth when Supabase is not configured
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    return response;
  }

  // Check auth status
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect unauthenticated users to landing (except public pages)
  if (!user && !isPublicPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/landing";
    const redirectResponse = NextResponse.redirect(url);
    // Copy session cookies to the redirect response
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return redirectResponse;
  }

  // Redirect authenticated users away from auth/landing pages to home
  if (user && isPublicPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    const redirectResponse = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return redirectResponse;
  }

  return response;
}

/**
 * Refresh the Supabase session by reading/writing auth cookies.
 * Works on any NextResponse (intl response, plain response, etc.)
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
