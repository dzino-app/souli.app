import { SCROLL, EPISODE_CONTENT } from "./story-content.generated";

export interface EpisodeMeta {
  id: string; // "00" .. "12"
  number: number;
  titleSk: string;
  titleEn: string;
  mentor: string;
  biome: string;
}

export const EPISODES: readonly EpisodeMeta[] = [
  { id: "00", number: 0,  titleSk: "Hviezda za obzorom",         titleEn: "The Star Beyond the Horizon", mentor: "—",                 biome: "Úsvitová mýtina" },
  { id: "01", number: 1,  titleSk: "Pixelová záhrada",           titleEn: "The Pixel Garden",            mentor: "Hana",              biome: "Pole humučich kvetov" },
  { id: "02", number: 2,  titleSk: "Bitový les",                 titleEn: "The Binary Forest",           mentor: "Kiko",              biome: "Stromy z 1 a 0" },
  { id: "03", number: 3,  titleSk: "Záhrada zrkadiel",           titleEn: "The Mirror Garden",           mentor: "Luna",              biome: "Sklo pod dvojitým mesiacom" },
  { id: "04", number: 4,  titleSk: "Oblačná kaviareň",           titleEn: "The Cloud Café",              mentor: "Nori",              biome: "Kaviareň na cumule" },
  { id: "05", number: 5,  titleSk: "Mesačná krajina",            titleEn: "The Moon Realm",              mentor: "Bruno",             biome: "Údolia s nízkou gravitáciou" },
  { id: "06", number: 6,  titleSk: "Potok zlata",                titleEn: "The Stream of Liquid Gold",   mentor: "Otto",              biome: "Rieka, čo pamätá" },
  { id: "07", number: 7,  titleSk: "Pretek pod tromi mesiacmi",  titleEn: "Race Under Three Moons",      mentor: "Rex",               biome: "Krištáľové duny" },
  { id: "08", number: 8,  titleSk: "Tichá sova",                 titleEn: "The Silent Owl",              mentor: "Mimi",              biome: "Súmračný háj" },
  { id: "09", number: 9,  titleSk: "Súmračná scéna",             titleEn: "The Twilight Stage",          mentor: "Ari + Pixel",       biome: "Amfiteáter pod vlasom kométy" },
  { id: "10", number: 10, titleSk: "Knižnica tisícich príbehov", titleEn: "The Library of a Thousand Stories", mentor: "Biscuit",     biome: "Police, čo sa preusporiadúvajú" },
  { id: "11", number: 11, titleSk: "Búrkové pole",               titleEn: "The Storm Field",             mentor: "Zara",              biome: "Otvorená pláň, skutočná búrka" },
  { id: "12", number: 12, titleSk: "Okno",                       titleEn: "The Window",                  mentor: "Všetkých dvanásť",  biome: "Hrana Pixoci" },
] as const;

export function loadScroll(): string {
  return SCROLL;
}

export function loadEpisode(id: string): string | null {
  return EPISODE_CONTENT[id] ?? null;
}

export function getEpisode(id: string): EpisodeMeta | undefined {
  return EPISODES.find((e) => e.id === id);
}

export function getNextEpisode(id: string): EpisodeMeta | undefined {
  const idx = EPISODES.findIndex((e) => e.id === id);
  return idx >= 0 && idx < EPISODES.length - 1 ? EPISODES[idx + 1] : undefined;
}

export function getPrevEpisode(id: string): EpisodeMeta | undefined {
  const idx = EPISODES.findIndex((e) => e.id === id);
  return idx > 0 ? EPISODES[idx - 1] : undefined;
}
