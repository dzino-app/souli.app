// Language system — minimal, principle-based
// Language preference lives in preferencie.md soul file
// Detection is only for bootstrap (first message before soul exists)

// Languages where informal tone is default
const INFORMAL_LANGUAGES = new Set(["sk", "cs", "en"]);

// Map to next-intl UI locale (we only have sk + en UI translations)
const LOCALE_MAP: Record<string, string> = {
  sk: "sk",
  cs: "sk",
};

export function getLocaleForLanguage(langCode: string): string {
  return LOCALE_MAP[langCode] || "en";
}

export function isInformalByDefault(langCode: string): boolean {
  return INFORMAL_LANGUAGES.has(langCode);
}

// Read language from soul file (preferencie.md)
export function getUserLanguage(): string {
  if (typeof window === "undefined") return "";
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const soul = require("./soul") as typeof import("./soul");
    const file = soul.getSoulFile("preferencie");
    if (file) {
      const match = file.content.match(/- Jazyk:\s*(\w+)/);
      if (match) return match[1];
    }
  } catch {
    // Soul not loaded yet
  }
  return "";
}

// Write language to soul file
export function setUserLanguage(code: string) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const soul = require("./soul") as typeof import("./soul");
    const file = soul.getSoulFile("preferencie");
    if (file) {
      const cleaned = file.content.replace(/- Jazyk:.*\n?/g, "");
      const updated = cleaned.trimEnd() + `\n- Jazyk: ${code}`;
      soul.updateSoulFileInCache("preferencie", updated, "dzino");
    }
  } catch {
    // Soul not available
  }
}

// LLM instruction — only needed for first message or when language changes
export function getLanguageInstruction(langCode: string): string {
  if (!langCode) return "";

  const informal = isInformalByDefault(langCode);
  const formality = informal
    ? "Use informal/casual tone (buddy)."
    : "Start formal. Switch to informal if user does. Update preferencie.md.";

  return `LANGUAGE: Respond in language "${langCode}". ${formality}`;
}

// ---- Bootstrap Detection (only for first message) ----

export function detectLanguage(text: string): string | null {
  const lower = text.toLowerCase().trim();
  if (!lower || lower.length < 3) return null;

  // Non-Latin scripts
  if (/[\u0900-\u097F]/.test(text)) return "hi";
  if (/[\u0B80-\u0BFF]/.test(text)) return "ta";
  if (/[\u0C00-\u0C7F]/.test(text)) return "te";
  if (/[\u0980-\u09FF]/.test(text)) return "bn";
  if (/[\u0400-\u04FF]/.test(text)) return "uk";
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return "ja";
  if (/[\uAC00-\uD7AF]/.test(text)) return "ko";
  if (/[\u4E00-\u9FFF]/.test(text)) return "zh";
  if (/[\u0600-\u06FF]/.test(text)) return "ar";

  // Diacritics
  if (/[ľščťžýáíéúôäňď]/.test(lower)) return "sk";
  if (/[ěščřžýáíéúůňď]/.test(lower) && !lower.includes("ô")) return "cs";
  if (/[ąćęłńóśźż]/.test(lower)) return "pl";
  if (/[äöüß]/.test(lower)) return "de";
  if (/[ăâîșț]/.test(lower)) return "ro";
  if (/[çğıöşü]/.test(lower)) return "tr";

  // Common words
  const words = new Set(lower.split(/\s+/));
  const signals: Record<string, string[]> = {
    sk: ["som", "nie", "ahoj", "ako", "čo", "kde", "mám", "chcem"],
    cs: ["jsem", "není", "ano", "proč", "dobře", "teď"],
    es: ["soy", "hola", "gracias", "bien", "pero", "tengo"],
    fr: ["suis", "oui", "merci", "bien", "mais", "je"],
    pt: ["sou", "não", "obrigado", "bem", "mas"],
    it: ["sono", "non", "ciao", "grazie", "bene"],
    de: ["ich", "bin", "nicht", "danke", "gut", "aber"],
    pl: ["jestem", "tak", "cześć", "bardzo", "dobrze"],
    hu: ["vagyok", "igen", "nem", "nagyon", "hogy"],
    tr: ["ben", "evet", "merhaba", "çok", "iyi"],
  };

  let best = "en";
  let bestScore = 0;
  for (const lang of Object.keys(signals)) {
    let score = 0;
    for (let i = 0; i < signals[lang].length; i++) {
      if (words.has(signals[lang][i])) score++;
    }
    if (score > bestScore) { bestScore = score; best = lang; }
  }

  return bestScore >= 2 ? best : null;
}
