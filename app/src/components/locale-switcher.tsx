"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";

const LOCALES = [
  { code: "sk", label: "🇸🇰 SK" },
  { code: "en", label: "🇬🇧 EN" },
];

export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  function handleSwitch(newLocale: string) {
    if (newLocale === locale) return;
    // Replace current locale prefix in pathname
    const segments = pathname.split("/");
    if (segments[1] === "sk" || segments[1] === "en") {
      segments[1] = newLocale;
    }
    router.push(segments.join("/"));
  }

  return (
    <div className="flex items-center gap-1 bg-secondary/50 rounded-full p-0.5">
      {LOCALES.map((l) => (
        <button
          key={l.code}
          onClick={() => handleSwitch(l.code)}
          className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
            locale === l.code
              ? "bg-card shadow-sm font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
