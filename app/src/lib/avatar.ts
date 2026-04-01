export type AvatarState =
  | "idle"
  | "walking"
  | "sleeping"
  | "eating"
  | "talking"
  | "happy"
  | "sad"
  | "thinking"
  | "waving";

export interface AvatarData {
  state: AvatarState;
  mood: number; // 0-100
  lastInteraction: string; // ISO timestamp
  color: string; // hex color chosen during onboarding
  name: string; // "Dzino" by default
}

const STORAGE_KEY = "dzino_avatar";

const DEFAULT_AVATAR: AvatarData = {
  state: "idle",
  mood: 70,
  lastInteraction: new Date().toISOString(),
  color: "#4F46E5", // primary blue
  name: "Dzino",
};

export function getAvatarData(): AvatarData {
  if (typeof window === "undefined") return DEFAULT_AVATAR;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_AVATAR));
    return DEFAULT_AVATAR;
  }
  return JSON.parse(raw);
}

export function saveAvatarData(data: AvatarData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function setAvatarState(state: AvatarState) {
  const data = getAvatarData();
  data.state = state;
  saveAvatarData(data);
}

export function recordInteraction() {
  const data = getAvatarData();
  data.lastInteraction = new Date().toISOString();
  data.mood = Math.min(100, data.mood + 10);
  saveAvatarData(data);
}

export function setAvatarColor(color: string) {
  const data = getAvatarData();
  data.color = color;
  saveAvatarData(data);
}

export function setAvatarName(name: string) {
  const data = getAvatarData();
  data.name = name;
  saveAvatarData(data);
}
