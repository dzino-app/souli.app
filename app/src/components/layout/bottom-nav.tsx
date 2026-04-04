"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageCircle, BookOpen, Calendar, Library } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", icon: Home, label: "Domov" },
  { href: "/chat", icon: MessageCircle, label: "Chat" },
  { href: "/dusa", icon: BookOpen, label: "Souli" },
  { href: "/udalosti", icon: Calendar, label: "Udalosti" },
  { href: "/kniznica", icon: Library, label: "Pixoci" },
] as const;

function getLocalePrefix(pathname: string): string {
  const match = pathname.match(/^\/([a-z]{2})\//);
  return match ? `/${match[1]}` : "";
}

export function BottomNav() {
  const pathname = usePathname();
  const localePrefix = getLocalePrefix(pathname);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60 sm:hidden">
      <div className="flex items-center justify-around h-[4.5rem] px-2">
        {items.map(({ href, icon: Icon, label }) => {
          const fullHref = href === "/" ? `${localePrefix}/` : `${localePrefix}${href}`;
          const active = href === "/" ? pathname === `${localePrefix}/` || pathname === localePrefix : pathname.includes(href);
          return (
            <Link
              key={href}
              href={fullHref}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-16 py-1.5 rounded-md transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{label}</span>
              {active && (
                <div className="w-1 h-1 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
