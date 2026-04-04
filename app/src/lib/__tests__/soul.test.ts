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

  it("default osobnost has real personality traits", () => {
    getSoulFiles(); // seed
    const file = getSoulFile("osobnost");
    expect(file).not.toBeNull();
    expect(file!.content).toContain("Priateľský a zvedavý");
    expect(file!.content).toContain("Trpezlivý a chápavý");
  });

  it("default zaujmy has broad interests", () => {
    getSoulFiles(); // seed
    const file = getSoulFile("zaujmy");
    expect(file).not.toBeNull();
    expect(file!.content).toContain("príbehy ľudí");
    expect(file!.content).toContain("nové technológie");
  });

  it("default humor has humor style", () => {
    getSoulFiles(); // seed
    const file = getSoulFile("humor");
    expect(file).not.toBeNull();
    expect(file!.content).toContain("slovné hry a kalambúry");
    expect(file!.content).toContain("sarkastický");
  });

  it("default vztahy is inviting but empty", () => {
    getSoulFiles(); // seed
    const file = getSoulFile("vztahy");
    expect(file).not.toBeNull();
    expect(file!.content).toContain("Ešte som nikoho nespoznal");
  });

  it("default ciele has Dzino's own goals", () => {
    getSoulFiles(); // seed
    const file = getSoulFile("ciele");
    expect(file).not.toBeNull();
    expect(file!.content).toContain("Lepšie ťa spoznať");
    expect(file!.content).toContain("organizáciou dňa");
  });

  it("default preferencie has communication defaults", () => {
    getSoulFiles(); // seed
    const file = getSoulFile("preferencie");
    expect(file).not.toBeNull();
    expect(file!.content).toContain("stručne ale priateľsky");
    expect(file!.content).toContain("Radšej sa opýtam než hádám");
  });

  it("default dennik has a first-day entry", () => {
    getSoulFiles(); // seed
    const file = getSoulFile("dennik");
    expect(file).not.toBeNull();
    expect(file!.content).toContain("narodil");
    expect(file!.content).toContain("Teším sa na prvý rozhovor");
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

  it("updates a soul file", async () => {
    getSoulFiles(); // seed
    await updateSoulFile("osobnost", "# Nový obsah", "user");
    const file = getSoulFile("osobnost");
    expect(file!.content).toBe("# Nový obsah");
    expect(file!.updatedBy).toBe("user");
  });

  it("appends to a soul file", async () => {
    getSoulFiles(); // seed
    await appendToSoulFile("zaujmy", "- Behanie", "dzino");
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
