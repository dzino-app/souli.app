import { Home, MessageCircle, BookOpen, Calendar, Library, Sparkles, type LucideIcon } from "lucide-react";

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
  { href: "/zrucnosti", icon: Sparkles,      label: "Zručnosti" },
  { href: "/kniznica",  icon: Library,       label: "Pixoci" },
] as const;

export function getLocalePrefix(pathname: string): string {
  const match = pathname.match(/^\/([a-z]{2})\//);
  return match ? `/${match[1]}` : "";
}
