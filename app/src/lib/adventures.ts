import { getAvatarData } from "./avatar";

export interface Adventure {
  id: number;
  story: string;
  reward: { type: "xp" | "sticker" | "fact"; value: string | number };
  date: string; // ISO date string
  souli_name: string;
}

const STORAGE_KEY = "dzino_adventures";
const SHOWN_TODAY_KEY = "dzino_adventure_shown_date";
const HOURS_THRESHOLD = 4;
const MAX_STORED = 30;

/**
 * 20 pre-written adventure stories in Slovak with fairytale/mystery tone.
 * Each uses "{name}" as a placeholder for the Souli's name.
 */
const ADVENTURE_STORIES: { id: number; story: string }[] = [
  {
    id: 1,
    story: "{name} sa vydal do Pixelovej zahrady a nasiel tam stary kluc. Vraj odomyka tajnu komnatu plnu stratených spomienok.",
  },
  {
    id: 2,
    story: "{name} sa stretol s mlcanlivou sovou, ktora mu povedala hadanku. Za spravnu odpoved dostal zrnko svetla.",
  },
  {
    id: 3,
    story: "{name} objavil potok z tekuceho zlata na okraji Bitoveho lesa. Nabral si trošku do flase — vraj prinasa stastie.",
  },
  {
    id: 4,
    story: "{name} sa zastavil v oblacnej kaviarni, kde oblaky servíruju snové kolace. Priniesol ti kúsok.",
  },
  {
    id: 5,
    story: "{name} narazil na skupinu svetlusky, ktore mu ukazali cestu k zabudnutej studnicke zelani.",
  },
  {
    id: 6,
    story: "{name} sa zatúlal do Kniznice tisícich príbehov. Jedna kniha sa sama otvorila a zaseptala mu tajomstvo.",
  },
  {
    id: 7,
    story: "{name} pomohol malemu oblaciku najst cestu spat na oblohu. Oblacik mu na oplátku ukázal dúhu, ktorú vidia len Souli.",
  },
  {
    id: 8,
    story: "{name} nasiel mapu nakreslenu na liste javora. Viedla k pokladu — a poklad bola stara fotografia úsmevu.",
  },
  {
    id: 9,
    story: "{name} sa zucastnil nocneho festivalu hviezdnych mušlí. Kazda mušla hrala inu melodiu.",
  },
  {
    id: 10,
    story: "{name} prechádzal Zahradou zrkadiel, kde kazde zrkadlo ukazovalo inu verziu buducnosti. Vybral tu najkrajsiu.",
  },
  {
    id: 11,
    story: "{name} stretol staricka, ktory predával flasy s vetrom. Kúpil jednu — vraj v nej je vietor z mora.",
  },
  {
    id: 12,
    story: "{name} sa schoval pred dazdom v dutine stromu a nasiel tam miniaturne mesto plné spiaceho hmyzu.",
  },
  {
    id: 13,
    story: "{name} objavil hojdacku zavesenú na oblakoch. Hojdal sa tak vysoko, ze videl koniec dúhy.",
  },
  {
    id: 14,
    story: "{name} sa spriatelil s kocoúrim kráľom, ktory vladne Mesacnej krajine. Dostal od neho odznacik cti.",
  },
  {
    id: 15,
    story: "{name} nasiel flasku s odkazom pri brehu Pixeloveho jazera. Odkaz zniel: 'Si na správnej ceste.'",
  },
  {
    id: 16,
    story: "{name} prechádzal Lesíkom šepotov, kde stromy rozpravaju príbehy tym, ktori pocúvaju.",
  },
  {
    id: 17,
    story: "{name} pomohol stratene hviezde vrátiť sa na oblohu. Hviezda mu na rozlúcku žmurkla.",
  },
  {
    id: 18,
    story: "{name} objavil tajný tunel pod kopcami, ktory viedol do izby plnej starych hier a hraciek.",
  },
  {
    id: 19,
    story: "{name} sa stretol s múdrym slonom, ktory si pamatal vsetky príbehy sveta. Povedal mu jeden nový.",
  },
  {
    id: 20,
    story: "{name} tancoval s polarnymi ziarami na severe. Priniesol si spat trblietku, ktora nikdy nezhasne.",
  },
];

const FUN_FACTS: string[] = [
  "Medúzy nemajú mozog, srdce ani krv.",
  "Banány sú mierne radioaktívne.",
  "Chobotnice majú tri srdcia.",
  "Srdiečko kolibríka bije až 1200-krát za minútu.",
  "Mesiac sa každý rok vzďaľuje od Zeme o 3,8 cm.",
  "Mravce dokážu uniesť 50-násobok svojej hmotnosti.",
  "Existuje viac stromov na Zemi než hviezd v Mliečnej dráhe.",
  "Plameniaky sú ružové, pretože jedia krevety.",
];

const TITLES: string[] = [
  "Hviezdny pútnik",
  "Pixelový objaviteľ",
  "Strážca dúhy",
  "Šepkáč stromov",
  "Zberateľ príbehov",
  "Nočný dobrodruh",
  "Oblačný cestovateľ",
];

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function getStoredAdventures(): Adventure[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Adventure[];
  } catch {
    return [];
  }
}

function saveAdventures(adventures: Adventure[]): void {
  if (typeof window === "undefined") return;
  // Keep only the most recent MAX_STORED
  const trimmed = adventures.slice(-MAX_STORED);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

function wasAdventureShownToday(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(SHOWN_TODAY_KEY) === getToday();
}

function markAdventureShownToday(): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(SHOWN_TODAY_KEY, getToday());
  }
}

function generateReward(): Adventure["reward"] {
  const roll = Math.random();
  if (roll < 0.6) {
    // 60% chance: XP bonus (5-15)
    return { type: "xp", value: 5 + Math.floor(Math.random() * 11) };
  } else if (roll < 0.85) {
    // 25% chance: fun fact
    return { type: "fact", value: FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)] };
  } else {
    // 15% chance: title
    return { type: "sticker", value: TITLES[Math.floor(Math.random() * TITLES.length)] };
  }
}

function pickUnusedStory(usedIds: number[]): (typeof ADVENTURE_STORIES)[number] {
  const unused = ADVENTURE_STORIES.filter((s) => !usedIds.includes(s.id));
  const pool = unused.length > 0 ? unused : ADVENTURE_STORIES;
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Check if the Souli went on an adventure while the user was away.
 * Returns an Adventure if 4+ hours have passed and none was shown today.
 * Returns null otherwise.
 */
export function checkForAdventure(): Adventure | null {
  if (typeof window === "undefined") return null;

  // Already shown today
  if (wasAdventureShownToday()) return null;

  const avatar = getAvatarData();
  const lastInteraction = new Date(avatar.lastInteraction).getTime();
  const now = Date.now();
  const hoursSince = (now - lastInteraction) / (1000 * 60 * 60);

  if (hoursSince < HOURS_THRESHOLD) return null;

  // Generate adventure
  const history = getStoredAdventures();
  const usedIds = history.map((a) => a.id);
  const template = pickUnusedStory(usedIds);
  const souliName = avatar.name || "Souli";
  const story = template.story.replace(/\{name\}/g, souliName);

  const adventure: Adventure = {
    id: template.id,
    story,
    reward: generateReward(),
    date: new Date().toISOString(),
    souli_name: souliName,
  };

  // Store and mark as shown
  history.push(adventure);
  saveAdventures(history);
  markAdventureShownToday();

  return adventure;
}

/**
 * Returns past adventures from localStorage (most recent first).
 */
export function getAdventureHistory(): Adventure[] {
  return getStoredAdventures().reverse();
}
