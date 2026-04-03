// Dzino's internal logic — the "brain" that guides behavior
// This is NOT the chat system prompt — it's the reasoning layer
// that makes decisions about challenges, soul updates, and proactive actions.

import { getSoulFile, getSoulFiles } from "./soul";
import type { DailyChallenge } from "./challenges";

// ---- User Profile Analysis ----

export interface UserProfile {
  // Personality traits (derived from soul files)
  isIntrovert: boolean;
  isShy: boolean;
  isCreative: boolean;
  isActive: boolean;
  isOrganized: boolean;
  isMorningPerson: boolean;

  // Life situation
  hasKids: boolean;
  hasPartner: boolean;
  isStudent: boolean;
  isWorking: boolean;

  // Interests (top tags)
  interests: string[];

  // Goals
  goals: string[];

  // Weaknesses to work on
  growthAreas: string[];

  // How full is the soul? (0-100)
  soulCompleteness: number;
}

const INTROVERT_SIGNALS = [
  "introvert", "tichý", "samotár", "nerád", "spoločnosť", "sám",
  "ticho", "kľud", "knižka", "čítanie", "doma",
];

const EXTROVERT_SIGNALS = [
  "extrovert", "spoločenský", "ľudia", "párty", "kamaráti",
  "von", "akcia", "zábava", "skupina",
];

const SHY_SIGNALS = [
  "hanblivý", "shy", "nervózny", "bojím", "neistý", "anxiety",
  "stres", "strach", "nechcem", "nepohodlné",
];

const CREATIVE_SIGNALS = [
  "kreslím", "maľujem", "fotím", "hudba", "gitara", "klavír",
  "píšem", "tvorím", "dizajn", "umenie", "kreatív",
];

const ACTIVE_SIGNALS = [
  "behám", "šport", "fitnes", "bicykel", "plávanie", "turistika",
  "joga", "cvičím", "aktívn", "chôdza", "beh",
];

const MORNING_SIGNALS = [
  "ráno", "ranné", "vstávam skoro", "ranný", "východ slnka",
];

const EVENING_SIGNALS = [
  "nočná sova", "večer", "neskoro", "noc", "polnoc",
];

function contentContainsAny(content: string, signals: string[]): boolean {
  const lower = content.toLowerCase();
  return signals.some((s) => lower.includes(s));
}

function countSignals(content: string, signals: string[]): number {
  const lower = content.toLowerCase();
  return signals.filter((s) => lower.includes(s)).length;
}

export function analyzeUserProfile(): UserProfile {
  const files = getSoulFiles();
  const allContent = files.map((f) => f.content).join("\n");

  const osobnost = getSoulFile("osobnost")?.content || "";
  const zaujmy = getSoulFile("zaujmy")?.content || "";
  const vztahy = getSoulFile("vztahy")?.content || "";
  const ciele = getSoulFile("ciele")?.content || "";
  const praca = getSoulFile("praca")?.content || "";
  const preferencie = getSoulFile("preferencie")?.content || "";

  // Personality analysis
  const introvertScore = countSignals(osobnost + preferencie, INTROVERT_SIGNALS);
  const extrovertScore = countSignals(osobnost + preferencie, EXTROVERT_SIGNALS);
  const isIntrovert = introvertScore > extrovertScore;
  const isShy = contentContainsAny(allContent, SHY_SIGNALS);
  const isCreative = contentContainsAny(zaujmy + osobnost, CREATIVE_SIGNALS);
  const isActive = contentContainsAny(zaujmy + osobnost, ACTIVE_SIGNALS);
  const isMorningPerson =
    countSignals(preferencie, MORNING_SIGNALS) > countSignals(preferencie, EVENING_SIGNALS);

  // Life situation
  const hasKids = contentContainsAny(vztahy, ["dieťa", "syn", "dcéra", "deti", "bábätko"]);
  const hasPartner = contentContainsAny(vztahy, ["partner", "manžel", "manželka", "priateľ", "priateľka"]);
  const isStudent = contentContainsAny(praca, ["študent", "škola", "univerzita", "študujem"]);
  const isWorking = contentContainsAny(praca, ["práca", "firma", "živnostník", "zamestnan"]);

  // Extract interests as keywords from záujmy
  const interests = zaujmy
    .split("\n")
    .filter((l) => l.trim().startsWith("- "))
    .map((l) => l.replace(/^-\s*/, "").trim())
    .filter((l) => l.length > 0)
    .slice(0, 10);

  // Extract goals
  const goals = ciele
    .split("\n")
    .filter((l) => l.trim().startsWith("- "))
    .map((l) => l.replace(/^-\s*/, "").trim())
    .filter((l) => l.length > 0)
    .slice(0, 5);

  // Determine growth areas based on what's missing or weak
  const growthAreas: string[] = [];
  if (isShy || isIntrovert) growthAreas.push("social");
  if (!isActive) growthAreas.push("physical");
  if (!isCreative) growthAreas.push("creative");
  if (!isOrganized(allContent)) growthAreas.push("organization");
  if (contentContainsAny(allContent, ["stres", "anxiety", "nervózny"])) growthAreas.push("mindfulness");

  // Soul completeness
  const filledFiles = files.filter((f) => {
    const bullets = f.content.split("\n").filter((l) => l.trim().startsWith("- ")).length;
    return bullets >= 3;
  });
  const soulCompleteness = Math.round((filledFiles.length / files.length) * 100);

  return {
    isIntrovert,
    isShy,
    isCreative,
    isActive,
    isOrganized: isOrganized(allContent),
    isMorningPerson,
    hasKids,
    hasPartner,
    isStudent,
    isWorking,
    interests,
    goals,
    growthAreas,
    soulCompleteness,
  };
}

