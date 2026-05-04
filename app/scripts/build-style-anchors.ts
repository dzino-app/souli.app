#!/usr/bin/env bun
// Walks public/style-anchors/ at build time and emits a generated TS module
// listing each expected anchor + whether it exists + size (placeholder heuristic).
// Run with: bun run scripts/build-style-anchors.ts
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");
const ANCHORS_DIR = path.join(ROOT, "public", "style-anchors");
const OUT = path.join(ROOT, "src", "lib", "style-anchors-inventory.generated.ts");

interface AnchorSpec {
  id: string;
  kind: "dzino" | "mentor" | "biome";
  name: string;
  role: string;
  file: string;
}

const SPEC: AnchorSpec[] = [
  { id: "dzino", kind: "dzino", name: "Dzino", role: "The First Souli", file: "dzino/dzino.png" },

  { id: "hana",    kind: "mentor", name: "Hana",    role: "E01 · Pixel Garden",         file: "mentors/hana.png" },
  { id: "kiko",    kind: "mentor", name: "Kiko",    role: "E02 · Binary Forest",        file: "mentors/kiko.png" },
  { id: "luna",    kind: "mentor", name: "Luna",    role: "E03 · Mirror Garden",        file: "mentors/luna.png" },
  { id: "nori",    kind: "mentor", name: "Nori",    role: "E04 · Cloud Café",           file: "mentors/nori.png" },
  { id: "bruno",   kind: "mentor", name: "Bruno",   role: "E05 · Moon Realm",           file: "mentors/bruno.png" },
  { id: "otto",    kind: "mentor", name: "Otto",    role: "E06 · Stream of Liquid Gold",file: "mentors/otto.png" },
  { id: "rex",     kind: "mentor", name: "Rex",     role: "E07 · Three-Moon Dunes",     file: "mentors/rex.png" },
  { id: "mimi",    kind: "mentor", name: "Mimi",    role: "E08 · Silent Owl Grove",     file: "mentors/mimi.png" },
  { id: "ari",     kind: "mentor", name: "Ari",     role: "E09 · Twilight Stage",       file: "mentors/ari.png" },
  { id: "pixel",   kind: "mentor", name: "Pixel",   role: "E09 · Twilight Stage",       file: "mentors/pixel.png" },
  { id: "biscuit", kind: "mentor", name: "Biscuit", role: "E10 · Library",              file: "mentors/biscuit.png" },
  { id: "zara",    kind: "mentor", name: "Zara",    role: "E11 · Storm Field",          file: "mentors/zara.png" },

  { id: "pixel-garden",  kind: "biome", name: "Pixel Garden",  role: "E01", file: "biomes/pixel-garden.png" },
  { id: "binary-forest", kind: "biome", name: "Binary Forest", role: "E02", file: "biomes/binary-forest.png" },
  { id: "mirror-garden", kind: "biome", name: "Mirror Garden", role: "E03", file: "biomes/mirror-garden.png" },
  { id: "cloud-cafe",    kind: "biome", name: "Cloud Café",    role: "E04", file: "biomes/cloud-cafe.png" },
  { id: "moon-realm",    kind: "biome", name: "Moon Realm",    role: "E05", file: "biomes/moon-realm.png" },
];

// Placeholder heuristic: our auto-generated cards are ~9-12KB. Real hand-painted
// plates will exceed 30KB. (Artists can also drop a sentinel file like
// `painted/<id>.txt` if they prefer explicit marking — TODO if needed.)
const PLACEHOLDER_THRESHOLD = 30_000;

const enriched = SPEC.map((s) => {
  const fullPath = path.join(ANCHORS_DIR, s.file);
  let exists = false;
  let size = 0;
  try {
    const stat = fs.statSync(fullPath);
    exists = stat.isFile();
    size = stat.size;
  } catch {
    // missing
  }
  // Drop the build-only `file` field; the runtime only needs `src`.
  return {
    id: s.id,
    kind: s.kind,
    name: s.name,
    role: s.role,
    src: `/style-anchors/${s.file}`,
    exists,
    isPlaceholder: exists && size < PLACEHOLDER_THRESHOLD,
    sizeBytes: size,
  };
});

let out = "// AUTO-GENERATED from public/style-anchors/ — do not edit by hand.\n";
out += "// Regenerate with: bun run scripts/build-style-anchors.ts\n\n";
out += `export interface StyleAnchor {
  id: string;
  kind: "dzino" | "mentor" | "biome";
  name: string;
  role: string;
  src: string;
  exists: boolean;
  isPlaceholder: boolean;
  sizeBytes: number;
}\n\n`;
out += "export const STYLE_ANCHORS: StyleAnchor[] = ";
out += JSON.stringify(enriched, null, 2);
out += ";\n";

fs.writeFileSync(OUT, out);

const stats = {
  total: enriched.length,
  exists: enriched.filter((e) => e.exists).length,
  placeholders: enriched.filter((e) => e.exists && e.isPlaceholder).length,
  painted: enriched.filter((e) => e.exists && !e.isPlaceholder).length,
};
console.log(`Wrote ${OUT}`);
console.log(`  total: ${stats.total}, exists: ${stats.exists}, painted: ${stats.painted}, placeholders: ${stats.placeholders}, missing: ${stats.total - stats.exists}`);
