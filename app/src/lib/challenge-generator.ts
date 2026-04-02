// Dynamic challenge generator — creates challenges based on user context
// No hardcoded challenge pool — everything is generated from templates + brain

import type { DailyChallenge, ProofType } from "./challenges";
import { getGamification } from "./gamification";
import { getTodayMood } from "./mood-tracking";
import { getSoulFile } from "./soul";

// ---- Challenge Templates ----
// Templates have difficulty (1-10) and can use {variables}

interface ChallengeTemplate {
  id: string;
  text: string;
  type: DailyChallenge["type"];
  emoji: string;
  proofType: ProofType;
  proofHint: string;
  difficulty: number; // 1-10
  moodMin?: number;   // don't show if mood below this (1-5)
  tags: string[];     // for matching with interests
}

const TEMPLATES: ChallengeTemplate[] = [
  // ---- OUTDOOR (difficulty 1-10) ----
  // Easy (1-3)
  { id: "look_window", text: "Pozri sa von oknom a popíš, čo vidíš", type: "outdoor", emoji: "🪟", proofType: "text", proofHint: "Čo vidíš?", difficulty: 1, tags: ["príroda"] },
  { id: "step_outside", text: "Vyjdi na 2 minúty pred dom", type: "outdoor", emoji: "🚪", proofType: "text", proofHint: "Aké bolo počasie?", difficulty: 1, tags: ["príroda"] },
  { id: "deep_air", text: "Otvor okno a 5x sa hlboko nadýchni", type: "outdoor", emoji: "🌬️", proofType: "text", proofHint: "Ako sa cítiš?", difficulty: 1, tags: [] },
  { id: "walk_5", text: "Prejdi sa 5 minút vonku", type: "outdoor", emoji: "🚶", proofType: "text", proofHint: "Kam si šiel?", difficulty: 2, tags: ["pohyb"] },
  { id: "sky_check", text: "Pozri sa na oblohu — aká je dnes?", type: "outdoor", emoji: "☁️", proofType: "either", proofHint: "Ofoť ju alebo popíš", difficulty: 2, tags: ["príroda"] },
  // Medium (4-6)
  { id: "walk_15", text: "Choď na 15-minútovú prechádzku", type: "outdoor", emoji: "🚶", proofType: "text", proofHint: "Kam si šiel? Čo si videl?", difficulty: 4, tags: ["pohyb"] },
  { id: "new_route", text: "Choď domov inou cestou", type: "outdoor", emoji: "🗺️", proofType: "text", proofHint: "Kadiaľ si šiel?", difficulty: 5, tags: [] },
  { id: "nature_photo", text: "Ofoť niečo zaujímavé v prírode", type: "outdoor", emoji: "📸", proofType: "photo", proofHint: "Ofoť to", difficulty: 5, tags: ["príroda", "foto"] },
  { id: "observe_tree", text: "Nájdi strom, ktorý si nikdy nevšimol", type: "outdoor", emoji: "🌳", proofType: "either", proofHint: "Popíš alebo ofoť ho", difficulty: 5, tags: ["príroda"] },
  // Hard (7-10)
  { id: "walk_30", text: "Prejdi sa 30 minút bez telefónu", type: "outdoor", emoji: "🏃", proofType: "text", proofHint: "Čo si pozoroval?", difficulty: 7, tags: ["pohyb"] },
  { id: "new_place", text: "Navštív miesto, kde si ešte nebol", type: "outdoor", emoji: "🗺️", proofType: "either", proofHint: "Kde si bol?", difficulty: 8, tags: [] },
  { id: "sunrise", text: "Pozri si východ slnka", type: "outdoor", emoji: "🌅", proofType: "photo", proofHint: "Ofoť ten moment", difficulty: 9, moodMin: 3, tags: [] },

  // ---- SOCIAL (difficulty 1-10) ----
  // Easy (1-3)
  { id: "text_friend", text: "Napíš jednu správu niekomu blízkemu", type: "social", emoji: "📱", proofType: "text", proofHint: "Komu si napísal?", difficulty: 1, tags: ["vzťahy"] },
  { id: "smile", text: "Usmej sa na niekoho", type: "social", emoji: "😊", proofType: "text", proofHint: "Ako reagoval?", difficulty: 2, tags: [] },
  { id: "thank_simple", text: "Poďakuj niekomu za niečo malé", type: "social", emoji: "🙏", proofType: "text", proofHint: "Za čo si poďakoval?", difficulty: 2, tags: ["vzťahy"] },
  // Medium (4-6)
  { id: "call_friend", text: "Zavolaj priateľovi — nie správa, ale hovor", type: "social", emoji: "📞", proofType: "text", proofHint: "S kým si hovoril?", difficulty: 5, tags: ["vzťahy"] },
  { id: "compliment", text: "Daj niekomu úprimný kompliment", type: "social", emoji: "💬", proofType: "text", proofHint: "Čo si povedal?", difficulty: 5, tags: [] },
  { id: "listen_5", text: "Počúvaj niekoho 5 minút bez prerušenia", type: "social", emoji: "👂", proofType: "text", proofHint: "O čom hovoril?", difficulty: 5, tags: ["vzťahy"] },
  // Hard (7-10)
  { id: "greet_stranger", text: "Pozdrav niekoho neznámeho", type: "social", emoji: "👋", proofType: "text", proofHint: "Ako reagoval?", difficulty: 7, moodMin: 3, tags: [] },
  { id: "deep_talk", text: "Opýtaj sa niekoho blízkeho na niečo hlbšie", type: "social", emoji: "💭", proofType: "text", proofHint: "Na čo si sa pýtal?", difficulty: 8, tags: ["vzťahy"] },
  { id: "help_someone", text: "Ponúkni pomoc niekomu, kto to nečaká", type: "social", emoji: "🤝", proofType: "text", proofHint: "Komu a s čím?", difficulty: 8, tags: [] },

  // ---- MINDFUL (difficulty 1-10) ----
  // Easy (1-3)
  { id: "breath_3", text: "3 hlboké nádychy — teraz", type: "mindful", emoji: "🧘", proofType: "text", proofHint: "Ako sa cítiš?", difficulty: 1, tags: [] },
  { id: "water_1", text: "Vypi pohár vody", type: "mindful", emoji: "💧", proofType: "text", proofHint: "Hotovo?", difficulty: 1, tags: ["zdravie"] },
  { id: "gratitude_1", text: "Povedz jednu vec, za ktorú si vďačný", type: "mindful", emoji: "✨", proofType: "text", proofHint: "Za čo?", difficulty: 1, tags: [] },
  // Medium (4-6)
  { id: "breath_10", text: "10 hlbokých nádychov so zatvorenými očami", type: "mindful", emoji: "🧘", proofType: "text", proofHint: "Čo si cítil?", difficulty: 4, tags: [] },
  { id: "gratitude_3", text: "Napíš 3 veci, za ktoré si dnes vďačný", type: "mindful", emoji: "✨", proofType: "text", proofHint: "Za čo si vďačný?", difficulty: 4, tags: [] },
  { id: "no_phone_30", text: "Odlož telefón na 30 minút", type: "mindful", emoji: "📵", proofType: "text", proofHint: "Čo si robil?", difficulty: 5, tags: [] },
  { id: "journal", text: "Napíš Dzinovi, ako sa cítiš a prečo", type: "mindful", emoji: "📝", proofType: "text", proofHint: "Ako sa cítiš?", difficulty: 4, tags: [] },
  // Hard (7-10)
  { id: "no_phone_60", text: "Hodina bez telefónu — urob niečo rukami", type: "mindful", emoji: "📵", proofType: "text", proofHint: "Čo si robil?", difficulty: 7, moodMin: 3, tags: [] },
  { id: "cold_shower", text: "Posledných 30 sekúnd sprchy studenou vodou", type: "mindful", emoji: "🚿", proofType: "text", proofHint: "Ako to bolo?", difficulty: 9, moodMin: 4, tags: ["zdravie"] },

  // ---- CREATIVE (difficulty 1-10) ----
  // Easy (1-3)
  { id: "doodle", text: "Nakresli niečo za 1 minútu", type: "creative", emoji: "✏️", proofType: "either", proofHint: "Ofoť alebo popíš", difficulty: 1, tags: ["umenie"] },
  { id: "new_word", text: "Nauč sa jedno nové slovo", type: "creative", emoji: "📚", proofType: "text", proofHint: "Aké slovo?", difficulty: 2, tags: ["vzdelanie"] },
  // Medium (4-6)
  { id: "draw_10", text: "Nakresli niečo — venuj tomu 10 minút", type: "creative", emoji: "🎨", proofType: "photo", proofHint: "Ofoť kresbu", difficulty: 5, tags: ["umenie"] },
  { id: "cook_new", text: "Uvar niečo, čo si ešte nevaril", type: "creative", emoji: "🍳", proofType: "either", proofHint: "Čo si uvaril?", difficulty: 5, tags: ["varenie"] },
  { id: "haiku", text: "Napíš haiku (5-7-5 slabík)", type: "creative", emoji: "✍️", proofType: "text", proofHint: "Napíš ho sem", difficulty: 5, tags: ["písanie"] },
  // Hard (7-10)
  { id: "song", text: "Vymysli refrén pesničky", type: "creative", emoji: "🎵", proofType: "text", proofHint: "Aký refrén?", difficulty: 8, moodMin: 3, tags: ["hudba"] },

  // ---- CHAT (always easy, drives engagement) ----
  { id: "tell_day", text: "Povedz Dzinovi o svojom dni", type: "chat", emoji: "💭", proofType: "text", proofHint: "Aký bol deň?", difficulty: 1, tags: [] },
  { id: "ask_advice", text: "Opýtaj sa Dzina na radu", type: "chat", emoji: "🤔", proofType: "text", proofHint: "Na čo?", difficulty: 2, tags: [] },
  { id: "share_dream", text: "Povedz Dzinovi o svojom sne", type: "chat", emoji: "💫", proofType: "text", proofHint: "Aký sen?", difficulty: 3, tags: [] },
];

