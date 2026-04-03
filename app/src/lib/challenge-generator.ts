// Dynamic challenge generator — creates challenges based on user context
// Each day picks 3 challenges from 3 DIFFERENT life aspects

import type { DailyChallenge, ProofType } from "./challenges";
import { getGamification } from "./gamification";
import { getTodayMood } from "./mood-tracking";
import { getSoulFile } from "./soul";

// ---- Life Aspects ----
// Each challenge belongs to exactly one aspect
// Daily selection guarantees 3 different aspects

export type LifeAspect =
  | "physical"      // body movement, exercise, outdoor
  | "social"        // people, relationships, communication
  | "mental"        // mindfulness, meditation, reflection, emotions
  | "creative"      // art, music, writing, cooking
  | "intellectual"  // learning, reading, puzzles, curiosity
  | "planning"      // organization, goals, habits, productivity
  | "nature"        // outdoors, animals, plants, weather
  | "handcraft"     // building, fixing, making with hands
  | "gratitude"     // appreciation, kindness, giving
  | "adventure";    // new experiences, comfort zone, exploration

export const ASPECT_LABELS: Record<LifeAspect, { name: string; emoji: string }> = {
  physical:     { name: "Telo", emoji: "💪" },
  social:       { name: "Ľudia", emoji: "👥" },
  mental:       { name: "Myseľ", emoji: "🧠" },
  creative:     { name: "Tvorba", emoji: "🎨" },
  intellectual: { name: "Poznanie", emoji: "📚" },
  planning:     { name: "Plánovanie", emoji: "📋" },
  nature:       { name: "Príroda", emoji: "🌿" },
  handcraft:    { name: "Ruky", emoji: "🔨" },
  gratitude:    { name: "Vďačnosť", emoji: "🙏" },
  adventure:    { name: "Dobrodružstvo", emoji: "🗺️" },
};

// ---- Templates ----

interface ChallengeTemplate {
  id: string;
  text: string;
  aspect: LifeAspect;
  emoji: string;
  proofType: ProofType;
  proofHint: string;
  difficulty: number;
  moodMin?: number;
  tags: string[];
}

