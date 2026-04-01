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

export interface ParsedResponse {
  text: string; // cleaned response without update blocks
  soulUpdates: SoulUpdate[];
  eventProposals: EventProposal[];
}

// Parse :::aktualizacia blocks from Claude's response
const SOUL_UPDATE_REGEX = /:::aktualizacia\s*([\s\S]*?):::/g;
const EVENT_REGEX = /:::udalost\s*([\s\S]*?):::/g;

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
    if (kv.nazov && kv.datum) {
      eventProposals.push({
        type: (kv.typ as "diary" | "plan") || "plan",
        date: kv.datum,
        time: kv.cas,
        title: kv.nazov,
        description: kv.popis || "",
        remindBefore: kv.pripomienka ? parseInt(kv.pripomienka, 10) : undefined,
      });
    }
  }

  // Clean text: remove all update/event blocks
  const text = fullText
    .replace(SOUL_UPDATE_REGEX, "")
    .replace(EVENT_REGEX, "")
    .trim();

  return { text, soulUpdates, eventProposals };
}
