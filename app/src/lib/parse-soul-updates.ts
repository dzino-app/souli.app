export interface SoulUpdate {
  slug: string;
  operation: "pridat" | "nahradit" | "vymazat";
  content: string;
}

export interface EventProposal {
  type: "diary" | "plan";
  date: string;
  time?: string;
  title: string;
  description: string;
  remindBefore?: number;
}

export type MoodState = "idle" | "happy" | "sad" | "thinking" | "waving" | "eating" | "walking";

export interface TimerRequest {
  seconds: number;
  label: string;
}

export interface ParsedResponse {
  text: string; // cleaned response without update blocks
  soulUpdates: SoulUpdate[];
  eventProposals: EventProposal[];
  timerRequests: TimerRequest[];
  mood: MoodState; // avatar state after response
}

// Parse :::aktualizacia, :::udalost, :::nalada blocks from response
// Regex created per-call to avoid stale lastIndex with global flag

const VALID_MOODS: MoodState[] = ["idle", "happy", "sad", "thinking", "waving", "eating", "walking"];

function parseKeyValue(block: string): Record<string, string> {
  const result: Record<string, string> = {};
  let currentKey = "";
  let currentValue = "";
  let inMultiline = false;

  for (const line of block.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (inMultiline) {
      if (trimmed.match(/^\w+:/) && !trimmed.startsWith("  ")) {
        // New key starts — save previous
        result[currentKey] = currentValue.trim();
        inMultiline = false;
      } else {
        currentValue += "\n" + (line.startsWith("  ") ? line.slice(2) : line);
        continue;
      }
    }

    const match = trimmed.match(/^(\w+):\s*(.*)$/);
    if (match) {
      currentKey = match[1];
      const value = match[2];
      if (value === "|" || value === "") {
        inMultiline = true;
        currentValue = "";
      } else {
        result[currentKey] = value;
      }
    }
  }

  // Save last key if in multiline
  if (inMultiline && currentKey) {
    result[currentKey] = currentValue.trim();
  }

  return result;
}

export function parseResponse(fullText: string): ParsedResponse {
  const soulUpdates: SoulUpdate[] = [];
  const eventProposals: EventProposal[] = [];

  // Create fresh regex per call to avoid stale lastIndex
  const SOUL_UPDATE_REGEX = /:::aktualizacia\s*([\s\S]*?):::/g;
  const EVENT_REGEX = /:::udalost\s*([\s\S]*?):::/g;
  const MOOD_REGEX = /:::nalada\s*([\s\S]*?):::/g;

  // Extract soul updates
  let match;
  while ((match = SOUL_UPDATE_REGEX.exec(fullText)) !== null) {
    const kv = parseKeyValue(match[1]);
    if (kv.subor && kv.obsah) {
      soulUpdates.push({
        slug: kv.subor.replace(".md", ""),
        operation: (kv.operacia as SoulUpdate["operation"]) || "pridat",
        content: kv.obsah,
      });
    }
  }

  // Extract event proposals
  while ((match = EVENT_REGEX.exec(fullText)) !== null) {
    const kv = parseKeyValue(match[1]);
    if (kv.nazov) {
      // Fix placeholder dates from LLM ({{DATE}}, YYYY-MM-DD, etc.)
      let date = kv.datum || "";
      if (!date || /\{\{|YYYY|DATE/i.test(date)) {
        date = new Date().toISOString().slice(0, 10);
      }
      let time = kv.cas || "";
      if (/\{\{|HH|TIME/i.test(time)) {
        time = new Date().toTimeString().slice(0, 5);
      }
      eventProposals.push({
        type: (kv.typ as "diary" | "plan") || "plan",
        date,
        time,
        title: kv.nazov,
        description: kv.popis || "",
        remindBefore: kv.pripomienka ? parseInt(kv.pripomienka, 10) : undefined,
      });
    }
  }

  // Extract timer requests
  const TIMER_REGEX = /:::casovac\n([\s\S]*?):::/g;
  const timerRequests: TimerRequest[] = [];
  let timerMatch;
  while ((timerMatch = TIMER_REGEX.exec(fullText)) !== null) {
    const kv = parseKeyValue(timerMatch[1]);
    const seconds = parseInt(kv.sekundy || kv.seconds || "0", 10);
    if (seconds > 0) {
      timerRequests.push({
        seconds,
        label: kv.nazov || kv.label || "",
      });
    }
  }

  // Extract mood
  let mood: MoodState = "happy"; // default after response
  let moodMatch;
  while ((moodMatch = MOOD_REGEX.exec(fullText)) !== null) {
    const kv = parseKeyValue(moodMatch[1]);
    const stav = kv.stav?.trim().toLowerCase();
    if (stav && VALID_MOODS.includes(stav as MoodState)) {
      mood = stav as MoodState;
    }
  }

  // Clean text: remove all special blocks
  const text = fullText
    .replace(SOUL_UPDATE_REGEX, "")
    .replace(EVENT_REGEX, "")
    .replace(TIMER_REGEX, "")
    .replace(MOOD_REGEX, "")
    .trim();

  return { text, soulUpdates, eventProposals, timerRequests, mood };
}

/**
 * Strip special blocks from streaming text for display.
 * Removes complete :::...:::\n blocks and any trailing incomplete ::: block.
 */
export function stripBlocksForDisplay(text: string): string {
  return text
    .replace(/:::(aktualizacia|udalost|nalada|casovac)[\s\S]*?:::/g, "")
    .replace(/:::(aktualizacia|udalost|nalada|casovac)[\s\S]*$/, "") // incomplete trailing block
    .trim();
}
