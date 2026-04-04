"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

const LOCALES = [
  { code: "sk", label: "SK", flag: "🇸🇰" },
  { code: "en", label: "EN", flag: "🇬🇧" },
  { code: "cs", label: "CS", flag: "🇨🇿" },
  { code: "de", label: "DE", flag: "🇩🇪" },
  { code: "es", label: "ES", flag: "🇪🇸" },
  { code: "fr", label: "FR", flag: "🇫🇷" },
  { code: "hi", label: "HI", flag: "🇮🇳" },
  { code: "hu", label: "HU", flag: "🇭🇺" },
  { code: "pl", label: "PL", flag: "🇵🇱" },
];

export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const current = LOCALES.find((l) => l.code === locale) || LOCALES[1];

  function handleSwitch(newLocale: string) {
    if (newLocale === locale) { setOpen(false); return; }
    const segments = pathname.split("/");
    if (segments[1] && LOCALES.some((l) => l.code === segments[1])) {
      segments[1] = newLocale;
    }
    router.push(segments.join("/"));
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full bg-secondary/50 hover:bg-secondary transition-colors"
      >
        <span>{current.flag}</span>
        <span className="font-medium">{current.label}</span>
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-card border rounded-lg shadow-lg py-1 min-w-[120px]">
            {LOCALES.map((l) => (
              <button
                key={l.code}
                onClick={() => handleSwitch(l.code)}
                className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 hover:bg-secondary transition-colors ${
                  locale === l.code ? "font-semibold text-primary" : "text-foreground"
                }`}
              >
                <span>{l.flag}</span>
                <span>{l.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
