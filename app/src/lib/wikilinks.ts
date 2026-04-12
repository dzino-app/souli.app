/**
 * Wikilink parser and backlink indexer for soul files.
 *
 * Supports [[slug]] and [[slug|display text]] syntax in markdown.
 * Builds a bidirectional link index from all soul files.
 */

import { getSoulFilesByCategory, type SoulFile } from "./soul";

export interface WikiLink {
  slug: string;
  display: string;
  start: number;
  end: number;
}

/**
 * Extract all [[wikilinks]] from markdown content.
 */
export function extractWikilinks(content: string): WikiLink[] {
  const links: WikiLink[] = [];
  const regex = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    links.push({
      slug: match[1].trim().toLowerCase().replace(/\s+/g, "-"),
      display: match[2]?.trim() || match[1].trim(),
      start: match.index,
      end: match.index + match[0].length,
    });
  }
  return links;
}

/**
 * Convert [[wikilinks]] in markdown to clickable links.
 * Returns modified markdown with wikilinks replaced by markdown links.
 */
export function renderWikilinks(content: string, basePath: string): string {
  return content.replace(
    /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,
    (_match, slug: string, display?: string) => {
      const normalizedSlug = slug.trim().toLowerCase().replace(/\s+/g, "-");
      const label = display?.trim() || slug.trim();
      return `[${label}](${basePath}/${normalizedSlug})`;
    },
  );
}

export interface BacklinkEntry {
  slug: string;
  displayName: string;
  context: string; // snippet around the link
}

/**
 * Find all soul files that contain a [[link]] to the given slug.
 */
export function getBacklinks(targetSlug: string): BacklinkEntry[] {
  const groups = getSoulFilesByCategory();
  const allFiles: SoulFile[] = Object.values(groups).flat();
  const backlinks: BacklinkEntry[] = [];

  for (const file of allFiles) {
    if (file.slug === targetSlug) continue;
    const links = extractWikilinks(file.content);
    for (const link of links) {
      if (link.slug === targetSlug) {
        // Extract ~60 chars of context around the link
        const start = Math.max(0, link.start - 30);
        const end = Math.min(file.content.length, link.end + 30);
        const context = (start > 0 ? "..." : "") +
          file.content.slice(start, end).replace(/\n/g, " ") +
          (end < file.content.length ? "..." : "");

        backlinks.push({
          slug: file.slug,
          displayName: file.displayName,
          context,
        });
        break; // one backlink per file is enough
      }
    }
  }

  return backlinks;
}
