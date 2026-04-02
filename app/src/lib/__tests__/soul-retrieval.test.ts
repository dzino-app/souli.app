import { describe, it, expect, beforeEach } from "bun:test";
import {
  tokenize,
  scoreFile,
  getRelevantSoulContext,
  getSoulContextForMessage,
  getDecayedSoulContext,
} from "../soul-retrieval";
import {
  getSoulFiles,
  applyDecay,
} from "../soul";
import type { SoulFile } from "../soul";
import {
  extractBullets,
  areDuplicates,
  consolidateSoulFile,
  needsConsolidation,
} from "../soul-consolidation";

// ---- Helpers ----

function makeSoulFile(
  slug: string,
  content: string,
  category: "jadro" | "zaujmy" | "vztahy" | "praca" = "jadro"
): SoulFile {
  return {
    slug,
    displayName: slug,
    category,
    content,
    updatedAt: new Date().toISOString(),
    updatedBy: "dzino",
  };
}

// ============================================================
// 1. Selective Retrieval
// ============================================================

describe("soul-retrieval", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("tokenize", () => {
    it("splits text into lowercase words", () => {
      const tokens = tokenize("Hello World! This is a Test.");
      expect(tokens).toContain("hello");
      expect(tokens).toContain("world");
      expect(tokens).toContain("this");
      expect(tokens).toContain("test");
    });

    it("filters out short words (<=2 chars)", () => {
      const tokens = tokenize("I am a big dog");
      expect(tokens).not.toContain("am");
      expect(tokens).not.toContain("a");
      expect(tokens).toContain("big");
      expect(tokens).toContain("dog");
    });

    it("handles unicode characters", () => {
      const tokens = tokenize("Ahoj svet, ako sa máš?");
      expect(tokens).toContain("ahoj");
      expect(tokens).toContain("svet");
      expect(tokens).toContain("ako");
      expect(tokens).toContain("máš");
    });

    it("returns empty array for empty string", () => {
      expect(tokenize("")).toEqual([]);
    });
  });

  describe("scoreFile", () => {
    it("returns 0 for no overlap", () => {
      const file = makeSoulFile("test", "- Rád behám po lese");
      expect(scoreFile("programovanie v pythone", file)).toBe(0);
    });

    it("returns positive score for keyword overlap", () => {
      const file = makeSoulFile(
        "test",
        "- Rád programujem v pythone\n- Baví ma programovanie"
      );
      const score = scoreFile("programovanie v pythone", file);
      expect(score).toBeGreaterThan(0);
    });

    it("gives bonus for trigger keywords on dennik", () => {
      const file = makeSoulFile("dennik", "# Denník\n\n- Dnes bol pekný deň");
      const scoreDnes = scoreFile("čo sa dnes stalo", file);
      const scoreGeneric = scoreFile("aké je počasie", file);
      expect(scoreDnes).toBeGreaterThan(scoreGeneric);
    });

    it("gives bonus for trigger keywords on vztahy", () => {
      const file = makeSoulFile(
        "vztahy",
        "# Vzťahy\n\n- Kamarát Peter\n- Mama Janka",
        "vztahy"
      );
      const scoreVztahy = scoreFile("povedz mi o mojej rodina", file);
      const scoreGeneric = scoreFile("aké je počasie", file);
      expect(scoreVztahy).toBeGreaterThan(scoreGeneric);
    });
  });

  describe("getRelevantSoulContext", () => {
    it("always includes osobnost and preferencie", () => {
      getSoulFiles(); // seed defaults
      const relevant = getRelevantSoulContext("random message");
      const slugs = relevant.map((f) => f.slug);
      expect(slugs).toContain("osobnost");
      expect(slugs).toContain("preferencie");
    });

    it("respects maxFiles limit", () => {
      getSoulFiles(); // seed defaults
      const relevant = getRelevantSoulContext("some message", 3);
      expect(relevant.length).toBeLessThanOrEqual(3);
    });

    it("returns at least the always-included files", () => {
      getSoulFiles(); // seed defaults
      const relevant = getRelevantSoulContext("xyz", 2);
      const slugs = relevant.map((f) => f.slug);
      expect(slugs).toContain("osobnost");
      expect(slugs).toContain("preferencie");
    });

    it("includes dennik when message mentions time-related words", () => {
      getSoulFiles(); // seed defaults
      const relevant = getRelevantSoulContext("čo si robil dnes?", 10);
      const slugs = relevant.map((f) => f.slug);
      expect(slugs).toContain("dennik");
    });
  });

  describe("getSoulContextForMessage", () => {
    it("returns formatted string with file headers", () => {
      getSoulFiles(); // seed defaults
      const context = getSoulContextForMessage("ahoj svet");
      expect(context).toContain("--- osobnost.md ---");
      expect(context).toContain("--- preferencie.md ---");
    });

    it("includes content from relevant files", () => {
      getSoulFiles(); // seed defaults
      const context = getSoulContextForMessage("aké technológie používaš?");
      // Should include always-included files plus relevant ones
      expect(context).toContain("--- osobnost.md ---");
      expect(context.length).toBeGreaterThan(0);
    });
  });
});

