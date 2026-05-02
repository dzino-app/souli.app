import Link from "next/link";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { ThemeToggle } from "@/components/theme-toggle";
import { SoundToggle } from "@/components/sound-toggle";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { ErrorBoundary } from "@/components/error-boundary";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { NotificationScheduler } from "@/components/notifications/notification-scheduler";

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
      <div className="lg:flex min-h-screen">
        <Sidebar />
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
      <BottomNav />
      <NotificationScheduler />
    </NextIntlClientProvider>
  );
}
