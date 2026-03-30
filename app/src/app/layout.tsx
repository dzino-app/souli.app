import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Dzino — Váš osobný pomocník",
  description: "Nahrajte akýkoľvek dokument a opýtajte sa čoho chcete — po slovensky.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sk">
      <body className={`${geistSans.variable} antialiased`}>
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center justify-between px-4 mx-auto max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-primary">Dzino</span>
            </div>
            <nav className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Nastavenia</span>
            </nav>
          </div>
        </header>
        <main className="container mx-auto max-w-3xl px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
