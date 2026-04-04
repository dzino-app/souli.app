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

export type Species = "human" | "cat" | "dog" | "bunny" | "bear" | "fox";
export type BodyShape = "round" | "square" | "tall";
export type EyeStyle = "dots" | "wide" | "sleepy" | "anime";
export type MouthStyle = "smile" | "line" | "open";
export type EarStyle = "none" | "round" | "pointy" | "floppy" | "bear";
export type Accessory = "none" | "crown" | "cap" | "bow" | "horns" | "halo" | "glasses";
export type HairStyle = "none" | "spiky" | "tuft" | "bangs";

export interface AvatarAppearance {
  species: Species;
  bodyShape: BodyShape;
  eyeStyle: EyeStyle;
  mouthStyle: MouthStyle;
  earStyle: EarStyle;
  accessory: Accessory;
  hairStyle: HairStyle;
  skinColor: string;   // face/ear color (lighter than body)
  bodyColor: string;   // main body color
}

export interface SoundDNA {
  basePitch: number;
  timbre: OscillatorType;
  tempo: number;
  chirpRange: number;
  harmonicShift: number;
}

export interface AvatarData {
  state: AvatarState;
  mood: number;
  lastInteraction: string;
  color: string;
  name: string;
  appearance: AvatarAppearance;
  soundDNA?: SoundDNA;
}

// Species define ear + default body shape combos
const SPECIES_CONFIG: Record<Species, { ears: EarStyle; shapes: BodyShape[] }> = {
  human:  { ears: "none",   shapes: ["round", "tall"] },
  cat:    { ears: "pointy", shapes: ["round", "tall"] },
  dog:    { ears: "floppy", shapes: ["round", "square"] },
  bunny:  { ears: "pointy", shapes: ["round", "tall"] },
  bear:   { ears: "bear",   shapes: ["round", "square"] },
  fox:    { ears: "pointy", shapes: ["tall"] },
};

const SPECIES_LIST: Species[] = ["human", "cat", "dog", "bunny", "bear", "fox"];
const EYE_STYLES: EyeStyle[] = ["dots", "wide", "sleepy", "anime"];
const MOUTH_STYLES: MouthStyle[] = ["smile", "line", "open"];
const ACCESSORIES: Accessory[] = ["none", "none", "crown", "cap", "bow", "horns", "halo", "glasses"];
const HAIR_STYLES: HairStyle[] = ["none", "none", "spiky", "tuft", "bangs"];

const BODY_COLORS = [
  "#4F46E5", "#E11D48", "#16A34A", "#F59E0B",
  "#8B5CF6", "#06B6D4", "#F97316", "#EC4899",
  "#6366F1", "#14B8A6", "#A855F7", "#EF4444",
];

const SKIN_COLORS = [
  "#FDDCB5", "#F5C6A0", "#E8B98A", "#D4A574", // warm skin tones
  "#FFE4C9", "#FFF0DB",                         // light
  "#FFD6E0", "#E0D4FF", "#D4F0FF", "#D4FFE0",  // pastel tints (for animals)
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function randomAppearance(): AvatarAppearance {
  const species = pick(SPECIES_LIST);
  const config = SPECIES_CONFIG[species];
  return {
    species,
    bodyShape: pick(config.shapes),
    eyeStyle: pick(EYE_STYLES),
    mouthStyle: pick(MOUTH_STYLES),
    earStyle: config.ears,
    accessory: pick(ACCESSORIES),
    hairStyle: species === "human" ? pick(HAIR_STYLES) : pick(["none", "none", "tuft"]),
    skinColor: pick(SKIN_COLORS),
    bodyColor: pick(BODY_COLORS),
  };
}

const STORAGE_KEY = "dzino_avatar";

// Set to true to randomize avatar on every refresh (for testing only)
const DEV_RANDOMIZE = false;

export function generateSoundDNA(): SoundDNA {
  const timbres: OscillatorType[] = ["square", "sawtooth", "triangle"];
  return {
    basePitch: 350 + Math.floor(Math.random() * 400),
    timbre: timbres[Math.floor(Math.random() * timbres.length)],
    tempo: 0.8 + Math.random() * 0.5,
    chirpRange: 50 + Math.floor(Math.random() * 150),
    harmonicShift: Math.floor(Math.random() * 100),
  };
}

function createDefaultAvatar(): AvatarData {
  const appearance = randomAppearance();
  return {
    state: "idle",
    mood: 70,
    lastInteraction: new Date().toISOString(),
    color: appearance.bodyColor,
    name: "Dzino",
    appearance,
    soundDNA: generateSoundDNA(),
  };
}

export function getAvatarData(): AvatarData {
  if (typeof window === "undefined") return createDefaultAvatar();

  // In dev, always randomize for testing
  if (DEV_RANDOMIZE) {
    const data = createDefaultAvatar();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return data;
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const data = createDefaultAvatar();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return data;
  }
  const parsed = JSON.parse(raw) as Partial<AvatarData>;
  if (!parsed.appearance || !parsed.appearance.species) {
    const data = createDefaultAvatar();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return data;
  }
  // Backfill soundDNA for existing avatars
  if (!parsed.soundDNA) {
    parsed.soundDNA = generateSoundDNA();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  }
  return parsed as AvatarData;
}

export function saveAvatarData(data: AvatarData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

  // Async sync to Supabase (active avatar row)
  import("./supabase/sync")
    .then(({ syncAvatarToSupabase }) => syncAvatarToSupabase(data))
    .catch(() => {});
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
