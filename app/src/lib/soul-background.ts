import { appendToSoulFile, getSoulFile } from "./soul";

// ---- Heuristic keyword sets ----

const RELATIONSHIP_PATTERNS =
  /\b(mama|otec|brat|sestra|babka|dedko|priateľ|priateľka|manžel|manželka|kolega|kamarát|kamarátka|partner|partnerka|syn|dcéra|rodina|šéf|učiteľ|sused)\b/i;

const WORK_PATTERNS =
  /\b(prác[aueiy]|projekt|firma|meeting|kancelári[aiu]|deadline|koleg[aou]|job|úloha|task|sprint|deploy|klient|zákazník|pohovor)\b/i;

const HOBBY_PATTERNS =
  /\b(šport|futbal|hokej|beh|behanie|plávanie|cvičen|gitara|piano|kreslenie|maľovanie|čítanie|kniha|film|seriál|hra|gaming|varenie|záhrada|fotenie|cestovanie|jóga|fitness|bicykl|turistik|rybolov)\b/i;

const EMOTIONAL_PATTERNS =
  /\b(šťastn|smutný|smutná|bojím|strach|radosť|frustráci|nahnevan|miluj|ľúbi|nenávidím|stres|úzkosť|nervózn|samot|osamel|nadšen|sklamaný|sklaman|ťažk[éý]|trápim|trápenie|depres|plač|plakal)\b/i;

// Capitalized words that look like person names (2+ letters, capitalized, not start of sentence)
const NAME_PATTERN = /(?:^|\.\s+|,\s+|\s+)(s|od|pre|na|o)\s+([A-ZÁČĎÉÍĽŇÓŠŤÚÝŽ][a-záčďéíľňóšťúýž]{2,})/g;

// ---- Background processor ----

/**
 * Non-blocking background memory processor.
 * Called after the chat response is shown to the user.
 * Uses simple heuristic rules (no LLM call) to detect "obvious" updates
 * that the LLM's :::aktualizacia blocks might have missed.
 */
export function processConversationInBackground(
  userMessage: string,
  assistantResponse: string
): void {
  // Fire and forget — never block the UI
  setTimeout(() => {
    try {
      processHeuristics(userMessage, assistantResponse);
    } catch {
      // Background processing should never throw to the UI
    }
  }, 500);
}

function processHeuristics(userMessage: string, assistantResponse: string): void {
  const combined = `${userMessage} ${assistantResponse}`;
  const today = new Date().toISOString().slice(0, 10);

  // 1. Relationship mentions → vztahy.md
  if (RELATIONSHIP_PATTERNS.test(userMessage)) {
    const names = extractNames(userMessage);
    if (names.length > 0) {
      const vztahy = getSoulFile("vztahy");
      if (vztahy) {
        // Only add names not already mentioned
        const existing = vztahy.content.toLowerCase();
        const newNames = names.filter((n) => !existing.includes(n.toLowerCase()));
        if (newNames.length > 0) {
          const entry = `\n- ${today}: Spomínal/a: ${newNames.join(", ")}`;
          appendToSoulFile("vztahy", entry, "dzino");
        }
      }
    }
  }

  // 2. Work/project mentions → praca.md
  if (WORK_PATTERNS.test(userMessage)) {
    const praca = getSoulFile("praca");
    if (praca) {
      // Avoid duplicate entries for same day
      if (!praca.content.includes(today)) {
        const snippet = userMessage.length > 100 ? userMessage.slice(0, 100) + "..." : userMessage;
        const entry = `\n- ${today}: ${snippet}`;
        appendToSoulFile("praca", entry, "dzino");
      }
    }
  }

  // 3. Hobby/sport/activity mentions → zaujmy.md
  if (HOBBY_PATTERNS.test(userMessage)) {
    const zaujmy = getSoulFile("zaujmy");
    if (zaujmy) {
      const matches = userMessage.match(HOBBY_PATTERNS);
      if (matches) {
        const existing = zaujmy.content.toLowerCase();
        const newHobbies = matches.filter(
          (m) => !existing.includes(m.toLowerCase())
        );
        if (newHobbies.length > 0) {
          const entry = `\n- ${newHobbies.join(", ")} (${today})`;
          appendToSoulFile("zaujmy", entry, "dzino");
        }
      }
    }
  }

  // 4. Emotional content → dennik.md
  if (EMOTIONAL_PATTERNS.test(combined)) {
    const dennik = getSoulFile("dennik");
    if (dennik) {
      // Add a diary entry for the emotional moment
      const emotionMatch = combined.match(EMOTIONAL_PATTERNS);
      const emotion = emotionMatch ? emotionMatch[0] : "";
      const snippet =
        userMessage.length > 80 ? userMessage.slice(0, 80) + "..." : userMessage;
      const entry = `\n\n## ${today}\n\nEmočný moment (${emotion}): "${snippet}"`;

      // Avoid duplicate date header if today's entry already exists
      if (dennik.content.includes(`## ${today}`)) {
        const shortEntry = `\n- Emočný moment (${emotion}): "${snippet}"`;
        appendToSoulFile("dennik", shortEntry, "dzino");
      } else {
        appendToSoulFile("dennik", entry, "dzino");
      }
    }
  }
}

/**
 * Extract potential person names from text.
 * Looks for capitalized words following Slovak prepositions or relationship terms.
 */
function extractNames(text: string): string[] {
  const names: string[] = [];
  let match;

  // Reset regex state
  NAME_PATTERN.lastIndex = 0;
  while ((match = NAME_PATTERN.exec(text)) !== null) {
    const name = match[2];
    // Filter out common Slovak words that happen to be capitalized
    const commonWords = [
      "Slovensko", "Bratislava", "Košice", "Praha", "Európa",
      "Pondelok", "Utorok", "Streda", "Štvrtok", "Piatok", "Sobota", "Nedeľa",
      "Január", "Február", "Marec", "Apríl", "Máj", "Jún", "Júl",
      "August", "September", "Október", "November", "December",
    ];
    if (!commonWords.includes(name) && !names.includes(name)) {
      names.push(name);
    }
  }

  return names;
}
