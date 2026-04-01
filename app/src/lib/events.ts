export interface DzinoEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time?: string;
  type: "diary" | "plan";
  status: "upcoming" | "done" | "missed";
  remindBefore?: number;
  createdAt: string;
  createdBy: "user" | "dzino";
}

const STORAGE_KEY = "dzino_events";

export function getEvents(): DzinoEvent[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveEvents(events: DzinoEvent[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

export function createEvent(
  event: Omit<DzinoEvent, "id" | "createdAt">
): DzinoEvent {
  const newEvent: DzinoEvent = {
    ...event,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  const all = getEvents();
  all.push(newEvent);
  saveEvents(all);
  return newEvent;
}

export function updateEvent(
  id: string,
  updates: Partial<Omit<DzinoEvent, "id" | "createdAt">>
): DzinoEvent[] {
  const all = getEvents();
  const event = all.find((e) => e.id === id);
  if (event) Object.assign(event, updates);
  saveEvents(all);
  return all;
}

export function deleteEvent(id: string): DzinoEvent[] {
  const all = getEvents();
  const filtered = all.filter((e) => e.id !== id);
  saveEvents(filtered);
  return filtered;
}

export function getUpcomingEvents(): DzinoEvent[] {
  const today = new Date().toISOString().split("T")[0];
  return getEvents()
    .filter((e) => e.type === "plan" && e.date >= today && e.status === "upcoming")
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getDiaryEvents(): DzinoEvent[] {
  return getEvents()
    .filter((e) => e.type === "diary" || e.status === "done")
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function markEventDone(id: string): DzinoEvent[] {
  return updateEvent(id, { status: "done" });
}

// Auto-mark past upcoming events as missed
export function refreshEventStatuses(): DzinoEvent[] {
  const today = new Date().toISOString().split("T")[0];
  const all = getEvents();
  let changed = false;
  for (const event of all) {
    if (event.type === "plan" && event.status === "upcoming" && event.date < today) {
      event.status = "missed";
      changed = true;
    }
  }
  if (changed) saveEvents(all);
  return all;
}
