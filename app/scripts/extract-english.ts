#!/usr/bin/env bun
// Extract clean English from bilingual SK source files.
// Pattern in source:
//   *"Slovak text."*
//   ("English text.")
// Becomes (in EN output):
//   "English text."
//
// Title pattern:
//   # E01 — Pixelová záhrada / The Pixel Garden
// Becomes:
//   # E01 — The Pixel Garden

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "content", "story", "sk");
const OUT = path.join(ROOT, "content", "story", "en");

function transformContent(text: string): string {
  const lines = text.split("\n");
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Title with bilingual slash: "# ...Sk... / English"
    const titleMatch = line.match(/^(#+\s+(?:E\d{2}\s+—\s+)?).+? \/ (.+)$/);
    if (titleMatch && /^#+\s/.test(line)) {
      out.push(`${titleMatch[1]}${titleMatch[2]}`);
      i++;
      continue;
    }

    // Slovak italic-quote line followed by English parens
    // *"..."* on this line, ("...") on next
    const skLine = line.match(/^(\s*)\*"(.+?)"\*\s*$/);
    if (skLine && i + 1 < lines.length) {
      const enLine = lines[i + 1].match(/^(\s*)\(("?.+?"?)\)\s*$/);
      if (enLine) {
        const indent = skLine[1];
        let enText = enLine[2].trim();
        // Strip surrounding quotes if they're matching pair
        if (enText.startsWith('"') && enText.endsWith('"')) {
          enText = enText.slice(1, -1);
        }
        out.push(`${indent}"${enText}"`);
        i += 2;
        continue;
      }
    }

    // Inline bilingual within a line: ***Slovak.*** / ***English.*** — keep English half if "/" splits italic+italic
    // We don't aggressively transform these — rare in source.

    out.push(line);
    i++;
  }
  return out.join("\n");
}

function processFile(srcPath: string, outPath: string): void {
  const src = fs.readFileSync(srcPath, "utf8");
  const transformed = transformContent(src);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, transformed);
  console.log(`  ${path.relative(ROOT, srcPath)} → ${path.relative(ROOT, outPath)}`);
}

console.log("Extracting English from SK source:");
processFile(path.join(SRC, "scroll.md"), path.join(OUT, "scroll.md"));
processFile(path.join(SRC, "notes.md"), path.join(OUT, "notes.md"));
const epDir = path.join(SRC, "episodes");
const outEpDir = path.join(OUT, "episodes");
for (const f of fs.readdirSync(epDir).sort()) {
  if (!f.endsWith(".md")) continue;
  processFile(path.join(epDir, f), path.join(outEpDir, f));
}
console.log("Done.");
