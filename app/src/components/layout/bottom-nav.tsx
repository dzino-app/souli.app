"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PRIMARY_NAV_ITEMS,
  SECONDARY_NAV_ITEMS,
  getLocalePrefix,
} from "./nav-items";

export function BottomNav() {
  const pathname = usePathname();
  const localePrefix = getLocalePrefix(pathname);
  const [moreOpen, setMoreOpen] = useState(false);

  const inSecondary = SECONDARY_NAV_ITEMS.some((i) =>
    i.href === "/" ? false : pathname.includes(i.href),
  );

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60 lg:hidden">
        <div className="flex items-center justify-around h-[4.5rem] px-2">
          {PRIMARY_NAV_ITEMS.map(({ href, icon: Icon, label }) => {
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
                  "flex flex-col items-center justify-center gap-1 w-16 py-1.5 rounded-md transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{label}</span>
                {active && <div className="w-1 h-1 rounded-full bg-primary" />}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 w-16 py-1.5 rounded-md transition-colors",
              inSecondary ? "text-primary" : "text-muted-foreground hover:text-foreground",
            )}
            aria-label="Viac"
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="text-[10px] font-medium">Viac</span>
            {inSecondary && <div className="w-1 h-1 rounded-full bg-primary" />}
          </button>
        </div>
      </nav>

      {moreOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          onClick={() => setMoreOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="absolute bottom-0 left-0 right-0 bg-background border-t rounded-t-2xl p-4 pb-8 animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">Viac</h2>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent"
                aria-label="Zavrieť"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <ul className="grid grid-cols-3 gap-2">
              {SECONDARY_NAV_ITEMS.map(({ href, icon: Icon, label }) => {
                const fullHref = `${localePrefix}${href}`;
                const active = pathname.includes(href);
                return (
                  <li key={href}>
                    <Link
                      href={fullHref}
                      onClick={() => setMoreOpen(false)}
                      className={cn(
                        "flex flex-col items-center gap-2 py-4 rounded-lg border transition-colors",
                        active
                          ? "text-primary border-primary/40 bg-primary/5"
                          : "text-foreground border-border hover:bg-accent",
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-xs font-medium">{label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
