export interface Skill {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  isPublic: boolean;
  usageCount: number;
  createdAt: string;
}

const STORAGE_KEY = "dzino_skills";

export function getSkills(): Skill[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveSkills(skills: Skill[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(skills));
}

export function createSkill(
  name: string,
  description: string,
  systemPrompt: string
): Skill {
  const skill: Skill = {
    id: crypto.randomUUID(),
    name,
    description,
    systemPrompt,
    isPublic: false,
    usageCount: 0,
    createdAt: new Date().toISOString(),
  };
  const all = getSkills();
  all.unshift(skill);
  saveSkills(all);
  return skill;
}

export function toggleSkillPublic(id: string): Skill[] {
  const all = getSkills();
  const skill = all.find((s) => s.id === id);
  if (skill) skill.isPublic = !skill.isPublic;
  saveSkills(all);
  return all;
}

export function deleteSkill(id: string): Skill[] {
  const all = getSkills();
  const filtered = all.filter((s) => s.id !== id);
  saveSkills(filtered);
  return filtered;
}

export function getPublicSkills(): Skill[] {
  return getSkills().filter((s) => s.isPublic);
}

export function incrementSkillUsage(id: string) {
  const all = getSkills();
  const skill = all.find((s) => s.id === id);
  if (skill) skill.usageCount++;
  saveSkills(all);
}
