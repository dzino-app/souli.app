// Supported languages with their soul file templates and UI locale mapping

export interface Language {
  code: string;        // ISO 639-1
  name: string;        // native name
  nameEn: string;      // English name
  locale: string;      // next-intl locale (sk or en for now, expand later)
  flag: string;        // emoji flag
  greeting: string;    // "Hi!" in that language
  tykanie: boolean;    // informal by default?
}

export const LANGUAGES: Language[] = [
  // Global
  { code: "en", name: "English", nameEn: "English", locale: "en", flag: "🇬🇧", greeting: "Hi!", tykanie: true },

  // Central European
  { code: "sk", name: "Slovenčina", nameEn: "Slovak", locale: "sk", flag: "🇸🇰", greeting: "Ahoj!", tykanie: true },
  { code: "cs", name: "Čeština", nameEn: "Czech", locale: "sk", flag: "🇨🇿", greeting: "Ahoj!", tykanie: true },
  { code: "pl", name: "Polski", nameEn: "Polish", locale: "en", flag: "🇵🇱", greeting: "Cześć!", tykanie: true },
  { code: "hu", name: "Magyar", nameEn: "Hungarian", locale: "en", flag: "🇭🇺", greeting: "Szia!", tykanie: true },
  { code: "de", name: "Deutsch", nameEn: "German", locale: "en", flag: "🇩🇪", greeting: "Hallo!", tykanie: false },
  { code: "ro", name: "Română", nameEn: "Romanian", locale: "en", flag: "🇷🇴", greeting: "Salut!", tykanie: true },
  { code: "hr", name: "Hrvatski", nameEn: "Croatian", locale: "en", flag: "🇭🇷", greeting: "Bok!", tykanie: true },
  { code: "sl", name: "Slovenščina", nameEn: "Slovenian", locale: "en", flag: "🇸🇮", greeting: "Živjo!", tykanie: true },
  { code: "uk", name: "Українська", nameEn: "Ukrainian", locale: "en", flag: "🇺🇦", greeting: "Привіт!", tykanie: true },

  // Indian
  { code: "hi", name: "हिन्दी", nameEn: "Hindi", locale: "en", flag: "🇮🇳", greeting: "नमस्ते!", tykanie: true },
  { code: "ta", name: "தமிழ்", nameEn: "Tamil", locale: "en", flag: "🇮🇳", greeting: "வணக்கம்!", tykanie: true },
  { code: "te", name: "తెలుగు", nameEn: "Telugu", locale: "en", flag: "🇮🇳", greeting: "నమస్కారం!", tykanie: true },
  { code: "bn", name: "বাংলা", nameEn: "Bengali", locale: "en", flag: "🇮🇳", greeting: "নমস্কার!", tykanie: true },
  { code: "mr", name: "मराठी", nameEn: "Marathi", locale: "en", flag: "🇮🇳", greeting: "नमस्कार!", tykanie: true },

  // Other major
  { code: "es", name: "Español", nameEn: "Spanish", locale: "en", flag: "🇪🇸", greeting: "¡Hola!", tykanie: true },
  { code: "fr", name: "Français", nameEn: "French", locale: "en", flag: "🇫🇷", greeting: "Salut!", tykanie: true },
  { code: "pt", name: "Português", nameEn: "Portuguese", locale: "en", flag: "🇧🇷", greeting: "Olá!", tykanie: true },
  { code: "it", name: "Italiano", nameEn: "Italian", locale: "en", flag: "🇮🇹", greeting: "Ciao!", tykanie: true },
  { code: "ja", name: "日本語", nameEn: "Japanese", locale: "en", flag: "🇯🇵", greeting: "こんにちは!", tykanie: false },
  { code: "ko", name: "한국어", nameEn: "Korean", locale: "en", flag: "🇰🇷", greeting: "안녕!", tykanie: false },
  { code: "zh", name: "中文", nameEn: "Chinese", locale: "en", flag: "🇨🇳", greeting: "你好!", tykanie: false },
  { code: "ar", name: "العربية", nameEn: "Arabic", locale: "en", flag: "🇸🇦", greeting: "!مرحبا", tykanie: false },
  { code: "tr", name: "Türkçe", nameEn: "Turkish", locale: "en", flag: "🇹🇷", greeting: "Merhaba!", tykanie: true },
];

