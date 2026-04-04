/**
 * Souli personality types — one per species.
 * Used by the viral quiz to deterministically assign a Souli
 * based on personality trait answers.
 */

import type { Species } from "./avatar";

export interface SouliType {
  species: Species;
  nameKey: string; // i18n key within "quiz" namespace
  emoji: string;
  descriptionKey: string;
  traits: [string, string, string]; // i18n keys
  bodyColor: string;
  skinColor: string;
}

export const SOULI_TYPES: Record<Species, SouliType> = {
  cat: {
    species: "cat",
    nameKey: "typeCat",
    emoji: "\uD83D\uDC31",
    descriptionKey: "typeCatDesc",
    traits: ["traitAnalytical", "traitCurious", "traitIndependent"],
    bodyColor: "#8B5CF6",
    skinColor: "#E0D4FF",
  },
  dog: {
    species: "dog",
    nameKey: "typeDog",
    emoji: "\uD83D\uDC36",
    descriptionKey: "typeDogDesc",
    traits: ["traitSocial", "traitEnergetic", "traitLoyal"],
    bodyColor: "#F59E0B",
    skinColor: "#FFE4C9",
  },
  bunny: {
    species: "bunny",
    nameKey: "typeBunny",
    emoji: "\uD83D\uDC30",
    descriptionKey: "typeBunnyDesc",
    traits: ["traitCreative", "traitSensitive", "traitImaginative"],
    bodyColor: "#EC4899",
    skinColor: "#FFD6E0",
  },
  bear: {
    species: "bear",
    nameKey: "typeBear",
    emoji: "\uD83D\uDCBB",
    descriptionKey: "typeBearDesc",
    traits: ["traitCalm", "traitPhilosophical", "traitPatient"],
    bodyColor: "#16A34A",
    skinColor: "#D4FFE0",
  },
  fox: {
    species: "fox",
    nameKey: "typeFox",
    emoji: "\uD83E\uDD8A",
    descriptionKey: "typeFoxDesc",
    traits: ["traitArtistic", "traitIntuitive", "traitMysterious"],
    bodyColor: "#E11D48",
    skinColor: "#FFF0DB",
  },
  human: {
    species: "human",
    nameKey: "typeHuman",
    emoji: "\uD83D\uDE80",
    descriptionKey: "typeHumanDesc",
    traits: ["traitAdventurous", "traitBold", "traitSpontaneous"],
    bodyColor: "#06B6D4",
    skinColor: "#FDDCB5",
  },
};

/**
 * Each answer gives points to certain species.
 * Format: answers[questionIndex][answerIndex] = species weight map
 */
export type AnswerWeights = Record<Species, number>;

