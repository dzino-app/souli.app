import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import localFont from "next/font/local";
import { PWARegister } from "@/components/pwa-register";
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

const SITE_URL = "https://souli.app";
const OG_IMAGE = `${SITE_URL}/og.png`;
const TAGLINE =
  "Solo-built, end-to-end encrypted AI companion that gamifies personal growth across social, health, career, and personal life. Open-source MVP.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Souli — open-source E2EE AI companion",
    template: "%s — Souli",
  },
  description: TAGLINE,
  keywords: [
    "AI companion",
    "personal AI",
    "end-to-end encrypted",
    "open source",
    "Pixoci",
    "Souli",
    "Dzino",
    "voxel",
    "pixel art",
  ],
  authors: [{ name: "Maroš Janco" }],
  creator: "Maroš Janco",
  publisher: "Maroš Janco",
  openGraph: {
    type: "website",
    siteName: "Souli",
    title: "Souli — open-source E2EE AI companion",
    description: TAGLINE,
    url: SITE_URL,
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Souli — open-source, end-to-end encrypted AI companion that gamifies personal growth",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Souli — open-source E2EE AI companion",
    description: TAGLINE,
    images: [OG_IMAGE],
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#4F46E5",
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
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="icon" type="image/svg+xml" href="/icons/icon.svg" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32.png" />
      </head>
      <body className={`${nunito.variable} ${geistSans.variable} antialiased`}>
        <PWARegister />
        {children}
      </body>
    </html>
  );
}
