import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  const type = searchParams.get("type");
  const locale = searchParams.get("locale") || "";
  const localePrefix = locale ? `/${locale}` : "";

  if (code) {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Password recovery → reset page
      if (type === "recovery") {
        return NextResponse.redirect(`${origin}${localePrefix}/reset-hesla`);
      }

      // New user (just confirmed email) → onboarding
      // Check if user was created recently (within last 5 minutes = likely just signed up)
      const user = data?.user;
      if (user) {
        const createdAt = new Date(user.created_at).getTime();
        const confirmedAt = new Date(user.email_confirmed_at || Date.now()).getTime();
        const isNewUser = confirmedAt - createdAt < 5 * 60 * 1000; // confirmed within 5 min of creation
        if (isNewUser) {
          return NextResponse.redirect(`${origin}${localePrefix}/onboarding`);
        }
      }

      return NextResponse.redirect(`${origin}${localePrefix}${next === "/" ? "" : next}`);
    }
  }

  return NextResponse.redirect(`${origin}${localePrefix}/prihlasenie`);
}
