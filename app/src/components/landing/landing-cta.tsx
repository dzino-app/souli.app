"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Reads ?next from URL and renders the hero sign-in CTA pair, plus the
 *  "you are signing in to continue" hint banner when applicable. */
export function LandingCtaHero() {
  const t = useTranslations("landing");
  const searchParams = useSearchParams();
  const rawNext = searchParams?.get("next") ?? null;
  const next =
    rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : null;
  const signupHref = next
    ? `/registracia?next=${encodeURIComponent(next)}`
    : "/registracia";
  const loginHref = next
    ? `/prihlasenie?next=${encodeURIComponent(next)}`
    : "/prihlasenie";

  return (
    <>
      {next && (
        <div className="mb-6 mx-auto inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-sm text-primary">
          <Lock className="h-3.5 w-3.5" />
          <span>{t("nextHint")}</span>
        </div>
      )}
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
        {t("hero")}
      </h1>
      <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
        {t("heroSub")}
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
        <Link href={signupHref}>
          <Button size="lg" className="text-base px-8 py-6">
            {t("cta")}
          </Button>
        </Link>
        <Link
          href={loginHref}
          className="text-sm text-muted-foreground hover:text-foreground underline"
        >
          {t("alreadyHaveAccount")}
        </Link>
      </div>
      <p className="text-xs text-muted-foreground mt-3">{t("ctaSub")}</p>
    </>
  );
}

/** Bottom-of-page sign-up CTA, also routes-aware via ?next. */
export function LandingCtaBottom() {
  const t = useTranslations("landing");
  const searchParams = useSearchParams();
  const rawNext = searchParams?.get("next") ?? null;
  const next =
    rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : null;
  const signupHref = next
    ? `/registracia?next=${encodeURIComponent(next)}`
    : "/registracia";

  return (
    <Link href={signupHref}>
      <Button size="lg" className="text-base px-8 py-6">
        {t("cta")}
      </Button>
    </Link>
  );
}
