import { describe, it, expect, beforeEach } from "bun:test";
import {
  getSkills,
  createSkill,
  toggleSkillPublic,
  deleteSkill,
  getPublicSkills,
  incrementSkillUsage,
} from "../skills";

describe("skills", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("starts with no skills", () => {
    expect(getSkills()).toEqual([]);
  });

  it("creates a skill", () => {
    const skill = createSkill("Test", "Popis", "System prompt");
    expect(skill.name).toBe("Test");
    expect(skill.isPublic).toBe(false);
    expect(getSkills()).toHaveLength(1);
  });

  it("toggles skill public status", () => {
    const skill = createSkill("Test", "Popis", "Prompt");
    const updated = toggleSkillPublic(skill.id);
    expect(updated[0].isPublic).toBe(true);

    const updated2 = toggleSkillPublic(skill.id);
    expect(updated2[0].isPublic).toBe(false);
  });

  it("deletes a skill", () => {
    const skill = createSkill("Test", "Popis", "Prompt");
    deleteSkill(skill.id);
    expect(getSkills()).toHaveLength(0);
  });

  it("filters public skills", () => {
    const s1 = createSkill("Public", "P", "P");
    createSkill("Private", "P", "P");
    toggleSkillPublic(s1.id);

    expect(getPublicSkills()).toHaveLength(1);
    expect(getPublicSkills()[0].name).toBe("Public");
  });

  it("increments usage count", () => {
    const skill = createSkill("Test", "P", "P");
    incrementSkillUsage(skill.id);
    incrementSkillUsage(skill.id);
    expect(getSkills()[0].usageCount).toBe(2);
  });
});