const T: ChallengeTemplate[] = [
  // ── PHYSICAL ──
  { id: "breath_3", text: "3 hlboké nádychy — teraz", aspect: "physical", emoji: "🫁", proofType: "text", proofHint: "Ako sa cítiš?", difficulty: 1, tags: [] },
  { id: "stretch_2", text: "Pretiahnite sa — 2 minúty", aspect: "physical", emoji: "🤸", proofType: "text", proofHint: "Čo si cvičil?", difficulty: 1, tags: [] },
  { id: "water_1", text: "Vypi pohár vody", aspect: "physical", emoji: "💧", proofType: "text", proofHint: "Hotovo?", difficulty: 1, tags: ["zdravie"] },
  { id: "walk_5", text: "Prejdi sa 5 minút vonku", aspect: "physical", emoji: "🚶", proofType: "text", proofHint: "Kam si šiel?", difficulty: 2, tags: ["pohyb"] },
  { id: "walk_15", text: "Choď na 15-minútovú prechádzku", aspect: "physical", emoji: "🚶", proofType: "text", proofHint: "Kam? Čo si videl?", difficulty: 4, tags: ["pohyb"] },
  { id: "stairs", text: "Choď schodmi namiesto výťahu", aspect: "physical", emoji: "🪜", proofType: "text", proofHint: "Koľko poschodí?", difficulty: 3, tags: ["pohyb"] },
  { id: "pushups_5", text: "Urob 5 kľukov alebo drepov", aspect: "physical", emoji: "💪", proofType: "text", proofHint: "Koľko si urobil?", difficulty: 4, tags: ["pohyb"] },
  { id: "walk_30", text: "30-minútová prechádzka bez telefónu", aspect: "physical", emoji: "🏃", proofType: "text", proofHint: "Čo si pozoroval?", difficulty: 7, moodMin: 3, tags: ["pohyb"] },
  { id: "cold_finish", text: "Posledných 30s sprchy studenou vodou", aspect: "physical", emoji: "🚿", proofType: "text", proofHint: "Ako to bolo?", difficulty: 9, moodMin: 4, tags: ["zdravie"] },

  // ── SOCIAL ──
  { id: "text_friend", text: "Napíš správu niekomu blízkemu", aspect: "social", emoji: "📱", proofType: "text", proofHint: "Komu?", difficulty: 1, tags: ["vzťahy"] },
  { id: "smile", text: "Usmej sa na niekoho", aspect: "social", emoji: "😊", proofType: "text", proofHint: "Ako reagoval?", difficulty: 2, tags: [] },
  { id: "thank_simple", text: "Poďakuj niekomu za niečo malé", aspect: "social", emoji: "🙏", proofType: "text", proofHint: "Za čo?", difficulty: 2, tags: ["vzťahy"] },
  { id: "call_friend", text: "Zavolaj priateľovi — hovor, nie správa", aspect: "social", emoji: "📞", proofType: "text", proofHint: "S kým?", difficulty: 5, tags: ["vzťahy"] },
  { id: "compliment", text: "Daj niekomu úprimný kompliment", aspect: "social", emoji: "💬", proofType: "text", proofHint: "Čo si povedal?", difficulty: 5, tags: [] },
  { id: "listen_5", text: "Počúvaj niekoho 5 min bez prerušenia", aspect: "social", emoji: "👂", proofType: "text", proofHint: "O čom hovoril?", difficulty: 5, tags: ["vzťahy"] },
  { id: "greet_stranger", text: "Pozdrav niekoho neznámeho", aspect: "social", emoji: "👋", proofType: "text", proofHint: "Ako reagoval?", difficulty: 7, moodMin: 3, tags: [] },
  { id: "deep_talk", text: "Opýtaj sa niekoho na niečo hlbšie", aspect: "social", emoji: "💭", proofType: "text", proofHint: "Na čo?", difficulty: 8, tags: ["vzťahy"] },

  // ── MENTAL ──
  { id: "pause_30s", text: "Zavrú oči na 30 sekúnd a dýchaj", aspect: "mental", emoji: "🧘", proofType: "text", proofHint: "Čo si cítil?", difficulty: 1, tags: [] },
  { id: "name_feeling", text: "Pomenuj presne, ako sa teraz cítiš", aspect: "mental", emoji: "🎭", proofType: "text", proofHint: "Aký pocit?", difficulty: 2, tags: [] },
  { id: "journal", text: "Napíš Dzinovi, ako sa cítiš a prečo", aspect: "mental", emoji: "📝", proofType: "text", proofHint: "Ako sa cítiš?", difficulty: 3, tags: [] },
  { id: "reframe", text: "Vezmi niečo negatívne a nájdi v tom pozitívum", aspect: "mental", emoji: "🔄", proofType: "text", proofHint: "Čo si preráamoval?", difficulty: 5, moodMin: 2, tags: [] },
  { id: "meditation_5", text: "5 minút ticha — len dýchaj", aspect: "mental", emoji: "🧘", proofType: "text", proofHint: "Ako sa cítiš po?", difficulty: 5, tags: [] },
  { id: "no_phone_30", text: "Odlož telefón na 30 minút", aspect: "mental", emoji: "📵", proofType: "text", proofHint: "Čo si robil?", difficulty: 5, tags: [] },
  { id: "comfort_zone", text: "Urob dnes jednu vec, z ktorej máš strach", aspect: "mental", emoji: "🦁", proofType: "text", proofHint: "Čo to bolo?", difficulty: 9, moodMin: 4, tags: [] },

  // ── CREATIVE ──
  { id: "doodle", text: "Nakresli niečo za 1 minútu", aspect: "creative", emoji: "✏️", proofType: "either", proofHint: "Ofoť alebo popíš", difficulty: 1, tags: ["umenie"] },
  { id: "hum_song", text: "Zahundri si pesničku", aspect: "creative", emoji: "🎵", proofType: "text", proofHint: "Akú?", difficulty: 1, tags: ["hudba"] },
  { id: "haiku", text: "Napíš haiku (5-7-5 slabík)", aspect: "creative", emoji: "✍️", proofType: "text", proofHint: "Napíš ho sem", difficulty: 5, tags: ["písanie"] },
  { id: "draw_10", text: "Nakresli niečo — venuj tomu 10 minút", aspect: "creative", emoji: "🎨", proofType: "photo", proofHint: "Ofoť kresbu", difficulty: 5, tags: ["umenie"] },
  { id: "photo_art", text: "Ofoť niečo krásne okolo seba", aspect: "creative", emoji: "📸", proofType: "photo", proofHint: "Ofoť to", difficulty: 3, tags: ["foto"] },
  { id: "short_story", text: "Napíš príbeh v 3 vetách", aspect: "creative", emoji: "📖", proofType: "text", proofHint: "Napíš ho", difficulty: 5, tags: ["písanie"] },

  // ── INTELLECTUAL ──
  { id: "new_word", text: "Nauč sa jedno nové slovo", aspect: "intellectual", emoji: "📚", proofType: "text", proofHint: "Aké slovo?", difficulty: 2, tags: ["vzdelanie"] },
  { id: "fact_search", text: "Vyhľadaj odpoveď na niečo, čo ťa zaujíma", aspect: "intellectual", emoji: "🔍", proofType: "text", proofHint: "Čo si zistil?", difficulty: 3, tags: ["vzdelanie"] },
  { id: "read_10", text: "Prečítaj 10 strán knihy", aspect: "intellectual", emoji: "📖", proofType: "text", proofHint: "Čo si čítal?", difficulty: 4, tags: ["čítanie"] },
  { id: "ted_talk", text: "Pozri si jednu zaujímavú prednášku", aspect: "intellectual", emoji: "🎤", proofType: "text", proofHint: "O čom bola?", difficulty: 5, tags: ["vzdelanie"] },
  { id: "teach_someone", text: "Vysvetli niekomu niečo, čo vieš", aspect: "intellectual", emoji: "🎓", proofType: "text", proofHint: "Čo si vysvetlil a komu?", difficulty: 6, tags: [] },

  // ── PLANNING ──
  { id: "todo_1", text: "Napíš jednu vec, ktorú dnes chceš stihnúť", aspect: "planning", emoji: "📋", proofType: "text", proofHint: "Čo?", difficulty: 1, tags: [] },
  { id: "tidy_desk", text: "Uprac jedno miesto — stôl, zásuvku, policu", aspect: "planning", emoji: "🧹", proofType: "either", proofHint: "Čo si upratoval?", difficulty: 3, tags: [] },
  { id: "plan_tomorrow", text: "Naplánuj si zajtrajšok — 3 hlavné veci", aspect: "planning", emoji: "📅", proofType: "text", proofHint: "Aký je plán?", difficulty: 3, tags: [] },
  { id: "review_week", text: "Zhrň si tento týždeň — čo sa podarilo?", aspect: "planning", emoji: "📊", proofType: "text", proofHint: "Čo sa podarilo?", difficulty: 5, tags: [] },
  { id: "goal_step", text: "Urob jeden krok k svojmu cieľu", aspect: "planning", emoji: "🎯", proofType: "text", proofHint: "Čo si urobil?", difficulty: 5, tags: [] },

  // ── NATURE ──
  { id: "look_window", text: "Pozri sa von oknom — čo vidíš?", aspect: "nature", emoji: "🪟", proofType: "text", proofHint: "Čo vidíš?", difficulty: 1, tags: ["príroda"] },
  { id: "sky_check", text: "Aká je dnes obloha?", aspect: "nature", emoji: "☁️", proofType: "either", proofHint: "Popíš alebo ofoť", difficulty: 2, tags: ["príroda"] },
  { id: "count_birds", text: "Spočítaj vtáky, ktoré dnes uvidíš", aspect: "nature", emoji: "🐦", proofType: "text", proofHint: "Koľko?", difficulty: 3, tags: ["príroda"] },
  { id: "find_plant", text: "Nájdi rastlinu vo svojom okolí", aspect: "nature", emoji: "🌸", proofType: "either", proofHint: "Akú?", difficulty: 3, tags: ["príroda"] },
  { id: "sunset", text: "Pozri si západ slnka", aspect: "nature", emoji: "🌅", proofType: "photo", proofHint: "Ofoť", difficulty: 6, moodMin: 3, tags: ["príroda"] },
  { id: "rain_listen", text: "Ak prší — stoj a počúvaj dážď 2 min", aspect: "nature", emoji: "🌧️", proofType: "text", proofHint: "Aký bol pocit?", difficulty: 4, tags: ["príroda"] },

  // ── HANDCRAFT ──
  { id: "fix_thing", text: "Oprav niečo malé doma", aspect: "handcraft", emoji: "🔧", proofType: "text", proofHint: "Čo si opravil?", difficulty: 4, tags: [] },
  { id: "origami", text: "Zlož niečo z papiera", aspect: "handcraft", emoji: "📄", proofType: "either", proofHint: "Čo si zložil?", difficulty: 3, tags: [] },
  { id: "cook_new", text: "Uvar niečo, čo si ešte nevaril", aspect: "handcraft", emoji: "🍳", proofType: "either", proofHint: "Čo si uvaril?", difficulty: 5, tags: ["varenie"] },
  { id: "build_lego", text: "Postav niečo — z lega, kociek, čohokoľvek", aspect: "handcraft", emoji: "🧱", proofType: "either", proofHint: "Čo si postavil?", difficulty: 4, tags: [] },
  { id: "plant_care", text: "Polej rastlinu alebo zasaď semienky", aspect: "handcraft", emoji: "🌱", proofType: "text", proofHint: "Čo si urobil?", difficulty: 2, tags: ["príroda"] },

  // ── GRATITUDE ──
  { id: "grateful_1", text: "Povedz jednu vec, za ktorú si vďačný", aspect: "gratitude", emoji: "✨", proofType: "text", proofHint: "Za čo?", difficulty: 1, tags: [] },
  { id: "grateful_3", text: "Napíš 3 veci, za ktoré si dnes vďačný", aspect: "gratitude", emoji: "✨", proofType: "text", proofHint: "Za čo?", difficulty: 3, tags: [] },
  { id: "send_thanks", text: "Pošli niekomu ďakovnú správu", aspect: "gratitude", emoji: "💌", proofType: "text", proofHint: "Komu a za čo?", difficulty: 4, tags: ["vzťahy"] },
  { id: "kind_act", text: "Urob jeden drobný dobrý skutok", aspect: "gratitude", emoji: "❤️", proofType: "text", proofHint: "Čo si urobil?", difficulty: 4, tags: [] },
  { id: "appreciate", text: "Povedz niekomu, čo si na ňom ceníš", aspect: "gratitude", emoji: "💎", proofType: "text", proofHint: "Čo si povedal?", difficulty: 6, tags: ["vzťahy"] },

  // ── ADVENTURE ──
  { id: "new_food", text: "Ochutnaj niečo nové", aspect: "adventure", emoji: "🍜", proofType: "text", proofHint: "Čo si ochutnal?", difficulty: 3, tags: [] },
  { id: "new_route", text: "Choď domov inou cestou", aspect: "adventure", emoji: "🗺️", proofType: "text", proofHint: "Kadiaľ?", difficulty: 4, tags: [] },
  { id: "try_new", text: "Vyskúšaj niečo prvýkrát v živote", aspect: "adventure", emoji: "🆕", proofType: "text", proofHint: "Čo?", difficulty: 6, moodMin: 3, tags: [] },
  { id: "new_place", text: "Navštív miesto, kde si ešte nebol", aspect: "adventure", emoji: "📍", proofType: "either", proofHint: "Kde?", difficulty: 7, moodMin: 3, tags: [] },
  { id: "talk_stranger", text: "Začni rozhovor s niekým neznámym", aspect: "adventure", emoji: "🎲", proofType: "text", proofHint: "O čom ste hovorili?", difficulty: 9, moodMin: 4, tags: [] },
];

