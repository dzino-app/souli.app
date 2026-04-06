import { getSoulFiles, getSoulFile, applyDecay, type SoulFile } from "./soul";
import { getIndexContent } from "./soul-compiler";

/**
 * Safety filter: ensure no ciphertext leaks into LLM context.
 * If content starts with "enc:" prefix, it's unreadable ciphertext — return empty.
 */
function sanitizeForLlm(content: string): string {
  if (!content) return "";
  // If the whole content is a single ciphertext blob
  if (content.trim().startsWith("enc:")) return "";
  // Strip any lines that contain ciphertext
  return content
    .split("\n")
    .filter((line) => !line.trim().startsWith("enc:"))
    .join("\n");
}

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
  filozofia: [
    "hodnoty", "values", "verím", "believe", "filozofia", "philosophy",
    "zmysel", "meaning", "purpose", "presvedčenie", "belief",
    "princíp", "principle", "morálka", "moral", "etika", "ethics",
    "spiritualita", "viera", "faith", "múdrosť", "wisdom",
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
      const decayedContent = sanitizeForLlm(applyDecay(f.content));
      return `--- ${f.slug}.md ---\n${decayedContent}`;
    })
    .filter((block) => !block.endsWith("---\n"))
    .join("\n\n");
}

// ---- Cross-reference pattern ----
const CROSS_REF_PATTERN = /\[->\s*([a-z0-9_-]+)\s*\]/g;

/**
 * Parse cross-references from _index.md content.
 * Cross-references use the format [-> slug].
 */
function parseCrossReferences(indexContent: string): string[] {
  const refs: string[] = [];
  let match;
  CROSS_REF_PATTERN.lastIndex = 0;
  while ((match = CROSS_REF_PATTERN.exec(indexContent)) !== null) {
    const slug = match[1];
    if (!refs.includes(slug)) {
      refs.push(slug);
    }
  }
  return refs;
}

/**
 * Extract the "Open Threads" section from _index.md.
 */
export function extractOpenThreads(indexContent: string): string {
  const marker = "## Open Threads";
  const startIdx = indexContent.indexOf(marker);
  if (startIdx === -1) return "";

  const afterMarker = indexContent.slice(startIdx + marker.length);
  // Find the next ## heading or end of content
  const nextHeading = afterMarker.indexOf("\n## ");
  const section = nextHeading === -1
    ? afterMarker.trim()
    : afterMarker.slice(0, nextHeading).trim();

  return section;
}

/**
 * Extract the "Insights" section from _index.md.
 */
export function extractInsights(indexContent: string): string {
  const marker = "## Insights";
  const startIdx = indexContent.indexOf(marker);
  if (startIdx === -1) return "";

  const afterMarker = indexContent.slice(startIdx + marker.length);
  const nextHeading = afterMarker.indexOf("\n## ");
  const section = nextHeading === -1
    ? afterMarker.trim()
    : afterMarker.slice(0, nextHeading).trim();

  return section;
}

/**
 * Index-based context retrieval (Karpathy's LLM-Wiki pattern).
 *
 * Strategy:
 * 1. Always include: _index.md + osobnost + preferencie
 * 2. Parse cross-references from index to find connected files
 * 3. Keyword match against index summaries to pick 2-3 additional files
 * 4. Append "Open Threads" as temporal context
 *
 * Falls back to getDecayedSoulContext() if _index.md doesn't exist.
 */
export function getIndexBasedContext(message: string): string {
  const indexContent = getIndexContent();

  // Fall back to keyword-based retrieval if no index exists
  if (!indexContent) {
    return getDecayedSoulContext(message);
  }

  const safeIndex = sanitizeForLlm(indexContent);
  // If the index itself is ciphertext, fall back to keyword retrieval
  if (!safeIndex) {
    return getDecayedSoulContext(message);
  }

  const parts: string[] = [];
  const includedSlugs = new Set<string>();

  // 1. Include the index itself (compact version)
  parts.push(`--- _index.md ---\n${safeIndex}`);
  includedSlugs.add("_index");

  // 2. Always include osobnost + preferencie
  for (const slug of ALWAYS_INCLUDE) {
    const file = getSoulFile(slug);
    if (file) {
      const safe = sanitizeForLlm(applyDecay(file.content));
      if (safe) {
        parts.push(`--- ${slug}.md ---\n${safe}`);
        includedSlugs.add(slug);
      }
    }
  }

  // 3. Parse cross-references from index — these are pre-computed connections
  const crossRefs = parseCrossReferences(indexContent);

  // 4. Keyword match against index to pick relevant files
  const messageTokens = new Set(tokenize(message));
  const allFiles = getSoulFiles();

  // Score files based on keyword match + cross-reference bonus
  const scored: { slug: string; score: number }[] = [];

  for (const file of allFiles) {
    if (includedSlugs.has(file.slug)) continue;
    if (file.slug === "_index" || file.slug === "_log") continue;

    let score = 0;

    // Keyword match against the file content
    const fileTokens = new Set(tokenize(file.content));
    const messageTokenArray = Array.from(messageTokens);
    for (let ti = 0; ti < messageTokenArray.length; ti++) {
      if (fileTokens.has(messageTokenArray[ti])) score += 1;
    }

    // Bonus for trigger keywords
    const triggers = TRIGGER_MAP[file.slug];
    if (triggers) {
      for (const t of triggers) {
        if (messageTokens.has(t.toLowerCase())) score += 3;
      }
    }

    // Bonus if the file is cross-referenced in the index
    if (crossRefs.includes(file.slug)) {
      score += 2;
    }

    scored.push({ slug: file.slug, score });
  }

  // Take top 2-3 additional files
  scored.sort((a, b) => b.score - a.score);
  const additionalCount = 3;
  const topAdditional = scored.slice(0, additionalCount);

  for (const item of topAdditional) {
    if (item.score > 0) {
      const file = getSoulFile(item.slug);
      if (file) {
        const safe = sanitizeForLlm(applyDecay(file.content));
        if (safe) {
          parts.push(`--- ${item.slug}.md ---\n${safe}`);
          includedSlugs.add(item.slug);
        }
      }
    }
  }

  // 5. Append open threads as temporal context
  const openThreads = extractOpenThreads(indexContent);
  if (openThreads) {
    parts.push(`--- open_threads ---\n${openThreads}`);
  }

  return parts.join("\n\n");
}
