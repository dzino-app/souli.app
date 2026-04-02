export interface DailyChallenge {
  id: string;
  text: string;
  type: "outdoor" | "social" | "mindful" | "creative" | "chat";
  target: number;
  progress: number;
  completed: boolean;
  emoji: string;
}

const STORAGE_KEY_PREFIX = "dzino_challenges_";

const CHALLENGE_POOL: Omit<DailyChallenge, "progress" | "completed">[] = [
  // Outdoor / nature
  { id: "walk_15", text: "Choď na 15-minútovú prechádzku", type: "outdoor", target: 1, emoji: "🚶" },
  { id: "observe_tree", text: "Nájdi strom, ktorý si nikdy nevšimol", type: "outdoor", target: 1, emoji: "🌳" },
  { id: "photo_sky", text: "Ofoť dnešnú oblohu a povedz Dzinovi, čo vidíš", type: "outdoor", target: 1, emoji: "🌤️" },
  { id: "new_route", text: "Choď domov inou cestou ako zvyčajne", type: "outdoor", target: 1, emoji: "🗺️" },
  { id: "sit_outside", text: "Seď 5 minút vonku bez telefónu", type: "outdoor", target: 1, emoji: "🪑" },
  { id: "count_birds", text: "Spočítaj vtáky, ktoré dnes uvidíš", type: "outdoor", target: 1, emoji: "🐦" },
  { id: "find_flower", text: "Nájdi kvet alebo rastlinu vo svojom okolí", type: "outdoor", target: 1, emoji: "🌸" },
  { id: "sunrise_sunset", text: "Pozri si dnes východ alebo západ slnka", type: "outdoor", target: 1, emoji: "🌅" },
  { id: "rain_walk", text: "Ak prší, vyjdi na 5 minút a počúvaj dážď", type: "outdoor", target: 1, emoji: "🌧️" },
  { id: "neighborhood", text: "Prejdi ulicu, na ktorej si ešte nebol", type: "outdoor", target: 1, emoji: "🏘️" },

  // Social / people
  { id: "greet_stranger", text: "Pozdrav niekoho, koho nepoznáš", type: "social", target: 1, emoji: "👋" },
  { id: "call_friend", text: "Zavolaj alebo napíš priateľovi", type: "social", target: 1, emoji: "📞" },
  { id: "compliment", text: "Daj niekomu úprimný kompliment", type: "social", target: 1, emoji: "💬" },
  { id: "ask_neighbor", text: "Opýtaj sa suseda, ako sa má", type: "social", target: 1, emoji: "🏠" },
  { id: "help_someone", text: "Pomôž dnes niekomu s niečím malým", type: "social", target: 1, emoji: "🤝" },
  { id: "family_story", text: "Opýtaj sa niekoho z rodiny na starý príbeh", type: "social", target: 1, emoji: "👨‍👩‍👧" },
  { id: "thank_someone", text: "Poďakuj niekomu, komu si dlho nepoďakoval", type: "social", target: 1, emoji: "🙏" },
  { id: "listen_deeply", text: "Počúvaj niekoho 5 minút bez prerušenia", type: "social", target: 1, emoji: "👂" },

  // Mindful / self-care
  { id: "deep_breath", text: "Urob 10 hlbokých nádychov", type: "mindful", target: 1, emoji: "🧘" },
  { id: "gratitude", text: "Povedz Dzinovi 3 veci, za ktoré si vďačný", type: "mindful", target: 1, emoji: "✨" },
  { id: "no_phone_hour", text: "Odlož telefón na 1 hodinu", type: "mindful", target: 1, emoji: "📵" },
  { id: "journal_feeling", text: "Napíš Dzinovi, ako sa cítiš a prečo", type: "mindful", target: 1, emoji: "📝" },
  { id: "drink_water", text: "Vypi 3 poháre vody", type: "mindful", target: 3, emoji: "💧" },
  { id: "stretch", text: "Rozcvič sa — 5 minút strečingu", type: "mindful", target: 1, emoji: "🤸" },
  { id: "tidy_space", text: "Uprac jedno miesto, kde bývaš", type: "mindful", target: 1, emoji: "🧹" },
  { id: "early_sleep", text: "Choď dnes spať o 30 minút skôr", type: "mindful", target: 1, emoji: "😴" },

  // Creative / fun
  { id: "draw_something", text: "Nakresli niečo — čokoľvek", type: "creative", target: 1, emoji: "🎨" },
  { id: "cook_new", text: "Uvar niečo, čo si ešte nevaril", type: "creative", target: 1, emoji: "🍳" },
  { id: "learn_word", text: "Nauč sa nové slovo v cudzom jazyku", type: "creative", target: 1, emoji: "📚" },
  { id: "sing_song", text: "Zaspieval si dnes pesničku?", type: "creative", target: 1, emoji: "🎵" },
  { id: "write_poem", text: "Napíš krátku básničku alebo haiku", type: "creative", target: 1, emoji: "✍️" },
  { id: "take_photo", text: "Ofoť niečo pekné a povedz Dzinovi prečo", type: "creative", target: 1, emoji: "📸" },
  { id: "try_new", text: "Vyskúšaj dnes niečo prvýkrát", type: "creative", target: 1, emoji: "🆕" },

  // Chat with Dzino (to keep the app habit)
  { id: "tell_day", text: "Povedz Dzinovi o svojom dni", type: "chat", target: 1, emoji: "💭" },
  { id: "ask_advice", text: "Opýtaj sa Dzina na radu", type: "chat", target: 1, emoji: "🤔" },
  { id: "share_dream", text: "Povedz Dzinovi o svojom sne alebo cieli", type: "chat", target: 1, emoji: "💫" },
];

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
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

