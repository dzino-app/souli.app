"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, getLocalePrefix } from "./nav-items";
import { AvatarMini } from "@/components/avatar/avatar-mini";

const COLLAPSE_KEY = "souli_sidebar_collapsed";

export function Sidebar() {
  const pathname = usePathname();
  const localePrefix = getLocalePrefix(pathname);
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(COLLAPSE_KEY);
    if (saved === "1") setCollapsed(true);
    setMounted(true);
  }, []);

  function toggle() {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      return next;
    });
  }

  return (
    <aside
      className={cn(
        "hidden lg:flex sticky top-0 h-screen z-40 flex-col border-r bg-background/95 backdrop-blur transition-[width] duration-200 shrink-0",
        collapsed ? "w-16" : "w-60",
      )}
      aria-label="Primary navigation"
    >
      <Link
        href={`${localePrefix}/`}
        className="flex items-center gap-2 px-4 h-14 border-b text-xl font-bold text-primary hover:opacity-80 transition-opacity shrink-0"
      >
        <span className="text-2xl">✦</span>
        {!collapsed && <span>Souli</span>}
      </Link>

      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const fullHref = href === "/" ? `${localePrefix}/` : `${localePrefix}${href}`;
            const active =
              href === "/"
                ? pathname === `${localePrefix}/` || pathname === localePrefix
                : pathname.includes(href);
            return (
              <li key={href}>
                <Link
                  href={fullHref}
                  title={collapsed ? label : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    collapsed && "justify-center px-2",
                    active
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="truncate">{label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <Link
        href={`${localePrefix}/dusa`}
        title={collapsed ? "Dzino" : undefined}
        className={cn(
          "flex items-center gap-3 mx-2 mb-2 px-2 py-2 rounded-md hover:bg-accent transition-colors",
          collapsed && "justify-center",
        )}
      >
        <div className="shrink-0 scale-75 -my-2">
          {mounted && <AvatarMini state="idle" color="#4F46E5" />}
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">Dzino</p>
            <p className="text-xs text-muted-foreground truncate">tvoj prvý Souli</p>
          </div>
        )}
      </Link>

      <button
        type="button"
        onClick={toggle}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="flex items-center justify-center h-10 border-t text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
}
