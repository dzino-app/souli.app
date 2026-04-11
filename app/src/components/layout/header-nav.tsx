"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, getLocalePrefix } from "./nav-items";

export function HeaderNav() {
  const pathname = usePathname();
  const localePrefix = getLocalePrefix(pathname);

  return (
    <nav className="hidden sm:flex items-center gap-1">
      {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
        const fullHref = href === "/" ? `${localePrefix}/` : `${localePrefix}${href}`;
        const active =
          href === "/"
            ? pathname === `${localePrefix}/` || pathname === localePrefix
            : pathname.includes(href);
        return (
          <Link
            key={href}
            href={fullHref}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors",
              active
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground hover:bg-accent",
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