// Pick 3 challenges: 1 outdoor/social + 1 mindful/creative + 1 chat
function generateChallenges(date: string): DailyChallenge[] {
  const rng = seededRandom(date);

  const outdoor = CHALLENGE_POOL.filter((c) => c.type === "outdoor" || c.type === "social");
  const mindful = CHALLENGE_POOL.filter((c) => c.type === "mindful" || c.type === "creative");
  const chat = CHALLENGE_POOL.filter((c) => c.type === "chat");

  function pickRandom<T>(arr: T[]): T {
    return arr[Math.floor(rng() * arr.length)];
  }

  return [
    { ...pickRandom(outdoor), progress: 0, completed: false },
    { ...pickRandom(mindful), progress: 0, completed: false },
    { ...pickRandom(chat), progress: 0, completed: false },
  ];
}

function getStorageKey(date?: string): string {
  return STORAGE_KEY_PREFIX + (date || getToday());
}

export function getDailyChallenges(): DailyChallenge[] {
  if (typeof window === "undefined") return [];
  const today = getToday();
  const key = getStorageKey(today);
  const raw = localStorage.getItem(key);

  if (raw) {
    return JSON.parse(raw);
  }

  const challenges = generateChallenges(today);
  localStorage.setItem(key, JSON.stringify(challenges));
  return challenges;
}

export function updateChallengeProgress(type: string): void {
  if (typeof window === "undefined") return;
  const today = getToday();
  const key = getStorageKey(today);
  const challenges = getDailyChallenges();

  for (const challenge of challenges) {
    if (challenge.type === type && !challenge.completed) {
      challenge.progress = Math.min(challenge.progress + 1, challenge.target);
      if (challenge.progress >= challenge.target) {
        challenge.completed = true;
      }
    }
  }

  localStorage.setItem(key, JSON.stringify(challenges));
}

// Mark a specific challenge as done by ID (for self-reported outdoor/social challenges)
export function completeChallengeById(id: string): void {
  if (typeof window === "undefined") return;
  const today = getToday();
  const key = getStorageKey(today);
  const challenges = getDailyChallenges();

  for (const challenge of challenges) {
    if (challenge.id === id && !challenge.completed) {
      challenge.progress = challenge.target;
      challenge.completed = true;
    }
  }

  localStorage.setItem(key, JSON.stringify(challenges));
}

export function areChallengesComplete(): boolean {
  const challenges = getDailyChallenges();
  return challenges.length > 0 && challenges.every((c) => c.completed);
}
