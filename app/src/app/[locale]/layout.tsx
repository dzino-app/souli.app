import Link from "next/link";
import { Library } from "lucide-react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { ThemeToggle } from "@/components/theme-toggle";
import { SoundToggle } from "@/components/sound-toggle";
import { BottomNav } from "@/components/layout/bottom-nav";
import { ErrorBoundary } from "@/components/error-boundary";
import { LocaleSwitcher } from "@/components/locale-switcher";

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

  return (
    <NextIntlClientProvider messages={messages}>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4 mx-auto max-w-3xl">
          <Link href={`/${locale}`} className="text-xl font-bold text-primary hover:opacity-80 transition-opacity">
            Dzino
          </Link>
          <div className="flex items-center gap-1">
            <Link
              href={`/${locale}/kniznica`}
              className="hidden sm:inline-flex items-center justify-center rounded-md h-11 w-11 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              title="Pixoci"
            >
              <Library className="h-5 w-5" />
            </Link>
            <LocaleSwitcher />
            <SoundToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6 sm:py-8 pb-20 sm:pb-8">
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
      <BottomNav />
    </NextIntlClientProvider>
  );
}