// ---- Generator ----

const ALL_ASPECTS: LifeAspect[] = [
  "physical", "social", "mental", "creative", "intellectual",
  "planning", "nature", "handcraft", "gratitude", "adventure",
];

function getDifficultyRange(level: number): [number, number] {
  const min = Math.min(5, Math.max(1, Math.floor(level / 3)));
  const max = Math.min(10, min + 4);
  return [min, max];
}

function seededRandom(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return () => {
    hash = (hash * 1103515245 + 12345) | 0;
    return ((hash >>> 16) & 0x7fff) / 0x7fff;
  };
}

export function generateDailyChallenges(date: string): DailyChallenge[] {
  const rng = seededRandom(date);
  const gamification = getGamification();
  const mood = getTodayMood();
  const moodValue = mood?.mood ?? 3;
  const level = gamification.level;
  const [minDiff, maxDiff] = getDifficultyRange(level);

  // Get user interests
  const zaujmy = getSoulFile("zaujmy")?.content?.toLowerCase() || "";
  const interestTags: string[] = [];
  if (zaujmy.includes("príroda") || zaujmy.includes("nature")) interestTags.push("príroda");
  if (zaujmy.includes("foto") || zaujmy.includes("photo")) interestTags.push("foto");
  if (zaujmy.includes("šport") || zaujmy.includes("beh") || zaujmy.includes("pohyb")) interestTags.push("pohyb");
  if (zaujmy.includes("hudba") || zaujmy.includes("music")) interestTags.push("hudba");
  if (zaujmy.includes("varenie") || zaujmy.includes("cook")) interestTags.push("varenie");
  if (zaujmy.includes("kresli") || zaujmy.includes("umenie")) interestTags.push("umenie");
  if (zaujmy.includes("písa") || zaujmy.includes("writ")) interestTags.push("písanie");
  if (zaujmy.includes("čít") || zaujmy.includes("knih") || zaujmy.includes("read")) interestTags.push("čítanie");

  // Filter templates
  const eligible = T.filter((t) => {
    if (t.difficulty < minDiff || t.difficulty > maxDiff) return false;
    if (t.moodMin && moodValue < t.moodMin) return false;
    if (moodValue <= 2 && t.difficulty > 4) return false;
    return true;
  });

  // Score by interest match
  const scored = eligible.map((t) => {
    let score = 1;
    for (const tag of t.tags) {
      if (interestTags.includes(tag)) score += 2;
    }
    return { template: t, score };
  });

  // Pick 3 DIFFERENT aspects randomly
  const shuffledAspects = [...ALL_ASPECTS];
  for (let i = shuffledAspects.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffledAspects[i], shuffledAspects[j]] = [shuffledAspects[j], shuffledAspects[i]];
  }

  function pickFromAspect(aspect: LifeAspect): ChallengeTemplate | null {
    const pool = scored.filter((s) => s.template.aspect === aspect);
    if (pool.length === 0) return null;
    const total = pool.reduce((s, p) => s + p.score, 0);
    let r = rng() * total;
    for (const p of pool) {
      r -= p.score;
      if (r <= 0) return p.template;
    }
    return pool[pool.length - 1].template;
  }

  // Try aspects in shuffled order until we have 3
  const picks: ChallengeTemplate[] = [];
  for (const aspect of shuffledAspects) {
    if (picks.length >= 3) break;
    const pick = pickFromAspect(aspect);
    if (pick) picks.push(pick);
  }

  // Fallback: if somehow less than 3, fill from any
  while (picks.length < 3 && scored.length > 0) {
    const idx = Math.floor(rng() * scored.length);
    picks.push(scored[idx].template);
  }

  return picks.map((t) => ({
    id: t.id,
    text: t.text,
    type: aspectToType(t.aspect),
    target: 1,
    progress: 0,
    completed: false,
    emoji: t.emoji,
    proofType: t.proofType,
    proofHint: t.proofHint,
  }));
}

// Map new aspects to the legacy DailyChallenge type field
function aspectToType(aspect: LifeAspect): DailyChallenge["type"] {
  switch (aspect) {
    case "physical": return "outdoor";
    case "social": return "social";
    case "mental": return "mindful";
    case "creative": return "creative";
    case "intellectual": return "creative";
    case "planning": return "mindful";
    case "nature": return "outdoor";
    case "handcraft": return "creative";
    case "gratitude": return "mindful";
    case "adventure": return "outdoor";
  }
}
