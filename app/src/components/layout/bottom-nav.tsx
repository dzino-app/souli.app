"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal, X, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PRIMARY_NAV_ITEMS,
  SECONDARY_NAV_ITEMS,
  getLocalePrefix,
  resolveNavHref,
} from "./nav-items";

interface BottomNavProps {
  isAuthenticated: boolean;
}

export function BottomNav({ isAuthenticated }: BottomNavProps) {
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
          {PRIMARY_NAV_ITEMS.map((item) => {
            const { href, icon: Icon, label, requiresAuth } = item;
            const dest = resolveNavHref(item, localePrefix, isAuthenticated);
            const active =
              href === "/"
                ? pathname === `${localePrefix}/` || pathname === localePrefix
                : pathname.includes(href);
            const locked = requiresAuth && !isAuthenticated;
            return (
              <Link
                key={href}
                href={dest}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 w-16 py-1.5 rounded-md transition-colors relative",
                  active
                    ? "text-primary"
                    : locked
                      ? "text-muted-foreground/60 hover:text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                )}
              >
                <div className="relative">
                  <Icon className="h-5 w-5" />
                  {locked && (
                    <Lock className="absolute -top-1 -right-1 h-2.5 w-2.5 text-muted-foreground/70" />
                  )}
                </div>
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
              {SECONDARY_NAV_ITEMS.map((item) => {
                const { href, icon: Icon, label, requiresAuth } = item;
                const dest = resolveNavHref(item, localePrefix, isAuthenticated);
                const active = pathname.includes(href);
                const locked = requiresAuth && !isAuthenticated;
                return (
                  <li key={href}>
                    <Link
                      href={dest}
                      onClick={() => setMoreOpen(false)}
                      className={cn(
                        "flex flex-col items-center gap-2 py-4 rounded-lg border transition-colors relative",
                        active
                          ? "text-primary border-primary/40 bg-primary/5"
                          : locked
                            ? "text-muted-foreground/70 border-border hover:bg-accent"
                            : "text-foreground border-border hover:bg-accent",
                      )}
                    >
                      <div className="relative">
                        <Icon className="h-5 w-5" />
                        {locked && (
                          <Lock className="absolute -top-1 -right-1 h-2.5 w-2.5 text-muted-foreground/70" />
                        )}
                      </div>
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
