import type { Metadata } from "next";
import localFont from "next/font/local";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import Link from "next/link";
import { Brain, Clock, PenLine, Settings } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Dzino — Váš osobný pomocník",
  description:
    "Nahrajte akýkoľvek dokument a opýtajte sa čoho chcete — po slovensky.",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${geistSans.variable} antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center justify-between px-4 mx-auto max-w-3xl">
              <Link href="/" className="text-xl font-bold text-primary hover:opacity-80 transition-opacity">
                Dzino
              </Link>
              <div className="flex items-center gap-1">
                <Link
                  href="/napisat"
                  className="inline-flex items-center justify-center rounded-md h-11 w-11 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <PenLine className="h-5 w-5" />
                </Link>
                <Link
                  href="/historia"
                  className="inline-flex items-center justify-center rounded-md h-11 w-11 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <Clock className="h-5 w-5" />
                </Link>
                <Link
                  href="/pamat"
                  className="inline-flex items-center justify-center rounded-md h-11 w-11 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <Brain className="h-5 w-5" />
                </Link>
                <ThemeToggle />
                <Link
                  href="/nastavenia"
                  className="inline-flex items-center justify-center rounded-md h-11 w-11 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <Settings className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </header>
          <main className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
            {children}
          </main>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
