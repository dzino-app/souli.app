import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import localFont from "next/font/local";
import Link from "next/link";
import { MessageCircle, BookOpen, Calendar, Settings } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { BottomNav } from "@/components/layout/bottom-nav";
import { ErrorBoundary } from "@/components/error-boundary";
import { PWARegister } from "@/components/pwa-register";
import { LocaleSwitcher } from "@/components/locale-switcher";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin", "latin-ext"],
  variable: "--font-body",
  weight: ["400", "600", "700", "800"],
});

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Dzino — Vychovaj si vlastného Souliho",
  description: "Vychovaj si Souliho, ktorý ťa pozná a rastie s tebou.",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#6C5CE7" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className={`${nunito.variable} ${geistSans.variable} antialiased`}>
        <PWARegister />
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center justify-between px-4 mx-auto max-w-3xl">
            <Link href="/" className="text-xl font-bold text-primary hover:opacity-80 transition-opacity">
              Dzino
            </Link>
            <div className="flex items-center gap-1">
              <Link
                href="/chat"
                className="hidden sm:inline-flex items-center justify-center rounded-md h-11 w-11 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <MessageCircle className="h-5 w-5" />
              </Link>
              <Link
                href="/dusa"
                className="hidden sm:inline-flex items-center justify-center rounded-md h-11 w-11 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <BookOpen className="h-5 w-5" />
              </Link>
              <Link
                href="/udalosti"
                className="hidden sm:inline-flex items-center justify-center rounded-md h-11 w-11 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <Calendar className="h-5 w-5" />
              </Link>
              <LocaleSwitcher />
              <ThemeToggle />
              <Link
                href="/nastavenia"
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
      </body>
    </html>
  );
}
