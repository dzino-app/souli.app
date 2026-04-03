import { describe, it, expect, beforeEach } from "bun:test";
import {
  getAvatarData,
  setAvatarState,
  recordInteraction,
  setAvatarColor,
  setAvatarName,
} from "../avatar";

describe("avatar", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns defaults on first access", () => {
    const data = getAvatarData();
    expect(data.name).toBe("Dzino");
    expect(data.mood).toBe(70);
    expect(data.state).toBe("idle");
    expect(data.appearance).toBeDefined();
    expect(data.appearance.bodyShape).toBeDefined();
    expect(data.appearance.eyeStyle).toBeDefined();
    expect(data.appearance.mouthStyle).toBeDefined();
    expect(data.appearance.accessory).toBeDefined();
  });

  it("sets avatar state", () => {
    getAvatarData(); // seed
    setAvatarState("talking");
    expect(getAvatarData().state).toBe("talking");
  });

  it("records interaction and boosts mood", () => {
    getAvatarData(); // seed
    recordInteraction();
    const data = getAvatarData();
    expect(data.mood).toBe(80); // 70 + 10
  });

  it("caps mood at 100", () => {
    getAvatarData(); // seed
    recordInteraction(); // 80
    recordInteraction(); // 90
    recordInteraction(); // 100
    recordInteraction(); // still 100
    expect(getAvatarData().mood).toBe(100);
  });

  it("sets avatar color", () => {
    getAvatarData(); // seed
    setAvatarColor("#FF0000");
    expect(getAvatarData().color).toBe("#FF0000");
  });

  it("sets avatar name", () => {
    getAvatarData(); // seed
    setAvatarName("Bublina");
    expect(getAvatarData().name).toBe("Bublina");
  });
});
