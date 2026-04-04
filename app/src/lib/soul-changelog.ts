// Soul file change tracking — localStorage only

const CHANGELOG_KEY = "dzino_soul_changelog";
const MAX_ENTRIES = 200;

export type ChangeType = "add" | "update" | "delete";
export type ChangeSource = "user" | "dzino";

export interface SoulChangeEntry {
  id: string;
  slug: string;
  type: ChangeType;
  before: string;
  after: string;
  timestamp: string;
  source: ChangeSource;
}

export type ChangelogGroup = {
  label: string;
  entries: SoulChangeEntry[];
};

// ---- Core API ----

export function logSoulChange(
  slug: string,
  type: ChangeType,
  before: string,
  after: string,
  source: ChangeSource
): void {
  if (typeof window === "undefined") return;

  const entry: SoulChangeEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    slug,
    type,
    before,
    after,
    timestamp: new Date().toISOString(),
    source,
  };

  const entries = getChangelog();
  entries.unshift(entry);

  // Keep only the last MAX_ENTRIES
  if (entries.length > MAX_ENTRIES) {
    entries.length = MAX_ENTRIES;
  }

  localStorage.setItem(CHANGELOG_KEY, JSON.stringify(entries));
}

export function getChangelog(): SoulChangeEntry[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(CHANGELOG_KEY);
  return raw ? JSON.parse(raw) : [];
}

// ---- Grouped view ----

export function getChangelogGrouped(): ChangelogGroup[] {
  const entries = getChangelog();
  if (entries.length === 0) return [];

  const now = Date.now();
  const TEN_MIN = 10 * 60 * 1000;
  const groups: ChangelogGroup[] = [];

  const buckets: Record<string, SoulChangeEntry[]> = {
    recent: [],
    today: [],
    week: [],
    month: [],
    older: [],
  };

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayMs = todayStart.getTime();

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekMs = weekStart.getTime();

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthMs = monthStart.getTime();

  for (const entry of entries) {
    const ts = new Date(entry.timestamp).getTime();
    if (now - ts < TEN_MIN) {
      buckets.recent.push(entry);
    } else if (ts >= todayMs) {
      buckets.today.push(entry);
    } else if (ts >= weekMs) {
      buckets.week.push(entry);
    } else if (ts >= monthMs) {
      buckets.month.push(entry);
    } else {
      buckets.older.push(entry);
    }
  }

  const labels: Record<string, string> = {
    recent: "Poslednych 10 min",
    today: "Dnes",
    week: "Tento tyden",
    month: "Tento mesiac",
    older: "Starsie",
  };

  for (const key of ["recent", "today", "week", "month", "older"] as const) {
    if (buckets[key].length > 0) {
      groups.push({ label: labels[key], entries: buckets[key] });
    }
  }

  return groups;
}

// ---- Simple diff ----

export interface DiffLine {
  type: "add" | "remove" | "same";
  text: string;
}

export function simpleDiff(before: string, after: string): DiffLine[] {
  const beforeLines = before.split("\n");
  const afterLines = after.split("\n");
  const result: DiffLine[] = [];

  // Use a simple O(nm) LCS approach — soul files are small
  const m = beforeLines.length;
  const n = afterLines.length;

  // Build LCS table
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (beforeLines[i - 1] === afterLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to build diff
  const diffLines: DiffLine[] = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && beforeLines[i - 1] === afterLines[j - 1]) {
      diffLines.push({ type: "same", text: beforeLines[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      diffLines.push({ type: "add", text: afterLines[j - 1] });
      j--;
    } else {
      diffLines.push({ type: "remove", text: beforeLines[i - 1] });
      i--;
    }
  }

  diffLines.reverse();

  // Filter out unchanged lines — only show adds and removes
  // But keep a few context lines around changes
  for (const line of diffLines) {
    if (line.type !== "same") {
      result.push(line);
    }
  }

  return result;
}

// ---- Relative time formatting ----

export function relativeTime(timestamp: string): string {
  const now = Date.now();
  const ts = new Date(timestamp).getTime();
  const diff = now - ts;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "prave teraz";
  if (minutes < 60) return `pred ${minutes} min`;
  if (hours < 24) return `pred ${hours} h`;
  if (days === 1) return "vcera";
  if (days < 7) return `pred ${days} dnami`;
  if (days < 30) return `pred ${Math.floor(days / 7)} tyz.`;
  return `pred ${Math.floor(days / 30)} mes.`;
}
