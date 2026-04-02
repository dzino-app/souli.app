import type { SoulFile } from "./soul";

/**
 * Extract bullet points (lines starting with "- ") from content.
 * Returns both the header/preamble and the bullets separately.
 */
export function extractBullets(content: string): {
  preamble: string;
  bullets: string[];
} {
  const lines = content.split("\n");
  const preambleLines: string[] = [];
  const bullets: string[] = [];
  let seenBullet = false;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trimStart();
    if (trimmed.startsWith("- ")) {
      seenBullet = true;
      bullets.push(trimmed);
    } else if (!seenBullet) {
      preambleLines.push(lines[i]);
    } else {
      // Non-bullet line after bullets (e.g., section headers between bullets)
      // Treat as a separator — keep it as a "bullet" to preserve structure
      bullets.push(lines[i]);
    }
  }

  return {
    preamble: preambleLines.join("\n"),
    bullets,
  };
}

/**
 * Normalize a bullet string for comparison:
 * lowercase, strip punctuation, collapse whitespace.
 */
function normalizeBullet(bullet: string): string {
  return bullet
    .replace(/^-\s*/, "")
    .toLowerCase()
    .replace(/[^a-zA-Z0-9\u00C0-\u024F\u0400-\u04FF\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Check if two bullets are duplicates (same meaning, stated differently).
 * Uses a simple approach: if >70% of words overlap, they're duplicates.
 */
export function areDuplicates(a: string, b: string): boolean {
  const normA = normalizeBullet(a);
  const normB = normalizeBullet(b);

  // Exact match after normalization
  if (normA === normB) return true;

  const wordsAArr = normA.split(" ").filter((w) => w.length > 2);
  const wordsA = new Set(wordsAArr);
  const wordsB = new Set(normB.split(" ").filter((w) => w.length > 2));

  if (wordsA.size === 0 || wordsB.size === 0) return false;

  let overlap = 0;
  for (let i = 0; i < wordsAArr.length; i++) {
    if (wordsB.has(wordsAArr[i])) overlap++;
  }

  const minSize = Math.min(wordsA.size, wordsB.size);
  if (minSize === 0) return false;

  return overlap / minSize >= 0.7;
}

/**
 * Remove duplicate bullets, keeping the later one (newer = lower in file).
 */
function deduplicateBullets(bullets: string[]): string[] {
  const result: string[] = [];
  const actualBullets: Array<{ index: number; text: string }> = [];
  const nonBullets: Array<{ index: number; text: string }> = [];

  // Separate actual bullets from structural lines
  bullets.forEach((b, i) => {
    if (b.trimStart().startsWith("- ")) {
      actualBullets.push({ index: i, text: b });
    } else {
      nonBullets.push({ index: i, text: b });
    }
  });

  // For actual bullets, remove earlier duplicates (keep later = newer)
  const keptIndices: number[] = [];
  const keptIndicesSet = new Set<number>();
  for (let i = actualBullets.length - 1; i >= 0; i--) {
    let isDup = false;
    for (let j = 0; j < keptIndices.length; j++) {
      const keptBullet = actualBullets.find((b) => b.index === keptIndices[j]);
      if (keptBullet && areDuplicates(actualBullets[i].text, keptBullet.text)) {
        isDup = true;
        break;
      }
    }
    if (!isDup) {
      keptIndices.push(actualBullets[i].index);
      keptIndicesSet.add(actualBullets[i].index);
    }
  }

  // Add non-bullet lines' indices
  for (let i = 0; i < nonBullets.length; i++) {
    keptIndicesSet.add(nonBullets[i].index);
  }

  // Reconstruct in original order
  for (let i = 0; i < bullets.length; i++) {
    if (keptIndicesSet.has(i)) {
      result.push(bullets[i]);
    }
  }

  return result;
}

/**
 * Trim to max bullet count, keeping the most recent (last) bullets.
 */
function trimToMax(bullets: string[], max: number): string[] {
  const actualBullets = bullets.filter((b) => b.trimStart().startsWith("- "));
  if (actualBullets.length <= max) return bullets;

  // Preserve order, keeping structural lines and the last `max` actual bullets
  const cutoff = actualBullets.length - max;
  let bulletIdx = 0;
  const result: string[] = [];

  for (let li = 0; li < bullets.length; li++) {
    const line = bullets[li];
    if (line.trimStart().startsWith("- ")) {
      if (bulletIdx >= cutoff) {
        result.push(line);
      }
      bulletIdx++;
    } else {
      result.push(line);
    }
  }

  return result;
}

const MAX_BULLETS = 50;

/**
 * Consolidate a soul file's content:
 * - Remove duplicate bullet points
 * - Keep file under max bullet count (keeping newer entries)
 */
export function consolidateSoulFile(content: string): string {
  const { preamble, bullets } = extractBullets(content);

  if (bullets.length === 0) return content;

  // Step 1: Remove duplicates (keep newer = later in file)
  const deduped = deduplicateBullets(bullets);

  // Step 2: Trim to max size
  const trimmed = trimToMax(deduped, MAX_BULLETS);

  // Reconstruct
  const preambleTrimmed = preamble.replace(/\n+$/, "");
  if (trimmed.length === 0) return preambleTrimmed;
  return preambleTrimmed + "\n" + trimmed.join("\n");
}

const CONSOLIDATION_CHAR_THRESHOLD = 2000;
const CONSOLIDATION_BULLET_THRESHOLD = 30;

/**
 * Returns true if a soul file needs consolidation:
 * - More than 30 bullet points, or
 * - More than 2000 characters
 */
export function needsConsolidation(file: SoulFile): boolean {
  if (file.content.length > CONSOLIDATION_CHAR_THRESHOLD) return true;

  const bulletCount = file.content
    .split("\n")
    .filter((line) => line.trimStart().startsWith("- ")).length;

  return bulletCount > CONSOLIDATION_BULLET_THRESHOLD;
}
