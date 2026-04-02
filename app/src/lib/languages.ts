// Language system — principle-based, not hardcoded dictionaries
// Only hardcodes: informal-by-default exceptions + locale mapping

// Languages where informal tone is default (buddy vibe)
const INFORMAL_LANGUAGES = new Set(["sk", "cs", "en"]);

// Map detected language to next-intl UI locale (we only have sk + en UI)
const LOCALE_MAP: Record<string, string> = {
  sk: "sk",
  cs: "sk", // Czech users get Slovak UI (mutually intelligible)
  // Everything else defaults to "en"
};

const STORAGE_KEY = "dzino_language";

// ---- Public API ----

// Language is stored in both localStorage (fast access) and preferencie.md soul file (visible to user)
export function getUserLanguage(): string {
  if (typeof window === "undefined") return "en";
  return localStorage.getItem(STORAGE_KEY) || "";
}

export function setUserLanguage(code: string) {
  localStorage.setItem(STORAGE_KEY, code);

  // Also update preferencie.md soul file so it's visible and editable
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const soul = require("./soul") as typeof import("./soul");
    const file = soul.getSoulFile("preferencie");
    if (file && !file.content.includes(`Jazyk: ${code}`)) {
      // Remove old language line if exists
      const cleaned = file.content.replace(/- Jazyk:.*\n?/g, "");
      const updated = cleaned.trimEnd() + `\n- Jazyk: ${code}`;
      soul.updateSoulFileInCache("preferencie", updated, "dzino");
    }
  } catch {
    // Soul not available yet
  }
}

export function getLocaleForLanguage(langCode: string): string {
  return LOCALE_MAP[langCode] || "en";
}

export function isInformalByDefault(langCode: string): boolean {
  return INFORMAL_LANGUAGES.has(langCode);
}

// Generate the LLM language instruction
export function getLanguageInstruction(langCode: string): string {
  const informal = isInformalByDefault(langCode);

  const formality = informal
    ? "Use informal/casual tone (like talking to a close friend). You are a buddy."
    : "Start with polite/formal tone — respect cultural norms. If the user switches to informal (e.g. uses 'du' in German, 'tú' in Spanish, 'ты' in Russian), follow their lead and switch. Update preferencie.md when formality changes.";

  return `LANGUAGE: Always respond in the language the user is writing in (detected: ${langCode}). ${formality}
If the user switches language mid-conversation, follow their lead.
Soul files may be in a different language — use them as context but respond in the user's current language.`;
}

// ---- Language Detection ----
// Principle-based: detect from script (non-Latin) or word frequency + diacritics (Latin)

export function detectLanguage(text: string): string | null {
  const lower = text.toLowerCase().trim();
  if (!lower || lower.length < 3) return null;

  // Non-Latin scripts — unambiguous, instant detection
  if (/[\u0900-\u097F]/.test(text)) return "hi"; // Devanagari
  if (/[\u0B80-\u0BFF]/.test(text)) return "ta"; // Tamil
  if (/[\u0C00-\u0C7F]/.test(text)) return "te"; // Telugu
  if (/[\u0980-\u09FF]/.test(text)) return "bn"; // Bengali
  if (/[\u0400-\u04FF]/.test(text)) return "uk"; // Cyrillic → default Ukrainian
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return "ja"; // Japanese
  if (/[\uAC00-\uD7AF]/.test(text)) return "ko"; // Korean
  if (/[\u4E00-\u9FFF]/.test(text)) return "zh"; // Chinese
  if (/[\u0600-\u06FF]/.test(text)) return "ar"; // Arabic

  // Latin scripts — use diacritics as strong signals first
  if (/[ľščťžýáíéúôäňď]/.test(lower)) return "sk";
  if (/[ěščřžýáíéúůňď]/.test(lower) && !lower.includes("ô")) return "cs";
  if (/[ąćęłńóśźż]/.test(lower)) return "pl";
  if (/[áéíóöőúüű]/.test(lower) && /\b(egy|van|nem|igen)\b/.test(lower)) return "hu";
  if (/[äöüß]/.test(lower)) return "de";
  if (/[ăâîșț]/.test(lower)) return "ro";
  if (/[çğıöşü]/.test(lower)) return "tr";

  // Word frequency for languages without unique diacritics
  const words = lower.split(/\s+/);
  const wordSet = new Set(words);

  const signals: Record<string, string[]> = {
    sk: ["som", "nie", "áno", "ahoj", "prosím", "ďakujem", "ako", "čo", "kde", "prečo", "veľmi", "dobre", "máš", "mám", "chcem"],
    cs: ["jsem", "není", "ano", "prosím", "děkuji", "proč", "velmi", "dobře", "teď", "tady", "třeba"],
    es: ["soy", "hola", "por", "favor", "gracias", "muy", "bien", "estoy", "quiero", "tengo", "pero"],
    fr: ["suis", "oui", "salut", "merci", "très", "bien", "mais", "aussi", "je", "nous", "vous"],
    pt: ["sou", "não", "sim", "olá", "obrigado", "muito", "bem", "mas", "também", "estou"],
    it: ["sono", "non", "ciao", "grazie", "molto", "bene", "anche", "voglio", "che", "questo"],
    hr: ["sam", "ne", "da", "molim", "hvala", "vrlo", "dobro", "sada", "ali"],
    sl: ["sem", "ne", "ja", "prosim", "hvala", "zelo", "dobro", "zdaj"],
    de: ["ich", "bin", "nicht", "hallo", "bitte", "danke", "warum", "sehr", "gut", "jetzt", "aber"],
    pl: ["jestem", "tak", "nie", "cześć", "proszę", "dziękuję", "bardzo", "dobrze", "teraz"],
    hu: ["vagyok", "igen", "nem", "szia", "kérem", "köszönöm", "nagyon", "most", "hogy"],
    tr: ["ben", "hayır", "evet", "merhaba", "çok", "iyi", "şimdi", "ama", "bir", "bu"],
  };

  let bestLang = "en";
  let bestScore = 0;

  for (const lang of Object.keys(signals)) {
    let score = 0;
    const keywords = signals[lang];
    for (let i = 0; i < keywords.length; i++) {
      if (wordSet.has(keywords[i])) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestLang = lang;
    }
  }

  return bestScore >= 2 ? bestLang : null;
}
