"use client";

// Souli proactive notification system
// Uses the browser Notification API (not Push API / service workers) for v1

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NotificationSlot = "morning" | "midday" | "evening";

export interface NotificationSettings {
  enabled: boolean;
  morning: boolean;
  midday: boolean;
  evening: boolean;
  /** Hour (0-23) when quiet period starts */
  quietStart: number;
  /** Hour (0-23) when quiet period ends */
  quietEnd: number;
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

const STORAGE_KEY = "dzino_notification_settings";

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: false,
  morning: true,
  midday: true,
  evening: true,
  quietStart: 22,
  quietEnd: 7,
};

export function getNotificationSettings(): NotificationSettings {
  if (typeof window === "undefined") return { ...DEFAULT_SETTINGS };
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { ...DEFAULT_SETTINGS };
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveNotificationSettings(
  settings: NotificationSettings,
): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

// ---------------------------------------------------------------------------
// Permission helpers
// ---------------------------------------------------------------------------

export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<
  NotificationPermission | "unsupported"
> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  const result = await Notification.requestPermission();
  return result;
}

// ---------------------------------------------------------------------------
// Message generation
// ---------------------------------------------------------------------------

const MESSAGES: Record<NotificationSlot, string[]> = {
  morning: [
    "Dobr\u00e9 r\u00e1no! Tvoj Souli sa u\u017e zobudil \ud83c\udf05",
    "Nov\u00fd de\u0148, nov\u00e9 dobrodru\u017estvo! \u010co bude\u0161 dnes robi\u0165?",
    "R\u00e1no je tu! Tvoj Souli \u0165a u\u017e \u010dak\u00e1 \u2615",
    "Ako sa c\u00edti\u0161 dnes r\u00e1no? Povedz mi \ud83c\udf1e",
    "Dobr\u00e9 r\u00e1no! \u010co k\u00e1\u017ee\u0161 na kr\u00e1tky rannej \u010det?",
  ],
  midday: [
    "Ako sa m\u00e1\u0161? Tvoj Souli na teba mysl\u00ed \ud83d\udcad",
    "Mal\u00e1 prest\u00e1vka? Porozpr\u00e1vaj sa so svoj\u00edm Souli",
    "U\u017e je poludnie! \u010co nov\u00e9ho? \ud83c\udf1f",
    "Tvoj Souli sa pt\u00e1: ako ide tvoj de\u0148?",
    "Polovi\u010dka d\u0148a za nami \u2014 \u010do tak si oddych\u00fa\u0165?",
  ],
  evening: [
    "Ak\u00fd bol tvoj de\u0148? Tvoj Souli chce po\u010du\u0165 \ud83c\udf19",
    "\u010cas na ve\u010dern\u00e9 zamyslenie...",
    "Tvoj Souli \u0165a chce po\u010du\u0165 pred span\u00edm \ud83c\udf1b",
    "Ve\u010der je tu. Chce\u0161 sa zdveri\u0165 Soulimu?",
    "Posledn\u00e1 spr\u00e1va pred span\u00edm \u2014 tvoj Souli \u0165a \u010dak\u00e1 \ud83d\ude34",
  ],
};

export function generateSouliMessage(slot: NotificationSlot): string {
  const pool = MESSAGES[slot];
  return pool[Math.floor(Math.random() * pool.length)];
}

// ---------------------------------------------------------------------------
// Local notification scheduling
// ---------------------------------------------------------------------------

/** Active timeout ID so we can cancel when settings change */
let scheduledTimer: ReturnType<typeof setTimeout> | null = null;

export function clearScheduledNotification(): void {
  if (scheduledTimer !== null) {
    clearTimeout(scheduledTimer);
    scheduledTimer = null;
  }
}

/**
 * Show a browser notification after `delayMs` milliseconds.
 * Returns a cleanup function that cancels the pending timeout.
 */
export function scheduleLocalNotification(
  title: string,
  body: string,
  delayMs: number,
): () => void {
  clearScheduledNotification();

  scheduledTimer = setTimeout(() => {
    // Don't fire if the tab is active — only send when the user is away
    if (typeof document !== "undefined" && document.hidden) {
      try {
        new Notification(title, {
          body,
          icon: "/icons/icon-192.png",
        });
      } catch {
        // Notification constructor can throw in some environments
      }
    }
    scheduledTimer = null;
  }, delayMs);

  return clearScheduledNotification;
}

// ---------------------------------------------------------------------------
// Slot & scheduling logic
// ---------------------------------------------------------------------------

/** Time windows for each slot (hours, inclusive) */
const SLOT_WINDOWS: Record<NotificationSlot, { start: number; end: number }> = {
  morning: { start: 7, end: 9 },
  midday: { start: 12, end: 14 },
  evening: { start: 19, end: 21 },
};

function isInQuietHours(hour: number, settings: NotificationSettings): boolean {
  const { quietStart, quietEnd } = settings;
  if (quietStart <= quietEnd) {
    // e.g. 8:00 - 20:00
    return hour >= quietStart && hour < quietEnd;
  }
  // e.g. 22:00 - 07:00 (wraps midnight)
  return hour >= quietStart || hour < quietEnd;
}

/**
 * Returns the next enabled notification slot and the delay in ms until a
 * random time within that slot's window.
 * Returns null if no slot is upcoming today.
 */
export function getNextScheduledSlot(
  settings: NotificationSettings,
): { slot: NotificationSlot; delayMs: number } | null {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeMinutes = currentHour * 60 + currentMinute;

  // Ordered slots for the day
  const slots: NotificationSlot[] = ["morning", "midday", "evening"];

  for (const slot of slots) {
    if (!settings[slot]) continue;

    const window = SLOT_WINDOWS[slot];

    // Pick a random time within the window
    const windowStartMinutes = window.start * 60;
    const windowEndMinutes = window.end * 60;

    // If the entire window has passed, skip
    if (currentTimeMinutes >= windowEndMinutes) continue;

    // The earliest we can fire is now (or window start if it hasn't started)
    const earliestMinutes = Math.max(currentTimeMinutes + 1, windowStartMinutes);

    // Random minute within [earliest, windowEnd)
    const targetMinutes =
      earliestMinutes +
      Math.floor(Math.random() * (windowEndMinutes - earliestMinutes));

    const targetHour = Math.floor(targetMinutes / 60);

    // Respect quiet hours
    if (isInQuietHours(targetHour, settings)) continue;

    const delayMs = (targetMinutes - currentTimeMinutes) * 60 * 1000;

    return { slot, delayMs };
  }

  return null;
}
