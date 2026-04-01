import { describe, it, expect, beforeEach } from "bun:test";
import {
  getSoulFiles,
  getSoulFile,
  updateSoulFile,
  appendToSoulFile,
  getSoulContext,
  getSoulFilesByCategory,
} from "../soul";

describe("soul", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("seeds default files on first access", () => {
    const files = getSoulFiles();
    expect(files.length).toBeGreaterThanOrEqual(8);
    expect(files[0].slug).toBe("osobnost");
  });

  it("gets a specific soul file by slug", () => {
    getSoulFiles(); // seed
    const file = getSoulFile("humor");
    expect(file).not.toBeNull();
    expect(file!.displayName).toBe("Humor");
  });

  it("returns null for non-existent slug", () => {
    getSoulFiles(); // seed
    expect(getSoulFile("nonexistent")).toBeNull();
  });

  it("updates a soul file", () => {
    getSoulFiles(); // seed
    updateSoulFile("osobnost", "# Nový obsah", "user");
    const file = getSoulFile("osobnost");
    expect(file!.content).toBe("# Nový obsah");
    expect(file!.updatedBy).toBe("user");
  });

  it("appends to a soul file", () => {
    getSoulFiles(); // seed
    appendToSoulFile("zaujmy", "- Behanie", "dzino");
    const file = getSoulFile("zaujmy");
    expect(file!.content).toContain("- Behanie");
    expect(file!.updatedBy).toBe("dzino");
  });

  it("generates soul context string", () => {
    getSoulFiles(); // seed
    const context = getSoulContext();
    expect(context).toContain("--- osobnost.md ---");
    expect(context).toContain("--- humor.md ---");
  });

  it("groups files by category", () => {
    getSoulFiles(); // seed
    const groups = getSoulFilesByCategory();
    expect(groups["jadro"]).toBeDefined();
    expect(groups["jadro"].length).toBeGreaterThanOrEqual(3);
  });
});
