import { STORY_BY_LOCALE } from "./story-content.generated";

export interface EpisodeMeta {
  id: string; // "e00" .. "e12"
  number: number;
  titleSk: string;
  titleEn: string;
  mentor: string;
  biome: string;
}

export const EPISODES: readonly EpisodeMeta[] = [
  { id: "e00", number: 0,  titleSk: "Hviezda za obzorom",         titleEn: "The Star Beyond the Horizon", mentor: "—",                 biome: "Úsvitová mýtina" },
  { id: "e01", number: 1,  titleSk: "Pixelová záhrada",           titleEn: "The Pixel Garden",            mentor: "Hana",              biome: "Pole humučich kvetov" },
  { id: "e02", number: 2,  titleSk: "Bitový les",                 titleEn: "The Binary Forest",           mentor: "Kiko",              biome: "Stromy z 1 a 0" },
  { id: "e03", number: 3,  titleSk: "Záhrada zrkadiel",           titleEn: "The Mirror Garden",           mentor: "Luna",              biome: "Sklo pod dvojitým mesiacom" },
  { id: "e04", number: 4,  titleSk: "Oblačná kaviareň",           titleEn: "The Cloud Café",              mentor: "Nori",              biome: "Kaviareň na cumule" },
  { id: "e05", number: 5,  titleSk: "Mesačná krajina",            titleEn: "The Moon Realm",              mentor: "Bruno",             biome: "Údolia s nízkou gravitáciou" },
  { id: "e06", number: 6,  titleSk: "Potok zlata",                titleEn: "The Stream of Liquid Gold",   mentor: "Otto",              biome: "Rieka, čo pamätá" },
  { id: "e07", number: 7,  titleSk: "Pretek pod tromi mesiacmi",  titleEn: "Race Under Three Moons",      mentor: "Rex",               biome: "Krištáľové duny" },
  { id: "e08", number: 8,  titleSk: "Tichá sova",                 titleEn: "The Silent Owl",              mentor: "Mimi",              biome: "Súmračný háj" },
  { id: "e09", number: 9,  titleSk: "Súmračná scéna",             titleEn: "The Twilight Stage",          mentor: "Ari + Pixel",       biome: "Amfiteáter pod vlasom kométy" },
  { id: "e10", number: 10, titleSk: "Knižnica tisícich príbehov", titleEn: "The Library of a Thousand Stories", mentor: "Biscuit",     biome: "Police, čo sa preusporiadúvajú" },
  { id: "e11", number: 11, titleSk: "Búrkové pole",               titleEn: "The Storm Field",             mentor: "Zara",              biome: "Otvorená pláň, skutočná búrka" },
  { id: "e12", number: 12, titleSk: "Okno",                       titleEn: "The Window",                  mentor: "Všetkých dvanásť",  biome: "Hrana Pixoci" },
] as const;

const FALLBACK_LOCALE = "en";

function resolveLocale(locale: string): string {
  if (STORY_BY_LOCALE[locale]) return locale;
  if (STORY_BY_LOCALE[FALLBACK_LOCALE]) return FALLBACK_LOCALE;
  const any = Object.keys(STORY_BY_LOCALE)[0];
  if (!any) throw new Error("no story content compiled");
  return any;
}

export function loadScroll(locale: string): string {
  return STORY_BY_LOCALE[resolveLocale(locale)].scroll;
}

export function loadEpisode(locale: string, id: string): string | null {
  const pack = STORY_BY_LOCALE[resolveLocale(locale)];
  if (pack.episodes[id]) return pack.episodes[id];
  const fallback = STORY_BY_LOCALE[FALLBACK_LOCALE];
  return fallback?.episodes[id] ?? null;
}

export function loadStoryboard(locale: string, id: string): string | null {
  // Storyboards are authored in English (production reference); same content for all locales.
  const en = STORY_BY_LOCALE[FALLBACK_LOCALE];
  if (en?.storyboards?.[id]) return en.storyboards[id];
  // Fallback: check active locale just in case
  const pack = STORY_BY_LOCALE[resolveLocale(locale)];
  return pack.storyboards?.[id] ?? null;
}

export function hasStoryboard(id: string): boolean {
  const en = STORY_BY_LOCALE[FALLBACK_LOCALE];
  return Boolean(en?.storyboards?.[id]);
}

export function hasLocale(locale: string): boolean {
  return Boolean(STORY_BY_LOCALE[locale]);
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

/** Title displayed for an episode, picking locale-appropriate where available. */
export function getEpisodeTitle(meta: EpisodeMeta, locale: string): string {
  if (locale === "sk") return meta.titleSk;
  return meta.titleEn;
}
