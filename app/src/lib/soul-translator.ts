// Translates default soul files to the user's language via LLM
// Runs ONCE when a new language is detected for the first time

import { getSoulFiles, updateSoulFileInCache } from "./soul";
import { getLanguageOrDefault } from "./languages";

const TRANSLATED_KEY_PREFIX = "dzino_soul_translated_";

function getTranslatedKey(langCode: string): string {
  return TRANSLATED_KEY_PREFIX + langCode;
}

export function isAlreadyTranslated(langCode: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(getTranslatedKey(langCode)) === "true";
}

function markTranslated(langCode: string) {
  localStorage.setItem(getTranslatedKey(langCode), "true");
}

// Translate all soul files to a new language via the chat API
export async function translateSoulFiles(langCode: string): Promise<void> {
  // Skip for Slovak/Czech (already in Slovak) and English (templates exist)
  if (langCode === "sk" || langCode === "cs" || langCode === "en") {
    markTranslated(langCode);
    return;
  }

  // Skip if already translated
  if (isAlreadyTranslated(langCode)) return;

  const lang = getLanguageOrDefault(langCode);
  const files = getSoulFiles();

  // Build translation prompt
  const filesToTranslate = files.map((f) => ({
    slug: f.slug,
    displayName: f.displayName,
    content: f.content,
  }));

  const prompt = `Translate these soul files to ${lang.nameEn} (${lang.name}).
Keep the markdown structure (headers, bullet points).
Keep names like "Dzino" unchanged.
Translate naturally, not word-by-word.
Use ${lang.tykanie ? "informal/casual" : "formal/polite"} tone.

Return ONLY a JSON object where keys are slugs and values are translated content strings.

Files to translate:
${JSON.stringify(filesToTranslate, null, 2)}`;

  try {
    const response = await fetch("/api/translate-soul", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, langCode }),
    });

    if (!response.ok) {
      markTranslated(langCode); // don't retry on failure
      return;
    }

    const data = await response.json();
    const translations = data.translations as Record<string, string>;

    if (!translations) {
      markTranslated(langCode);
      return;
    }

    // Apply translations to session cache
    for (const [slug, content] of Object.entries(translations)) {
      if (content && typeof content === "string") {
        updateSoulFileInCache(slug, content, "dzino");
      }
    }

    // Also translate displayName in cache
    const updatedFiles = getSoulFiles();
    if (data.displayNames) {
      const names = data.displayNames as Record<string, string>;
      for (const file of updatedFiles) {
        if (names[file.slug]) {
          file.displayName = names[file.slug];
        }
      }
      localStorage.setItem("dzino_soul_cache", JSON.stringify(updatedFiles));
    }

    markTranslated(langCode);
  } catch {
    markTranslated(langCode); // don't retry
  }
}
