import Link from "next/link";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";

const LOCALE_META: Record<string, { title: string; description: string }> = {
  en: {
    title: "Souli — open-source E2EE AI companion",
    description:
      "Solo-built, end-to-end encrypted AI companion that gamifies personal growth across social, health, career, and personal life. Open-source MVP.",
  },
  sk: {
    title: "Souli — AI parťák, ktorý ťa pozná",
    description:
      "AI parťák, ktorého máš naozaj ty. End-to-end šifrované, open-source MVP, vo voxelovom svete Pixoci.",
  },
  cs: {
    title: "Souli — AI parťák, který tě zná",
    description:
      "AI parťák, kterého opravdu vlastníš. End-to-end šifrované, open-source MVP, ve vokselovém světě Pixoci.",
  },
  de: {
    title: "Souli — ein KI-Begleiter, der dich kennt",
    description:
      "Ein KI-Begleiter, der dich wirklich kennt — und der dir wirklich gehört. Ende-zu-Ende verschlüsselt, Open-Source-MVP, in der Voxel-Märchenwelt Pixoci.",
  },
  es: {
    title: "Souli — un compañero IA que te conoce",
    description:
      "Un compañero IA que te conoce — y que es realmente tuyo. Cifrado de extremo a extremo, MVP de código abierto, en el mundo voxel-fantasy de Pixoci.",
  },
  fr: {
    title: "Souli — un compagnon IA qui te connaît",
    description:
      "Un compagnon IA qui te connaît — et qui t'appartient vraiment. Chiffré de bout en bout, MVP open-source, dans le monde voxel-féerique de Pixoci.",
  },
  hi: {
    title: "Souli — एक AI साथी जो तुम्हें जानता है",
    description:
      "एक AI साथी जो वाकई तुम्हारा है। End-to-end एन्क्रिप्टेड, open-source MVP, voxel-कथा संसार Pixoci में।",
  },
  hu: {
    title: "Souli — egy MI-társ, aki ismer téged",
    description:
      "Egy MI-társ, aki valóban a tiéd. Végpontok között titkosított, nyílt forráskódú MVP a Pixoci voxel-meseviláában.",
  },
  pl: {
    title: "Souli — towarzysz AI, który cię zna",
    description:
      "Towarzysz AI, który naprawdę należy do ciebie. Szyfrowanie end-to-end, MVP open-source, w wokselowo-baśniowym świecie Pixoci.",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const meta = LOCALE_META[locale] ?? LOCALE_META.en;
  return {
    // Suppress root layout's template ("%s — Souli") for the per-locale title
    title: { absolute: meta.title },
    description: meta.description,
    openGraph: {
      title: meta.title,
      description: meta.description,
      // Always show the bare canonical URL in LinkedIn/social cards,
      // regardless of locale-prefixed path the crawler ultimately landed on.
      url: "https://souli.app",
      locale: locale.replace("-", "_"),
      images: ["/og.png"],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
      images: ["/og.png"],
    },
    alternates: {
      canonical: `https://souli.app/${locale}`,
      languages: Object.fromEntries(
        Object.keys(LOCALE_META).map((l) => [l, `https://souli.app/${l}`]),
      ),
    },
  };
}
import { ThemeToggle } from "@/components/theme-toggle";
import { SoundToggle } from "@/components/sound-toggle";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { ErrorBoundary } from "@/components/error-boundary";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { NotificationScheduler } from "@/components/notifications/notification-scheduler";
import { createClient } from "@/lib/supabase/server";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const messages = await getMessages();

  // Auth state for nav components — anon users see lock icons + redirect-with-intent.
  let isAuthenticated = false;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    isAuthenticated = Boolean(data.user);
  } catch {
    // Fail open — anon experience is safe.
  }

  return (
    <NextIntlClientProvider messages={messages}>
      <div className="lg:flex min-h-screen">
        <Sidebar isAuthenticated={isAuthenticated} />
        <div className="flex-1 min-w-0 flex flex-col">
          <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center justify-between gap-4 px-4 mx-auto max-w-5xl">
              <Link
                href={`/${locale}`}
                className="lg:hidden text-xl font-bold text-primary hover:opacity-80 transition-opacity shrink-0"
              >
                Souli
              </Link>
              <div className="hidden lg:block" aria-hidden="true" />
              <div className="flex items-center gap-1 shrink-0">
                <LocaleSwitcher />
                <SoundToggle />
                <ThemeToggle />
              </div>
            </div>
          </header>
          <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:py-8 pb-20 sm:pb-8 flex-1">
            <ErrorBoundary>{children}</ErrorBoundary>
          </main>
        </div>
      </div>
      <BottomNav isAuthenticated={isAuthenticated} />
      <NotificationScheduler />
    </NextIntlClientProvider>
  );
}
