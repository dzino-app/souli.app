"use client";

/**
 * Client-side search over encrypted content.
 *
 * Decrypts items using the in-memory crypto session key, indexes them
 * with Fuse.js for fuzzy matching, and caches the decrypted index so
 * subsequent searches (e.g. on every keystroke) don't re-decrypt.
 */

import Fuse, { type FuseResult } from "fuse.js";
import { decryptIfActive } from "./crypto-session";

/** An item with potentially encrypted fields to be searched. */
export interface SearchableItem {
  id: string;
  /** Possibly encrypted title */
  title: string;
  /** Possibly encrypted content (e.g. concatenated messages) */
  content: string;
}

/** A decrypted item ready for indexing. */
interface DecryptedItem {
  id: string;
  title: string;
  content: string;
}

/** A single search result with match highlights. */
export interface SearchResult {
  id: string;
  title: string;
  /** A short preview snippet around the first match. */
  snippet: string;
  /** The Fuse.js score (0 = perfect match). */
  score: number;
}

const SNIPPET_RADIUS = 60;

/**
 * Extract a short snippet around the first matched range.
 * If there are Fuse.js match indices, use them; otherwise return
 * the start of the text.
 */
function buildSnippet(
  text: string,
  indices: readonly [number, number][] | undefined,
): string {
  if (!text) return "";

  if (!indices || indices.length === 0) {
    return text.slice(0, SNIPPET_RADIUS * 2);
  }

  const [start] = indices[0];
  const snippetStart = Math.max(0, start - SNIPPET_RADIUS);
  const snippetEnd = Math.min(text.length, start + SNIPPET_RADIUS);
  const prefix = snippetStart > 0 ? "..." : "";
  const suffix = snippetEnd < text.length ? "..." : "";
  return prefix + text.slice(snippetStart, snippetEnd) + suffix;
}

export class ClientSearchIndex {
  private fuse: Fuse<DecryptedItem> | null = null;
  private items: DecryptedItem[] = [];
  /** Version counter to detect stale builds. */
  private buildVersion = 0;

  /**
   * Decrypt all items and build the Fuse.js index.
   * Safe to call multiple times — rebuilds the index each time.
   */
  async build(items: SearchableItem[]): Promise<void> {
    this.buildVersion += 1;
    const currentVersion = this.buildVersion;

    const decrypted: DecryptedItem[] = await Promise.all(
      items.map(async (item) => ({
        id: item.id,
        title: await decryptIfActive(item.title),
        content: await decryptIfActive(item.content),
      })),
    );

    // If another build was triggered while we were decrypting, discard.
    if (currentVersion !== this.buildVersion) return;

    this.items = decrypted;
    this.fuse = new Fuse(decrypted, {
      keys: [
        { name: "title", weight: 2 },
        { name: "content", weight: 1 },
      ],
      includeMatches: true,
      includeScore: true,
      threshold: 0.4,
      ignoreLocation: true,
      minMatchCharLength: 2,
    });
  }

  /**
   * Whether the index has been built at least once.
   */
  get isBuilt(): boolean {
    return this.fuse !== null;
  }

  /**
   * Search the decrypted index. Returns empty array if the index
   * hasn't been built yet or the query is empty.
   */
  search(query: string, limit = 20): SearchResult[] {
    if (!this.fuse || !query.trim()) return [];

    const results: FuseResult<DecryptedItem>[] = this.fuse.search(query, {
      limit,
    });

    return results.map((r) => {
      // Find the best content match for the snippet
      const contentMatch = r.matches?.find((m) => m.key === "content");
      const titleMatch = r.matches?.find((m) => m.key === "title");

      const snippet = contentMatch
        ? buildSnippet(
            contentMatch.value ?? "",
            contentMatch.indices as [number, number][] | undefined,
          )
        : titleMatch
          ? buildSnippet(
              titleMatch.value ?? "",
              titleMatch.indices as [number, number][] | undefined,
            )
          : r.item.title;

      return {
        id: r.item.id,
        title: r.item.title,
        snippet,
        score: r.score ?? 1,
      };
    });
  }

  /**
   * Clear the index and free memory.
   */
  clear(): void {
    this.fuse = null;
    this.items = [];
    this.buildVersion = 0;
  }
}
