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

export type BodyShape = "round" | "square" | "tall";
export type EyeStyle = "dots" | "wide" | "sleepy" | "anime";
export type MouthStyle = "smile" | "line" | "open";
export type Accessory = "none" | "crown" | "cap" | "bow" | "horns" | "halo";

export interface AvatarAppearance {
  bodyShape: BodyShape;
  eyeStyle: EyeStyle;
  mouthStyle: MouthStyle;
  accessory: Accessory;
}

export interface AvatarData {
  state: AvatarState;
  mood: number; // 0-100
  lastInteraction: string; // ISO timestamp
  color: string; // hex color chosen during onboarding
  name: string; // "Dzino" by default
  appearance: AvatarAppearance;
}

const BODY_SHAPES: BodyShape[] = ["round", "square", "tall"];
const EYE_STYLES: EyeStyle[] = ["dots", "wide", "sleepy", "anime"];
const MOUTH_STYLES: MouthStyle[] = ["smile", "line", "open"];
const ACCESSORIES: Accessory[] = ["none", "crown", "cap", "bow", "horns", "halo"];
const COLORS = [
  "#4F46E5", // indigo
  "#E11D48", // rose
  "#16A34A", // green
  "#F59E0B", // amber
  "#8B5CF6", // violet
  "#06B6D4", // cyan
  "#F97316", // orange
  "#EC4899", // pink
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomAppearance(): AvatarAppearance {
  return {
    bodyShape: pick(BODY_SHAPES),
    eyeStyle: pick(EYE_STYLES),
    mouthStyle: pick(MOUTH_STYLES),
    accessory: pick(ACCESSORIES),
  };
}

const STORAGE_KEY = "dzino_avatar";

function createDefaultAvatar(): AvatarData {
  return {
    state: "idle",
    mood: 70,
    lastInteraction: new Date().toISOString(),
    color: pick(COLORS),
    name: "Dzino",
    appearance: randomAppearance(),
  };
}

export function getAvatarData(): AvatarData {
  if (typeof window === "undefined") return createDefaultAvatar();
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const data = createDefaultAvatar();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return data;
  }
  const parsed = JSON.parse(raw) as Partial<AvatarData>;
  // Migrate old data that lacks appearance
  if (!parsed.appearance) {
    parsed.appearance = randomAppearance();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  }
  return parsed as AvatarData;
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