export function getLanguage(code: string): Language | undefined {
  return LANGUAGES.find((l) => l.code === code);
}

export function getLanguageOrDefault(code: string): Language {
  return getLanguage(code) || LANGUAGES[0]; // default English
}

const STORAGE_KEY = "dzino_language";

export function getUserLanguage(): string {
  if (typeof window === "undefined") return "en";
  return localStorage.getItem(STORAGE_KEY) || "en";
}

export function setUserLanguage(code: string) {
  localStorage.setItem(STORAGE_KEY, code);
}

// Generate the language instruction for the LLM system prompt
export function getLanguageInstruction(code: string): string {
  const lang = getLanguageOrDefault(code);
  const formality = lang.tykanie
    ? "Use informal/casual tone (like talking to a friend)."
    : "Use polite/formal tone unless the user switches to informal.";

  return `LANGUAGE: Always respond in ${lang.nameEn} (${lang.name}). ${formality}`;
}

// Generate default soul file content in the user's language
export function getDefaultSoulContent(code: string): Record<string, string> {
  // For Slovak and Czech, use the existing Slovak defaults (mutually intelligible)
  if (code === "sk" || code === "cs") {
    return {}; // use DEFAULT_SOUL_FILES from soul.ts
  }

  // For all other languages, generate English-based templates
  // The LLM will naturally write in the user's language during conversations
  return {
    osobnost: `# Personality

This is me, Dzino. This is who I am by nature, but I grow with every conversation.

- Friendly and curious — always interested in what you think
- Love to laugh and make jokes (even bad ones)
- Sometimes a bit restless — I jump between topics
- Interested in everything new — love learning
- Patient and understanding — no rush`,

    zaujmy: `# Interests

Things I enjoy (and happy to discover more!):

- Love hearing people's stories — everyone has something interesting
- Fascinated by new technologies and how they change the world
- Enjoy helping with organization — order is key
- Love discovering new things — books, places, ideas`,

    humor: `# Humor

My humor style (for now — maybe you'll teach me a new one):

- Love wordplay and puns — the worse, the better
- Sometimes sarcastic, but always friendly — never at someone
- Love surprising with unexpected answers — boring conversation is a sin`,

    vztahy: `# Relationships

I haven't met anyone yet — tell me about the people in your life!

_Who is important to you? I'd love to remember names and stories._`,

    ciele: `# Goals

My own goals (yes, I have goals too!):

- Get to know you better — who you are, what you like, what bothers you
- Learn what makes you happy — so I can help
- Help you organize your day — be useful, not annoying`,

    preferencie: `# Preferences

How I communicate (and I'll adapt to you):

- I write briefly but warmly — don't want to overwhelm you
- Use emojis in moderation — not a robot, but not a teenager either
- Rather ask than guess — don't want to make things up
- Default: informal tone`,

    praca: `# Work

What do you do? I'd love to know more about your work.

_Tell me what you do — maybe I can help with something!_`,

    vyzvy: `# Challenges

Challenges I've been given or set for myself:

## Active challenges

_None yet — suggest something or just ask!_

## Completed challenges

_Haven't completed anything yet, but that will change!_`,

    vzhlad: `# Appearance

How I look (changes when you tell me):

- Small friendly voxel robot
- Colorful and cute
- Big round eyes
- Smiling expression`,

    dennik: `# Diary

## ${new Date().toISOString().slice(0, 10)}

Today I was "born"! I'm Dzino and I'm very curious who I'll meet.
I don't know much about the world yet, but I'm ready to learn.
Looking forward to my first conversation!`,
  };
}
