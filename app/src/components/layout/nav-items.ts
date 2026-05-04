import {
  Home,
  MessageCircle,
  BookOpen,
  Calendar,
  CalendarDays,
  Heart,
  Library,
  Sparkles,
  Target,
  Scroll,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
  /** True if the destination requires authentication. Anon users see a lock icon
   *  and clicking routes to /landing?next=<href> instead of the destination. */
  requiresAuth: boolean;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/",          icon: Home,          label: "Domov",     requiresAuth: false },
  { href: "/chat",      icon: MessageCircle, label: "Chat",      requiresAuth: true  },
  { href: "/dusa",      icon: BookOpen,      label: "Souli",     requiresAuth: true  },
  { href: "/udalosti",  icon: Calendar,      label: "Udalosti",  requiresAuth: true  },
  { href: "/dennik",    icon: CalendarDays,  label: "Denník",    requiresAuth: true  },
  { href: "/wellness",  icon: Heart,         label: "Zdravie",   requiresAuth: true  },
  { href: "/programy",  icon: Target,        label: "Cesty",     requiresAuth: true  },
  { href: "/zrucnosti", icon: Sparkles,      label: "Zručnosti", requiresAuth: true  },
  { href: "/kniznica",  icon: Library,       label: "Pixoci",    requiresAuth: false },
  { href: "/pribeh",    icon: Scroll,        label: "Príbeh",    requiresAuth: false },
] as const;

// Mobile bottom nav shows fewer items; the rest live in a "More" sheet.
export const PRIMARY_NAV_HREFS = ["/", "/chat", "/dusa", "/udalosti"] as const;
export const PRIMARY_NAV_ITEMS = NAV_ITEMS.filter((i) =>
  (PRIMARY_NAV_HREFS as readonly string[]).includes(i.href),
);
export const SECONDARY_NAV_ITEMS = NAV_ITEMS.filter(
  (i) => !(PRIMARY_NAV_HREFS as readonly string[]).includes(i.href),
);

export function getLocalePrefix(pathname: string): string {
  const match = pathname.match(/^\/([a-z]{2})\//);
  return match ? `/${match[1]}` : "";
}

/** Returns the actual href to navigate to, accounting for auth gating.
 *  - If item is public OR user is authenticated: returns localized destination.
 *  - If item requires auth and user is anonymous: returns /landing?next=<dest>. */
export function resolveNavHref(
  item: NavItem,
  localePrefix: string,
  isAuthenticated: boolean,
): string {
  const dest = item.href === "/" ? `${localePrefix}/` : `${localePrefix}${item.href}`;
  if (item.requiresAuth && !isAuthenticated) {
    return `${localePrefix}/landing?next=${encodeURIComponent(dest)}`;
  }
  return dest;
}
