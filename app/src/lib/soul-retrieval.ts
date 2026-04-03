import { getSoulFiles, applyDecay, type SoulFile } from "./soul";

// Slugs that are always included regardless of relevance score
const ALWAYS_INCLUDE: string[] = ["osobnost", "preferencie"];

// Keywords that trigger specific files
const TRIGGER_MAP: Record<string, string[]> = {
  dennik: [
    "dnes",
    "today",
    "včera",
    "yesterday",
    "ráno",
    "večer",
    "čas",
    "time",
    "deň",
    "day",
    "noc",
    "night",
    "kedy",
    "when",
    "denník",
    "diary",
  ],
  vztahy: [
    "kamarát",
    "priateľ",
    "rodina",
    "mama",
    "otec",
    "brat",
    "sestra",
    "partner",
    "kolega",
    "ľudia",
    "people",
    "kto",
    "who",
    "vzťah",
    "relationship",
    "meno",
    "name",
  ],
};

/**
 * Tokenize text into lowercase words, stripping punctuation.
 */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-zA-Z0-9\u00C0-\u024F\u0400-\u04FF\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

/**
 * Score a soul file against a user message by counting keyword overlaps.
 * Returns a number >= 0 where higher means more relevant.
 */
export function scoreFile(message: string, file: SoulFile): number {
  const messageTokens = new Set(tokenize(message));
  const fileTokens = tokenize(file.content);

  if (messageTokens.size === 0) return 0;

  let score = 0;

  // Count how many unique message words appear in the file content
  const fileTokenSet = new Set(fileTokens);
  const messageTokenArray = Array.from(messageTokens);
  for (let i = 0; i < messageTokenArray.length; i++) {
    if (fileTokenSet.has(messageTokenArray[i])) {
      score += 1;
    }
  }

  // Bonus for trigger keywords matching this file's slug
  const triggers = TRIGGER_MAP[file.slug];
  if (triggers) {
    for (let t = 0; t < triggers.length; t++) {
      if (messageTokens.has(triggers[t].toLowerCase())) {
        score += 3;
      }
    }
  }

  return score;
}

/**
 * Given a user message, return the most relevant soul files.
 * Always includes osobnost.md and preferencie.md.
 * Returns up to maxFiles files sorted by relevance.
 */
export function getRelevantSoulContext(
  message: string,
  maxFiles: number = 5
): SoulFile[] {
  const files = getSoulFiles();

  // Separate always-included from the rest
  const alwaysIncluded: SoulFile[] = [];
  const candidates: SoulFile[] = [];

  for (let i = 0; i < files.length; i++) {
    if (ALWAYS_INCLUDE.includes(files[i].slug)) {
      alwaysIncluded.push(files[i]);
    } else {
      candidates.push(files[i]);
    }
  }

  // Score and sort candidates by relevance
  const scored = candidates
    .map((file) => ({ file, score: scoreFile(message, file) }))
    .sort((a, b) => b.score - a.score);

  // Take top N candidates (reserving slots for always-included)
  const remainingSlots = Math.max(0, maxFiles - alwaysIncluded.length);
  const topCandidates = scored.slice(0, remainingSlots).map((s) => s.file);

  return [...alwaysIncluded, ...topCandidates];
}

/**
 * Given a user message, return the formatted soul context string
 * containing only the most relevant files.
 */
export function getSoulContextForMessage(message: string): string {
  const files = getRelevantSoulContext(message);
  if (files.length === 0) return "";
  return files
    .map((f) => `--- ${f.slug}.md ---\n${f.content}`)
    .join("\n\n");
}

/**
 * Get soul context with memory decay applied.
 * Uses selective retrieval to pick relevant files, then applies decay
 * to files with many entries so the prompt stays focused.
 */
export function getDecayedSoulContext(message: string): string {
  const files = getRelevantSoulContext(message);
  if (files.length === 0) return "";

  return files
    .map((f) => {
      const decayedContent = applyDecay(f.content);
      return `--- ${f.slug}.md ---\n${decayedContent}`;
    })
    .join("\n\n");
}
