import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const routing = defineRouting({
  locales: ["sk", "en"],
  defaultLocale: "sk",
  localeDetection: false,
  pathnames: {
    "/": "/",
    "/chat": "/chat",
    "/dusa": { sk: "/dusa", en: "/soul" },
    "/dusa/[slug]": { sk: "/dusa/[slug]", en: "/soul/[slug]" },
    "/udalosti": { sk: "/udalosti", en: "/events" },
    "/udalosti/nova": { sk: "/udalosti/nova", en: "/events/new" },
    "/nastavenia": { sk: "/nastavenia", en: "/settings" },
    "/onboarding": "/onboarding",
    "/prihlasenie": { sk: "/prihlasenie", en: "/login" },
    "/registracia": { sk: "/registracia", en: "/signup" },
    "/landing": "/landing",
  },
});

export type Pathnames = keyof typeof routing.pathnames;

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
