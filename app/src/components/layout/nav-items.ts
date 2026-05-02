import { Home, MessageCircle, BookOpen, Calendar, CalendarDays, Heart, Library, Sparkles, Target, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/",         icon: Home,          label: "Domov" },
  { href: "/chat",     icon: MessageCircle, label: "Chat" },
  { href: "/dusa",     icon: BookOpen,      label: "Souli" },
  { href: "/udalosti", icon: Calendar,      label: "Udalosti" },
  { href: "/dennik",    icon: CalendarDays,  label: "Denník" },
  { href: "/wellness",  icon: Heart,         label: "Zdravie" },
  { href: "/programy",  icon: Target,        label: "Cesty" },
  { href: "/zrucnosti", icon: Sparkles,      label: "Zručnosti" },
  { href: "/kniznica",  icon: Library,       label: "Pixoci" },
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
