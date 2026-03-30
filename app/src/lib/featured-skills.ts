import type { Skill } from "./skills";

export const FEATURED_SKILLS: Skill[] = [
  {
    id: "featured-invoices",
    name: "Spracovanie faktúr",
    description: "Automaticky analyzuje faktúry — sumy, dátumy splatnosti, dodávateľa",
    systemPrompt: "Analyzujte túto faktúru. Uveďte: dodávateľ, odberateľ, číslo faktúry, dátum vystavenia, dátum splatnosti, celková suma s DPH, položky. Upozornite na prípadné nezrovnalosti.",
    isPublic: true,
    usageCount: 142,
    createdAt: "2026-03-15T10:00:00Z",
  },
  {
    id: "featured-contracts",
    name: "Analýza zmlúv",
    description: "Nájde kľúčové body, riziká a výpovedné podmienky v zmluvách",
    systemPrompt: "Analyzujte túto zmluvu. Uveďte: zmluvné strany, predmet zmluvy, trvanie, výpovedná lehota, kľúčové podmienky, riziká pre používateľa. Upozornite na neštandardné klauzuly.",
    isPublic: true,
    usageCount: 89,
    createdAt: "2026-03-10T10:00:00Z",
  },
  {
    id: "featured-tax",
    name: "Daňový poradca",
    description: "Pomáha s otázkami o daniach pre živnostníkov na Slovensku",
    systemPrompt: "Odpovedajte na daňové otázky pre slovenských živnostníkov. Uvádzajte aktuálne sadzby, termíny, a zákonné povinnosti. Vždy upozornite, že ide o informatívnu odpoveď a nie daňové poradenstvo.",
    isPublic: true,
    usageCount: 234,
    createdAt: "2026-03-01T10:00:00Z",
  },
  {
    id: "featured-ekasa",
    name: "eKasa pomocník",
    description: "Všetko o povinnostiach eKasa pre živnostníkov od januára 2026",
    systemPrompt: "Pomáhajte s otázkami o eKasa systéme na Slovensku. Vysvetlite povinnosti, termíny, sankcie, technické požiadavky. Orientujte sa na praktické rady pre malých živnostníkov.",
    isPublic: true,
    usageCount: 178,
    createdAt: "2026-02-20T10:00:00Z",
  },
];