function isOrganized(content: string): boolean {
  return contentContainsAny(content, ["organizovaný", "plánujem", "poriadok", "systém", "rutina"]);
}

// ---- Challenge Selection Logic ----

export interface ChallengeWeight {
  challengeId: string;
  weight: number; // higher = more likely to be picked
  reason: string;
}

export function weightChallenges(
  challenges: Omit<DailyChallenge, "progress" | "completed">[],
  profile: UserProfile
): ChallengeWeight[] {
  return challenges.map((ch) => {
    let weight = 1.0;
    let reason = "default";

    // Boost challenges that target growth areas
    if (profile.growthAreas.includes("social") && ch.type === "social") {
      weight += 2.0;
      reason = "growth: social skills";
    }
    if (profile.growthAreas.includes("physical") && ch.type === "outdoor") {
      weight += 2.0;
      reason = "growth: physical activity";
    }
    if (profile.growthAreas.includes("creative") && ch.type === "creative") {
      weight += 2.0;
      reason = "growth: creativity";
    }
    if (profile.growthAreas.includes("mindfulness") && ch.type === "mindful") {
      weight += 2.0;
      reason = "growth: mindfulness";
    }

    // Boost challenges related to interests
    const chLower = ch.text.toLowerCase();
    for (const interest of profile.interests) {
      if (chLower.includes(interest.toLowerCase().slice(0, 5))) {
        weight += 1.5;
        reason = `matches interest: ${interest}`;
        break;
      }
    }

    // Slightly boost for shy people: social challenges (push comfort zone, but gently)
    if (profile.isShy && ch.type === "social") {
      weight += 1.0;
      reason = "gentle push: social confidence";
    }

    // For active people, make outdoor challenges more varied (they already go out)
    if (profile.isActive && ch.type === "outdoor") {
      // Reduce weight of basic walks, increase nature/observation
      if (ch.id === "walk_15") weight -= 0.5;
      if (ch.id === "observe_tree" || ch.id === "count_birds") weight += 1.0;
    }

    // For parents, family-related challenges
    if (profile.hasKids && ch.id === "family_story") {
      weight += 1.5;
      reason = "has kids: family bonding";
    }

    // Morning person gets morning challenges, night owl gets evening ones
    if (profile.isMorningPerson && ch.id === "sunrise_sunset") {
      weight += 1.0;
    }

    // If soul is incomplete, boost chat challenges (to fill more data)
    if (profile.soulCompleteness < 50 && ch.type === "chat") {
      weight += 1.5;
      reason = "soul incomplete: gather more info";
    }

    return { challengeId: ch.id, weight: Math.max(0.1, weight), reason };
  });
}

// ---- Proactive Dzino Actions ----
// These are internal "skills" that guide what Dzino does beyond just responding

export interface ProactiveAction {
  type: "suggest_challenge" | "ask_question" | "diary_entry" | "mood_check" | "celebrate";
  message: string;
  priority: number; // 0-10
}

export function getProactiveActions(profile: UserProfile): ProactiveAction[] {
  const actions: ProactiveAction[] = [];
  const now = new Date();
  const hour = now.getHours();

  // Morning greeting with mood check
  if (hour >= 7 && hour <= 10) {
    actions.push({
      type: "mood_check",
      message: "Dobré ráno! Ako sa dnes cítiš?",
      priority: 8,
    });
  }

  // Evening reflection
  if (hour >= 20 && hour <= 22) {
    actions.push({
      type: "diary_entry",
      message: "Aký bol tvoj deň? Čo bolo najlepšie?",
      priority: 7,
    });
  }

  // If shy, encourage social interaction
  if (profile.isShy) {
    actions.push({
      type: "suggest_challenge",
      message: "Viem, že to nie je vždy ľahké, ale čo keby si dnes niekomu len povedal 'ahoj'?",
      priority: 5,
    });
  }

  // If soul is very incomplete, ask questions
  if (profile.soulCompleteness < 30) {
    actions.push({
      type: "ask_question",
      message: "Ešte ťa veľmi nepoznám. Povedz mi — čo ťa v živote najviac baví?",
      priority: 9,
    });
  }

  // Celebrate milestones
  if (profile.interests.length >= 5) {
    actions.push({
      type: "celebrate",
      message: "Už viem o 5 tvojich záujmoch! Rastieme spolu. 🎉",
      priority: 3,
    });
  }

  // If not active, suggest movement
  if (profile.growthAreas.includes("physical")) {
    actions.push({
      type: "suggest_challenge",
      message: "Čo keby sme dnes skúsili krátku prechádzku? Len 10 minút.",
      priority: 6,
    });
  }

  return actions.sort((a, b) => b.priority - a.priority);
}