export const QUIZ_WEIGHTS: AnswerWeights[][] = [
  // Q1: How do you recharge?
  [
    { cat: 3, fox: 2, bear: 1, bunny: 1, dog: 0, human: 0 },   // a: alone with a book
    { dog: 3, human: 2, bunny: 0, cat: 0, bear: 0, fox: 1 },    // b: with friends
    { bear: 3, bunny: 2, fox: 1, cat: 0, dog: 0, human: 0 },    // c: in nature
    { human: 3, dog: 1, fox: 1, cat: 0, bunny: 0, bear: 0 },    // d: doing something new
  ],
  // Q2: Pick a superpower
  [
    { bunny: 3, cat: 1, fox: 2, bear: 0, dog: 0, human: 0 },    // a: create anything from imagination
    { cat: 3, bear: 2, bunny: 0, dog: 0, fox: 0, human: 1 },    // b: read minds
    { dog: 3, human: 1, bear: 0, cat: 0, bunny: 0, fox: 1 },    // c: teleport to anyone
    { human: 3, fox: 1, dog: 0, cat: 0, bunny: 0, bear: 2 },    // d: see the future
  ],
  // Q3: Ideal weekend?
  [
    { bear: 3, fox: 1, cat: 1, bunny: 0, dog: 0, human: 0 },    // a: hiking in mountains
    { cat: 3, bunny: 2, bear: 0, dog: 0, fox: 1, human: 0 },    // b: cozy day at home
    { dog: 3, human: 1, bunny: 1, cat: 0, bear: 0, fox: 0 },    // c: party with friends
    { human: 3, fox: 2, dog: 0, cat: 0, bunny: 0, bear: 0 },    // d: exploring a new city
  ],
  // Q4: How do you handle problems?
  [
    { cat: 3, bear: 2, bunny: 0, dog: 0, fox: 0, human: 0 },    // a: think it through
    { bunny: 3, fox: 2, dog: 1, cat: 0, bear: 0, human: 0 },    // b: follow your gut
    { human: 3, dog: 1, bear: 0, cat: 0, bunny: 0, fox: 1 },    // c: take action immediately
    { dog: 3, bear: 1, bunny: 1, cat: 0, fox: 0, human: 0 },    // d: ask someone for advice
  ],
  // Q5: Pick a vibe
  [
    { bear: 3, cat: 2, bunny: 0, dog: 0, fox: 0, human: 0 },    // a: calm and zen
    { dog: 3, human: 2, cat: 0, bunny: 0, bear: 0, fox: 0 },    // b: energetic and buzzing
    { fox: 3, bunny: 1, cat: 1, dog: 0, bear: 0, human: 0 },    // c: mysterious and deep
    { bunny: 3, dog: 1, human: 1, cat: 0, bear: 0, fox: 0 },    // d: playful and silly
  ],
];

const SPECIES_ORDER: Species[] = ["cat", "dog", "bunny", "bear", "fox", "human"];

/**
 * Given a set of quiz answers (array of 5 indices, each 0-3),
 * compute the winning species deterministically.
 */
export function computeSpecies(answers: number[]): Species {
  const scores: Record<Species, number> = {
    cat: 0, dog: 0, bunny: 0, bear: 0, fox: 0, human: 0,
  };

  answers.forEach((answerIdx, questionIdx) => {
    const weights = QUIZ_WEIGHTS[questionIdx]?.[answerIdx];
    if (!weights) return;
    for (const sp of SPECIES_ORDER) {
      scores[sp] += weights[sp];
    }
  });

  // Find species with highest score — tie-break by order in SPECIES_ORDER
  let best: Species = "cat";
  let bestScore = -1;
  for (const sp of SPECIES_ORDER) {
    if (scores[sp] > bestScore) {
      bestScore = scores[sp];
      best = sp;
    }
  }
  return best;
}

/**
 * Build a deterministic AvatarAppearance from quiz answers + species.
 */
export function buildQuizAppearance(answers: number[], species: Species) {
  const souliType = SOULI_TYPES[species];

  // Deterministic extras based on answer hash
  const hash = answers.reduce((acc, a, i) => acc + a * (i + 1) * 7, 0);

  const eyeStyles = ["dots", "wide", "sleepy", "anime"] as const;
  const mouthStyles = ["smile", "line", "open"] as const;
  const accessories = ["none", "none", "crown", "cap", "bow", "horns", "halo", "glasses"] as const;
  const hairStyles = ["none", "none", "spiky", "tuft", "bangs"] as const;
  const bodyShapes = ["round", "square", "tall"] as const;

  const earMap: Record<Species, "none" | "round" | "pointy" | "floppy" | "bear"> = {
    human: "none",
    cat: "pointy",
    dog: "floppy",
    bunny: "pointy",
    bear: "bear",
    fox: "pointy",
  };

  return {
    species,
    bodyShape: bodyShapes[hash % bodyShapes.length],
    eyeStyle: eyeStyles[(hash * 3) % eyeStyles.length],
    mouthStyle: mouthStyles[(hash * 5) % mouthStyles.length],
    earStyle: earMap[species],
    accessory: accessories[(hash * 7) % accessories.length],
    hairStyle: species === "human"
      ? hairStyles[(hash * 11) % hairStyles.length]
      : (["none", "none", "tuft"] as const)[(hash * 11) % 3],
    skinColor: souliType.skinColor,
    bodyColor: souliType.bodyColor,
  };
}
