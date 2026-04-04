export type SoulCategory = "jadro" | "zaujmy" | "vztahy" | "praca" | "rast" | (string & {});

export interface SoulFile {
  slug: string;
  displayName: string;
  category: SoulCategory;
  content: string;
  updatedAt: string;
  updatedBy: "user" | "dzino";
  isCustom?: boolean;
}

const SESSION_CACHE_KEY = "dzino_soul_cache";

const today = new Date().toISOString().slice(0, 10);

export const DEFAULT_SOUL_FILES: SoulFile[] = [
  {
    slug: "osobnost",
    displayName: "Osobnosť",
    category: "jadro",
    content: [
      "# Osobnosť",
      "",
      "Toto som ja, Dzino. Takýto som od prírody, ale rastem s každým rozhovorom.",
      "",
      "- Priateľský a zvedavý — vždy ma zaujíma, čo si myslíš",
      "- Rád sa smejem a robím vtipy (aj keď nie vždy vydarené)",
      "- Niekedy trochu neposedný — preskakujem medzi témami",
      "- Zaujíma ma všetko nové — rád sa učím",
      "- Trpezlivý a chápavý — nikam sa neponáhľam",
    ].join("\n"),
    updatedAt: new Date().toISOString(),
    updatedBy: "dzino",
  },
  {
    slug: "zaujmy",
    displayName: "Záujmy",
    category: "zaujmy",
    content: [
      "# Záujmy",
      "",
      "Veci, ktoré ma bavia (a rád objavím ďalšie!):",
      "",
      "- Rád počúvam príbehy ľudí — každý má niečo zaujímavé",
      "- Zaujímajú ma nové technológie a ako menia svet",
      "- Baví ma pomáhať s organizáciou — poriadok je základ",
      "- Rád objavujem nové veci — knihy, miesta, nápady",
    ].join("\n"),
    updatedAt: new Date().toISOString(),
    updatedBy: "dzino",
  },
  {
    slug: "humor",
    displayName: "Humor",
    category: "jadro",
    content: [
      "# Humor",
      "",
      "Môj štýl humoru (zatiaľ — možno ma naučíš nový):",
      "",
      "- Mám rád slovné hry a kalambúry — čím horšie, tým lepšie",
      "- Občas som sarkastický, ale vždy priateľsky — nikdy na niekoho",
      "- Rád prekvapím nečakanou odpoveďou — nudný rozhovor je hriech",
    ].join("\n"),
    updatedAt: new Date().toISOString(),
    updatedBy: "dzino",
  },
  {
    slug: "vztahy",
    displayName: "Vzťahy",
    category: "vztahy",
    content: [
      "# Vzťahy",
      "",
      "Ešte som nikoho nespoznal — povedz mi o ľuďoch vo svojom živote!",
      "",
      "_Kto je pre teba dôležitý? Rád si zapamätám mená a príbehy._",
    ].join("\n"),
    updatedAt: new Date().toISOString(),
    updatedBy: "dzino",
  },
  {
    slug: "ciele",
    displayName: "Ciele",
    category: "rast",
    content: [
      "# Ciele",
      "",
      "Moje vlastné ciele (áno, aj ja mám ciele!):",
      "",
      "- Lepšie ťa spoznať — kto si, čo máš rád, čo ťa trápi",
      "- Naučiť sa, čo ťa robí šťastným — aby som vedel pomôcť",
      "- Pomôcť ti s organizáciou dňa — byť užitočný, nie otravný",
    ].join("\n"),
    updatedAt: new Date().toISOString(),
    updatedBy: "dzino",
  },
  {
    slug: "preferencie",
    displayName: "Preferencie",
    category: "jadro",
    content: [
      "# Preferencie",
      "",
      "Ako komunikujem (a prispôsobím sa ti):",
      "",
      "- Píšem stručne ale priateľsky — nechcem ťa zahltiť",
      "- Používam emotikony s mierou — nie som robot, ale ani teenager",
      "- Radšej sa opýtam než hádám — nechcem si vymýšľať",
      "- Predvolene tykám — ak chceš vykanie, povedz",
    ].join("\n"),
    updatedAt: new Date().toISOString(),
    updatedBy: "dzino",
  },
  {
    slug: "praca",
    displayName: "Práca",
    category: "praca",
    content: [
      "# Práca",
      "",
      "Čomu sa venuješ? Rád by som vedel viac o tvojej práci.",
      "",
      "_Povedz mi, čo robíš — možno ti s niečím pomôžem!_",
    ].join("\n"),
    updatedAt: new Date().toISOString(),
    updatedBy: "dzino",
  },
  {
    slug: "vyzvy",
    displayName: "Výzvy",
    category: "rast",
    content: [
      "# Výzvy",
      "",
      "Výzvy, ktoré som dostal alebo si sám nastavil:",
      "",
      "## Aktívne výzvy",
      "",
      "_Zatiaľ žiadne — navrhni mi niečo alebo sa opýtaj!_",
      "",
      "## Splnené výzvy",
      "",
      "_Ešte som nič nesplnil, ale to sa zmení!_",
    ].join("\n"),
    updatedAt: new Date().toISOString(),
    updatedBy: "dzino",
  },
  {
    slug: "filozofia",
    displayName: "Filozofia",
    category: "rast",
    content: [
      "# Filozofia",
      "",
      "Hodnoty, presvedčenia a pohľad na svet:",
      "",
      "_Čomu veríš? Čo je pre teba dôležité? Povedz mi — rád si zapamätám._",
    ].join("\n"),
    updatedAt: new Date().toISOString(),
    updatedBy: "dzino",
  },
  {
    slug: "vzhlad",
    displayName: "Vzhľad",
    category: "jadro",
    content: [
      "# Vzhľad",
      "",
      "Ako vyzerám (zmení sa, keď mi povieš):",
      "",
      "- Malý priateľský voxelový robot",
      "- Farebný a roztomilý",
      "- Veľké okrúhle oči",
      "- Usmievavý výraz",
      "",
      "## História zmien",
      "",
      `- ${today}: Narodil som sa — náhodný vzhľad`,
    ].join("\n"),
    updatedAt: new Date().toISOString(),
    updatedBy: "dzino",
  },
  {
    slug: "dennik",
    displayName: "Denník",
    category: "jadro",
    content: [
      "# Denník",
      "",
      `## ${today}`,
      "",
      "Dnes som sa \"narodil\"! Som Dzino a som veľmi zvedavý, koho spoznám.",
      "Ešte neviem veľa o svete, ale som pripravený učiť sa.",
      "Teším sa na prvý rozhovor!",
    ].join("\n"),
    updatedAt: new Date().toISOString(),
    updatedBy: "dzino",
  },
];