// ---- Generator ----

function getDifficultyRange(level: number): [number, number] {
  // Level 1: difficulty 1-3
  // Level 5: difficulty 2-6
  // Level 10: difficulty 4-8
  // Level 20+: difficulty 5-10
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

  // Get user interests for matching
  const zaujmy = getSoulFile("zaujmy")?.content?.toLowerCase() || "";
  const interestTags: string[] = [];
  if (zaujmy.includes("príroda") || zaujmy.includes("nature")) interestTags.push("príroda");
  if (zaujmy.includes("foto") || zaujmy.includes("photo")) interestTags.push("foto");
  if (zaujmy.includes("šport") || zaujmy.includes("beh") || zaujmy.includes("pohyb")) interestTags.push("pohyb");
  if (zaujmy.includes("hudba") || zaujmy.includes("music")) interestTags.push("hudba");
  if (zaujmy.includes("varenie") || zaujmy.includes("cook")) interestTags.push("varenie");
  if (zaujmy.includes("kresli") || zaujmy.includes("umenie") || zaujmy.includes("art")) interestTags.push("umenie");
  if (zaujmy.includes("písa") || zaujmy.includes("writ")) interestTags.push("písanie");

  // Filter templates by difficulty + mood
  const eligible = TEMPLATES.filter((t) => {
    if (t.difficulty < minDiff || t.difficulty > maxDiff) return false;
    if (t.moodMin && moodValue < t.moodMin) return false;
    // If sad (1-2), exclude hard challenges
    if (moodValue <= 2 && t.difficulty > 4) return false;
    return true;
  });

  // Score templates by interest match
  const scored = eligible.map((t) => {
    let score = 1;
    for (const tag of t.tags) {
      if (interestTags.includes(tag)) score += 2;
    }
    return { template: t, score };
  });

  // Pick 3: 1 outdoor/social + 1 mindful/creative + 1 chat
  function pickWeighted(pool: typeof scored): ChallengeTemplate {
    const total = pool.reduce((s, p) => s + p.score, 0);
    let r = rng() * total;
    for (const p of pool) {
      r -= p.score;
      if (r <= 0) return p.template;
    }
    return pool[pool.length - 1].template;
  }

  const outdoorSocial = scored.filter((s) => s.template.type === "outdoor" || s.template.type === "social");
  const mindfulCreative = scored.filter((s) => s.template.type === "mindful" || s.template.type === "creative");
  const chat = scored.filter((s) => s.template.type === "chat");

  // Fallbacks in case pools are empty
  const pick1 = outdoorSocial.length > 0 ? pickWeighted(outdoorSocial) : pickWeighted(scored);
  const pick2 = mindfulCreative.length > 0 ? pickWeighted(mindfulCreative) : pickWeighted(scored);
  const pick3 = chat.length > 0 ? pickWeighted(chat) : pickWeighted(scored);

  return [pick1, pick2, pick3].map((t) => ({
    id: t.id,
    text: t.text,
    type: t.type,
    target: 1,
    progress: 0,
    completed: false,
    emoji: t.emoji,
    proofType: t.proofType,
    proofHint: t.proofHint,
  }));
}