// ============================================================
// 2. Memory Consolidation
// ============================================================

describe("soul-consolidation", () => {
  describe("extractBullets", () => {
    it("separates preamble from bullets", () => {
      const content = "# Title\n\nSome text\n\n- Bullet 1\n- Bullet 2";
      const { preamble, bullets } = extractBullets(content);
      expect(preamble).toContain("# Title");
      expect(preamble).toContain("Some text");
      expect(bullets).toHaveLength(2);
      expect(bullets[0]).toBe("- Bullet 1");
    });

    it("handles content with no bullets", () => {
      const content = "# Title\n\nJust some text";
      const { preamble, bullets } = extractBullets(content);
      expect(preamble).toBe("# Title\n\nJust some text");
      expect(bullets).toHaveLength(0);
    });

    it("handles content with only bullets", () => {
      const content = "- One\n- Two\n- Three";
      const { bullets } = extractBullets(content);
      expect(bullets).toHaveLength(3);
    });
  });

  describe("areDuplicates", () => {
    it("detects exact duplicates after normalization", () => {
      expect(areDuplicates("- Rád behám", "- Rád behám")).toBe(true);
    });

    it("detects similar bullets with high word overlap", () => {
      expect(
        areDuplicates(
          "- Rád programujem v jazyku Python každý deň",
          "- Rád programujem v jazyku Python každý večer"
        )
      ).toBe(true);
    });

    it("does not flag different bullets as duplicates", () => {
      expect(
        areDuplicates("- Rád behám po lese", "- Baví ma programovanie")
      ).toBe(false);
    });

    it("handles empty bullets", () => {
      expect(areDuplicates("- ", "- ")).toBe(true);
    });
  });

  describe("consolidateSoulFile", () => {
    it("removes duplicate bullets", () => {
      const content =
        "# Test\n\n- Rád behám\n- Mám rád hudbu\n- Rád behám po lese\n- Rád behám";
      const result = consolidateSoulFile(content);
      // "Rád behám" appears twice — one should be removed
      const bullets = result
        .split("\n")
        .filter((l) => l.startsWith("- "));
      // The exact duplicate "Rád behám" appears at index 0 and 3;
      // the dedup keeps the later one (index 3)
      const behaMcount = bullets.filter((b) => b === "- Rád behám").length;
      expect(behaMcount).toBeLessThanOrEqual(1);
    });

    it("preserves preamble", () => {
      const content = "# Osobnosť\n\nPopis:\n\n- Trait 1\n- Trait 2";
      const result = consolidateSoulFile(content);
      expect(result).toContain("# Osobnosť");
    });

    it("trims to max 50 bullets keeping recent ones", () => {
      const bullets = Array.from(
        { length: 60 },
        (_, i) => `- Bullet ${i}`
      );
      const content = "# Big file\n\n" + bullets.join("\n");
      const result = consolidateSoulFile(content);
      const resultBullets = result
        .split("\n")
        .filter((l) => l.startsWith("- "));
      expect(resultBullets.length).toBeLessThanOrEqual(50);
      // Should keep the last 50 (newest)
      expect(resultBullets[resultBullets.length - 1]).toBe("- Bullet 59");
    });

    it("returns content unchanged if no bullets", () => {
      const content = "# Just a title\n\nSome text here.";
      expect(consolidateSoulFile(content)).toBe(content);
    });
  });

  describe("needsConsolidation", () => {
    it("returns true when content exceeds char threshold", () => {
      const file = makeSoulFile("test", "x".repeat(2001));
      expect(needsConsolidation(file)).toBe(true);
    });

    it("returns true when bullet count exceeds threshold", () => {
      const bullets = Array.from(
        { length: 35 },
        (_, i) => `- Item ${i}`
      ).join("\n");
      const file = makeSoulFile("test", `# Test\n\n${bullets}`);
      expect(needsConsolidation(file)).toBe(true);
    });

    it("returns false for small files", () => {
      const file = makeSoulFile("test", "# Test\n\n- One\n- Two\n- Three");
      expect(needsConsolidation(file)).toBe(false);
    });
  });
});

