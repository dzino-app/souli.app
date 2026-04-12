/**
 * Build graph data from soul files for force-directed visualization.
 */

import { getSoulFiles, isSystemFile } from "./soul";
import { extractWikilinks } from "./wikilinks";

export interface GraphNode {
  id: string;
  label: string;
  category: string;
  size: number;
}

export interface GraphLink {
  source: string;
  target: string;
}

export interface SoulGraph {
  nodes: GraphNode[];
  links: GraphLink[];
}

/**
 * Extract significant words from content for keyword overlap detection.
 * Strips markdown syntax, filters short/common words.
 */
function extractKeywords(content: string): Set<string> {
  const text = content
    .replace(/^#+\s.*/gm, "") // strip headers
    .replace(/[_*`\[\]()#>!|-]/g, " ")
    .toLowerCase();

  const stopwords = new Set([
    "a", "aj", "ale", "ako", "ani", "az", "by", "co", "ci", "da", "do",
    "je", "jej", "ho", "ja", "ka", "ku", "ma", "mi", "na", "ne", "no",
    "od", "po", "pre", "pri", "sa", "si", "so", "su", "ta", "to", "tu",
    "ty", "uz", "vo", "za", "ze", "ak", "ked", "nie", "rad", "som",
    "ste", "ktory", "ktora", "ktore", "ten", "tato", "toto", "sem",
    "tam", "very", "este", "alebo", "tiez", "kde", "nic",
    "the", "and", "is", "in", "it", "of", "to", "for", "with", "on",
    "that", "this", "was", "are", "be", "has", "have", "had", "not",
  ]);

  const words = text.split(/\s+/).filter(
    (w) => w.length >= 4 && !stopwords.has(w) && !/^\d+$/.test(w)
  );

  return new Set(words);
}

/**
 * Build graph data from all soul files.
 */
export function buildSoulGraph(): SoulGraph {
  const files = getSoulFiles().filter((f) => !isSystemFile(f.slug));

  const nodes: GraphNode[] = files.map((f) => ({
    id: f.slug,
    label: f.displayName,
    category: f.category,
    size: Math.max(4, Math.min(20, Math.sqrt(f.content.length) / 2)),
  }));

  const slugSet = new Set(files.map((f) => f.slug));
  const linkSet = new Set<string>();
  const links: GraphLink[] = [];

  function addLink(a: string, b: string) {
    const key = [a, b].sort().join("--");
    if (linkSet.has(key)) return;
    linkSet.add(key);
    links.push({ source: a, target: b });
  }

  // Wikilinks
  for (const file of files) {
    const wikilinks = extractWikilinks(file.content);
    for (const link of wikilinks) {
      if (slugSet.has(link.slug) && link.slug !== file.slug) {
        addLink(file.slug, link.slug);
      }
    }
  }

  // Keyword overlap
  const keywordMap = new Map<string, Set<string>>();
  for (const file of files) {
    keywordMap.set(file.slug, extractKeywords(file.content));
  }

  for (let i = 0; i < files.length; i++) {
    for (let j = i + 1; j < files.length; j++) {
      const a = files[i].slug;
      const b = files[j].slug;
      const ka = keywordMap.get(a)!;
      const kb = keywordMap.get(b)!;

      let overlap = 0;
      for (const word of ka) {
        if (kb.has(word)) overlap++;
      }

      if (overlap >= 3) {
        addLink(a, b);
      }
    }
  }

  return { nodes, links };
}
