export interface SoulFile {
  slug: string;
  displayName: string;
  category: "jadro" | "zaujmy" | "vztahy" | "praca";
  content: string;
  updatedAt: string;
  updatedBy: "user" | "dzino";
}

const STORAGE_KEY = "dzino_soul";

const DEFAULT_SOUL_FILES: SoulFile[] = [
  {
    slug: "osobnost",
    displayName: "Osobnosť",
    category: "jadro",
    content: "# Osobnosť\n\n_Zatiaľ neviem veľa..._",
    updatedAt: new Date().toISOString(),
    updatedBy: "dzino",
  },
  {
    slug: "zaujmy",
    displayName: "Záujmy",
    category: "zaujmy",
    content: "# Záujmy a koníčky\n\n_Povedzte mi, čo Vás baví!_",
    updatedAt: new Date().toISOString(),
    updatedBy: "dzino",
  },
  {
    slug: "humor",
    displayName: "Humor",
    category: "jadro",
    content: "# Humor\n\n_Ešte sa učím, čo Vás rozosmeje._",
    updatedAt: new Date().toISOString(),
    updatedBy: "dzino",
  },
  {
    slug: "vztahy",
    displayName: "Vzťahy",
    category: "vztahy",
    content: "# Dôležití ľudia\n\n_Koho poznáte?_",
    updatedAt: new Date().toISOString(),
    updatedBy: "dzino",
  },
  {
    slug: "ciele",
    displayName: "Ciele",
    category: "praca",
    content: "# Ciele a plány\n\n_Na čom pracujete?_",
    updatedAt: new Date().toISOString(),
    updatedBy: "dzino",
  },
  {
    slug: "preferencie",
    displayName: "Preferencie",
    category: "jadro",
    content: "# Preferencie\n\n_Ako sa Vám najlepšie komunikuje?_",
    updatedAt: new Date().toISOString(),
    updatedBy: "dzino",
  },
  {
    slug: "praca",
    displayName: "Práca",
    category: "praca",
    content: "# Práca\n\n_Čomu sa venujete?_",
    updatedAt: new Date().toISOString(),
    updatedBy: "dzino",
  },
  {
    slug: "dennik",
    displayName: "Denník",
    category: "jadro",
    content: "# Denník\n\n_Tu si zapisujem dôležité momenty._",
    updatedAt: new Date().toISOString(),
    updatedBy: "dzino",
  },
];

export function getSoulFiles(): SoulFile[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    // Seed defaults on first access
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SOUL_FILES));
    return DEFAULT_SOUL_FILES;
  }
  return JSON.parse(raw);
}

function saveSoulFiles(files: SoulFile[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
}

export function getSoulFile(slug: string): SoulFile | null {
  return getSoulFiles().find((f) => f.slug === slug) || null;
}

export function updateSoulFile(
  slug: string,
  content: string,
  updatedBy: "user" | "dzino"
): SoulFile[] {
  const files = getSoulFiles();
  const file = files.find((f) => f.slug === slug);
  if (file) {
    file.content = content;
    file.updatedAt = new Date().toISOString();
    file.updatedBy = updatedBy;
    saveSoulFiles(files);
  }
  return files;
}

export function appendToSoulFile(
  slug: string,
  text: string,
  updatedBy: "user" | "dzino"
): SoulFile[] {
  const files = getSoulFiles();
  const file = files.find((f) => f.slug === slug);
  if (file) {
    file.content = file.content.trimEnd() + "\n" + text;
    file.updatedAt = new Date().toISOString();
    file.updatedBy = updatedBy;
    saveSoulFiles(files);
  }
  return files;
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

export const CATEGORY_LABELS: Record<string, string> = {
  jadro: "Jadro",
  zaujmy: "Záujmy",
  vztahy: "Vzťahy",
  praca: "Práca",
};