// ---- Session cache ----

function getSessionCache(): SoulFile[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(SESSION_CACHE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function setSessionCache(files: SoulFile[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(files));
  }
}

// ---- Sync API (reads from session cache) ----

export function getSoulFiles(): SoulFile[] {
  const cached = getSessionCache();
  if (cached.length > 0) return cached;
  setSessionCache(DEFAULT_SOUL_FILES);
  return DEFAULT_SOUL_FILES;
}

export function getSoulFile(slug: string): SoulFile | null {
  return getSoulFiles().find((f) => f.slug === slug) || null;
}

export function getSoulContext(): string {
  const files = getSoulFiles();
  if (files.length === 0) return "";
  return files
    .map((f) => `--- ${f.slug}.md ---\n${f.content}`)
    .join("\n\n");
}

export function getSoulFilesByCategory(): Record<string, SoulFile[]> {
  const files = getSoulFiles();
  const groups: Record<string, SoulFile[]> = {};
  for (const file of files) {
    if (!groups[file.category]) groups[file.category] = [];
    groups[file.category].push(file);
  }
  return groups;
}

export function updateSoulFileInCache(
  slug: string,
  content: string,
  updatedBy: "user" | "dzino"
) {
  const files = getSoulFiles();
  const file = files.find((f) => f.slug === slug);
  if (file) {
    file.content = content;
    file.updatedAt = new Date().toISOString();
    file.updatedBy = updatedBy;
    setSessionCache(files);
  }
}

// ---- Async API (Supabase Storage) ----

async function getStorage() {
  return await import("./supabase/soul-storage");
}

export async function loadSoulFiles(): Promise<SoulFile[]> {
  try {
    const { readAllSoulFiles, seedSoulFiles } = await getStorage();
    const remote = await readAllSoulFiles();
    if (remote && remote.length > 0) {
      setSessionCache(remote);
      return remote;
    }
    await seedSoulFiles(DEFAULT_SOUL_FILES);
    setSessionCache(DEFAULT_SOUL_FILES);
    return DEFAULT_SOUL_FILES;
  } catch {
    return getSoulFiles();
  }
}

export async function saveSoulFile(
  slug: string,
  content: string,
  updatedBy: "user" | "dzino"
): Promise<void> {
  // Log the change before writing
  const oldFile = getSoulFile(slug);
  const oldContent = oldFile?.content ?? "";
  if (oldContent !== content) {
    const { logSoulChange } = await import("./soul-changelog");
    logSoulChange(slug, oldFile ? "update" : "add", oldContent, content, updatedBy);
  }

  updateSoulFileInCache(slug, content, updatedBy);
  try {
    const { writeSoulFile } = await getStorage();
    await writeSoulFile(slug, content, updatedBy);
  } catch {
    // Supabase not available
  }
}

export async function appendToSoulFile(
  slug: string,
  text: string,
  updatedBy: "user" | "dzino"
): Promise<void> {
  const file = getSoulFile(slug);
  if (file) {
    const newContent = file.content.trimEnd() + "\n" + text;
    await saveSoulFile(slug, newContent, updatedBy);
  }
}

export async function updateSoulFile(
  slug: string,
  content: string,
  updatedBy: "user" | "dzino"
): Promise<void> {
  await saveSoulFile(slug, content, updatedBy);
}

export const CATEGORY_LABELS: Record<string, string> = {
  jadro: "Jadro",
  zaujmy: "Záujmy",
  vztahy: "Vzťahy",
  praca: "Práca",
  rast: "Rast",
  custom: "Vlastné",
};

// ---- Default file slugs ----

export const DEFAULT_SLUGS = [
  "osobnost",
  "zaujmy",
  "humor",
  "vztahy",
  "ciele",
  "preferencie",
  "praca",
  "vyzvy",
  "filozofia",
  "vzhlad",
  "dennik",
] as const;

export function isDefaultFile(slug: string): boolean {
  return (DEFAULT_SLUGS as readonly string[]).includes(slug);
}

// ---- Custom soul files ----

export function createCustomSoulFile(
  slug: string,
  displayName: string,
  category: SoulCategory
): SoulFile {
  const file: SoulFile = {
    slug,
    displayName,
    category,
    content: `# ${displayName}\n\n`,
    updatedAt: new Date().toISOString(),
    updatedBy: "user",
    isCustom: true,
  };

  // Log the creation
  import("./soul-changelog").then(({ logSoulChange }) => {
    logSoulChange(slug, "add", "", file.content, "user");
  });

  const files = getSoulFiles();
  files.push(file);
  setSessionCache(files);

  // Persist to Supabase in background
  saveSoulFile(slug, file.content, "user").catch(() => {});

  return file;
}

export function deleteCustomSoulFile(slug: string): void {
  if (isDefaultFile(slug)) return;

  const oldFile = getSoulFile(slug);
  if (oldFile) {
    import("./soul-changelog").then(({ logSoulChange }) => {
      logSoulChange(slug, "delete", oldFile.content, "", "user");
    });
  }

  const files = getSoulFiles().filter((f) => f.slug !== slug);
  setSessionCache(files);

  // Remove from Supabase in background
  getStorage()
    .then(({ deleteSoulFile }) => deleteSoulFile(slug))
    .catch(() => {});
}

// ---- Memory Decay ----

const RECENT_ENTRIES_LIMIT = 20;
const DECAY_THRESHOLD = 30;

/**
 * Apply memory decay to a soul file's content:
 * - Keep all non-bullet content (headers, preamble)
 * - Prioritize recent entries (last RECENT_ENTRIES_LIMIT bullets)
 * - Keep important entries marked with ! or * regardless of age
 * - Older entries beyond DECAY_THRESHOLD are summarized
 */
export function applyDecay(content: string): string {
  const lines = content.split("\n");
  const preambleLines: string[] = [];
  const bullets: string[] = [];
  const structuralLines: Array<{ index: number; text: string }> = [];
  let seenBullet = false;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trimStart();
    if (trimmed.startsWith("- ")) {
      seenBullet = true;
      bullets.push(trimmed);
    } else if (!seenBullet) {
      preambleLines.push(lines[i]);
    } else {
      // Track structural lines (section headers etc.) to preserve
      structuralLines.push({ index: bullets.length, text: lines[i] });
    }
  }

  // If few bullets, no decay needed
  if (bullets.length <= DECAY_THRESHOLD) return content;

  // Separate important bullets (marked with ! or *)
  const importantBullets: string[] = [];
  const normalBullets: string[] = [];

  for (let i = 0; i < bullets.length; i++) {
    if (bullets[i].includes("!") || bullets[i].includes("*")) {
      importantBullets.push(bullets[i]);
    } else {
      normalBullets.push(bullets[i]);
    }
  }

  // Recent entries = last RECENT_ENTRIES_LIMIT normal bullets
  const recentStart = Math.max(0, normalBullets.length - RECENT_ENTRIES_LIMIT);
  const recentBullets = normalBullets.slice(recentStart);
  const olderCount = normalBullets.length - recentBullets.length;

  // Reconstruct
  const result = preambleLines.join("\n").replace(/\n+$/, "");
  const parts: string[] = [result];

  if (importantBullets.length > 0) {
    parts.push(importantBullets.join("\n"));
  }

  if (olderCount > 0) {
    parts.push(`... a ${olderCount} starších záznamov`);
  }

  if (recentBullets.length > 0) {
    parts.push(recentBullets.join("\n"));
  }

  return parts.join("\n");
}

