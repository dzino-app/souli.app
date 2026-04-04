import Link from "next/link";
import { MessageCircle, BookOpen, Calendar, Settings } from "lucide-react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { ThemeToggle } from "@/components/theme-toggle";
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

  if (!routing.locales.includes(locale as "sk" | "en")) {
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
              href={`/${locale}/chat`}
              className="hidden sm:inline-flex items-center justify-center rounded-md h-11 w-11 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <MessageCircle className="h-5 w-5" />
            </Link>
            <Link
              href={`/${locale}/dusa`}
              className="hidden sm:inline-flex items-center justify-center rounded-md h-11 w-11 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <BookOpen className="h-5 w-5" />
            </Link>
            <Link
              href={`/${locale}/udalosti`}
              className="hidden sm:inline-flex items-center justify-center rounded-md h-11 w-11 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <Calendar className="h-5 w-5" />
            </Link>
            <LocaleSwitcher />
            <ThemeToggle />
            <Link
              href={`/${locale}/nastavenia`}
              className="hidden sm:inline-flex items-center justify-center rounded-md h-11 w-11 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <Settings className="h-5 w-5" />
            </Link>
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
