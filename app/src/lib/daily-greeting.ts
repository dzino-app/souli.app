import { getUpcomingEvents } from "./events";
import { getAvatarData } from "./avatar";
import { getSoulFile } from "./soul";

const LAST_GREETING_KEY = "dzino_last_greeting_date";

// ~30 interesting facts about nature, space, history, science
const GENERAL_FACTS: string[] = [
  "Svetlo zo Slnka k nám cestuje asi 8 minút a 20 sekúnd.",
  "Chobotnice majú tri srdcia a modrú krv.",
  "Na Jupiteri prší diamanty.",
  "Med sa nikdy nepokazí — našli ho aj v egyptských hrobkách a bol stále jedlý.",
  "Ľudské telo obsahuje dosť železa na výrobu klinca dlhého 7 cm.",
  "Voda na Zemi je staršia ako Slnko.",
  "Banány sú mierne rádioaktívne.",
  "Srdce veľryby modrej je také veľké, že by cez jeho tepny mohol plávať malý žralok.",
  "Na Zemi je viac stromov ako hviezd v Mliečnej dráhe.",
  "Včely dokážu rozpoznať ľudské tváre.",
  "Saturn by plával na vode — jeho hustota je menšia ako hustota vody.",
  "Ľudský mozog spotrebuje asi 20% celkovej energie tela.",
  "Na Marse je najvyššia hora v slnečnej sústave — Olympus Mons, vysoká 22 km.",
  "Pavúky dokážu lietať pomocou elektrických polí vo vzduchu.",
  "Dažďové kvapky nie sú v tvare slzy — sú skôr ako malé hamburgerové žemle.",
  "Morské koníky sú jediné zvieratá, kde samec nosí mláďatá.",
  "Jedna čajová lyžička neutrónových hviezd váži asi 6 miliárd ton.",
  "Krokodíly nedokážu vyplaziť jazyk.",
  "Pluto je menšie ako Rusko.",
  "Mačky strávia spánkom asi 70% svojho života.",
  "Eiffelova veža je v lete o 15 cm vyššia kvôli rozpínaniu kovu.",
  "Delfíny spia s jedným okom otvoreným.",
  "V jednej čajovej lyžičke pôdy je viac organizmov ako ľudí na Zemi.",
  "Orol skalný vidí korisť zo vzdialenosti 3 km.",
  "Naša galaxia Mliečna dráha sa zrazí s Andromédou o asi 4,5 miliardy rokov.",
  "Ľudský nos dokáže rozlíšiť viac ako bilión rôznych vôní.",
  "Koaly spia až 22 hodín denne.",
  "Blesk je 5-krát horúcejší ako povrch Slnka.",
  "Amazonský prales produkuje asi 20% kyslíka na Zemi.",
  "Svetlo z najvzdialenejšej pozorovanej galaxie k nám letelo 13 miliárd rokov.",
];

// Animal-specific facts for users interested in animals
const ANIMAL_FACTS: string[] = [
  "Psy dokážu cítiť zmeny v ľudských emóciách cez pot.",
  "Slon je jediný cicavec, ktorý nedokáže skákať.",
  "Mačky majú viac kostí ako ľudia — 230 oproti 206.",
  "Kolibríky sú jediné vtáky, ktoré dokážu lietať dozadu.",
  "Leňochody sú také pomalé, že na ich srsti rastú riasy.",
  "Psy majú čuch 10 000 až 100 000-krát silnejší ako ľudia.",
  "Korytnačky dokážu dýchať cez zadok.",
  "Vrany si pamätajú ľudské tváre a dokážu mať aj pomstu.",
  "Mravce dokážu uniesť 50-násobok svojej vlastnej hmotnosti.",
  "Plameniaky sú ružové, pretože jedia ružové kôrovce.",
];

function getTimeOfDay(): "rano" | "poobede" | "vecer" {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "rano";
  if (hour >= 12 && hour < 18) return "poobede";
  return "vecer";
}

function getTimeGreeting(): string {
  const time = getTimeOfDay();
  switch (time) {
    case "rano":
      return "Dobré ráno";
    case "poobede":
      return "Dobré popoludnie";
    case "vecer":
      return "Dobrý večer";
  }
}

function getDaysSinceLastInteraction(): number {
  if (typeof window === "undefined") return 0;
  const data = getAvatarData();
  const last = new Date(data.lastInteraction);
  const now = new Date();
  return Math.floor(
    (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)
  );
}

function userInterestedInAnimals(): boolean {
  const zaujmy = getSoulFile("zaujmy");
  if (!zaujmy) return false;
  const lower = zaujmy.content.toLowerCase();
  return (
    lower.includes("zviera") ||
    lower.includes("pes") ||
    lower.includes("mačk") ||
    lower.includes("prír") ||
    lower.includes("animal") ||
    lower.includes("zvieratá") ||
    lower.includes("zvieratk")
  );
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getDailyGreeting(): string {
  if (typeof window === "undefined") return "";

  const greeting = getTimeGreeting();
  const daysSince = getDaysSinceLastInteraction();

  // Build the greeting parts
  const parts: string[] = [];

  // Time-based greeting
  parts.push(`${greeting}!`);

  // If user was away
  if (daysSince >= 3) {
    parts.push(
      `Hej, chýbal si mi! Nevideli sme sa ${daysSince} dní.`
    );
  } else if (daysSince >= 1) {
    parts.push("Rád ťa zase vidím!");
  }

  // Check for today's events
  const todayStr = new Date().toISOString().split("T")[0];
  const upcoming = getUpcomingEvents();
  const todayEvents = upcoming.filter((e) => e.date === todayStr);
  if (todayEvents.length > 0) {
    if (todayEvents.length === 1) {
      parts.push(
        `Dnes máš v pláne: ${todayEvents[0].title}.`
      );
    } else {
      parts.push(
        `Dnes máš ${todayEvents.length} udalosti v pláne!`
      );
    }
  }

  // Random interesting fact — prefer animal facts if user likes animals
  const useAnimal = userInterestedInAnimals() && Math.random() > 0.4;
  const fact = useAnimal
    ? pickRandom(ANIMAL_FACTS)
    : pickRandom(GENERAL_FACTS);
  parts.push(`Vedel si, že... ${fact}`);

  return parts.join(" ");
}

export function shouldShowGreeting(): boolean {
  if (typeof window === "undefined") return false;
  const today = new Date().toISOString().split("T")[0];
  const lastShown = localStorage.getItem(LAST_GREETING_KEY);
  return lastShown !== today;
}

export function markGreetingShown(): void {
  if (typeof window === "undefined") return;
  const today = new Date().toISOString().split("T")[0];
  localStorage.setItem(LAST_GREETING_KEY, today);
}