// ============================================================
// 3. Memory Decay
// ============================================================

describe("memory decay", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("applyDecay", () => {
    it("returns content unchanged when few bullets", () => {
      const content = "# Test\n\n- One\n- Two\n- Three";
      expect(applyDecay(content)).toBe(content);
    });

    it("applies decay to files with many bullets", () => {
      const bullets = Array.from(
        { length: 40 },
        (_, i) => `- Entry ${i}`
      );
      const content = "# Big file\n\n" + bullets.join("\n");
      const result = applyDecay(content);

      // Should contain the decay summary
      expect(result).toContain("starších záznamov");
      // Should contain recent entries
      expect(result).toContain("- Entry 39");
      expect(result).toContain("- Entry 20");
    });

    it("preserves important entries marked with !", () => {
      const normalBullets = Array.from(
        { length: 35 },
        (_, i) => `- Normal entry ${i}`
      );
      // Insert important entry early (old)
      normalBullets[2] = "- Important fact about user!";
      const content = "# Test\n\n" + normalBullets.join("\n");
      const result = applyDecay(content);

      expect(result).toContain("Important fact about user!");
    });

    it("preserves important entries marked with *", () => {
      const normalBullets = Array.from(
        { length: 35 },
        (_, i) => `- Normal entry ${i}`
      );
      normalBullets[1] = "- *Key preference*";
      const content = "# Test\n\n" + normalBullets.join("\n");
      const result = applyDecay(content);

      expect(result).toContain("*Key preference*");
    });

    it("preserves preamble/headers", () => {
      const bullets = Array.from(
        { length: 40 },
        (_, i) => `- Entry ${i}`
      );
      const content = "# Denník\n\nMoje záznamy:\n\n" + bullets.join("\n");
      const result = applyDecay(content);
      expect(result).toContain("# Denník");
      expect(result).toContain("Moje záznamy:");
    });
  });

  describe("getDecayedSoulContext", () => {
    it("returns formatted context with decay applied", () => {
      getSoulFiles(); // seed defaults
      const context = getDecayedSoulContext("ahoj svet");
      // Should contain at least osobnost (always included)
      expect(context).toContain("--- osobnost.md ---");
    });

    it("includes always-included files", () => {
      getSoulFiles(); // seed defaults
      const context = getDecayedSoulContext("niečo o technológiách");
      expect(context).toContain("--- osobnost.md ---");
      expect(context).toContain("--- preferencie.md ---");
    });
  });
});
