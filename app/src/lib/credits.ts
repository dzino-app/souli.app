"use client";

/**
 * Credit tracking for message usage.
 *
 * localStorage is the instant-feedback store; Supabase is authoritative.
 * Free tier: 20 messages/month, auto-resets on the 1st of each month.
 */

export type CreditTier = "free" | "credits" | "monthly" | "yearly";

export interface CreditState {
  remaining: number;
  total: number;
  resetDate: string; // ISO date string (1st of next month)
  tier: CreditTier;
}

const STORAGE_KEY = "dzino_credits";

const TIER_LIMITS: Record<CreditTier, number> = {
  free: 20,
  credits: 0, // credits tier: bought credits are added to remaining
  monthly: 200,
  yearly: 200,
};

/**
 * Get the 1st of next month as an ISO date string.
 */
function getNextResetDate(): string {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return next.toISOString();
}

/**
 * Read credit state from localStorage.
 */
export function getCredits(): CreditState {
  if (typeof window === "undefined") {
    return {
      remaining: TIER_LIMITS.free,
      total: TIER_LIMITS.free,
      resetDate: getNextResetDate(),
      tier: "free",
    };
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return initCredits();
  }

  try {
    const state: CreditState = JSON.parse(raw);
    return state;
  } catch {
    return initCredits();
  }
}

/**
 * Save credit state to localStorage (+ async Supabase sync).
 */
function saveCredits(state: CreditState): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  // Fire-and-forget Supabase sync
  import("./supabase/sync")
    .then(({ syncCreditsToSupabase }) => syncCreditsToSupabase(state))
    .catch(() => {});
}

/**
 * Create default free-tier credits. Called on first visit.
 */
export function initCredits(): CreditState {
  const state: CreditState = {
    remaining: TIER_LIMITS.free,
    total: TIER_LIMITS.free,
    resetDate: getNextResetDate(),
    tier: "free",
  };
  saveCredits(state);
  return state;
}

/**
 * Check if the user has at least 1 credit remaining.
 */
export function hasCredits(): boolean {
  const state = getCredits();
  return state.remaining > 0;
}

/**
 * Use 1 credit. Returns true if successful, false if no credits left.
 */
export function consumeCredit(): boolean {
  const state = getCredits();
  if (state.remaining <= 0) return false;

  state.remaining -= 1;
  saveCredits(state);
  return true;
}

/**
 * If the current date is past the reset date, reset credits to the tier limit.
 * Called on page load.
 */
export function resetMonthlyCredits(): CreditState {
  const state = getCredits();
  const now = new Date();
  const resetDate = new Date(state.resetDate);

  if (now >= resetDate) {
    // For "credits" tier, don't auto-reset (purchased credits persist)
    if (state.tier !== "credits") {
      const limit = TIER_LIMITS[state.tier];
      state.remaining = limit;
      state.total = limit;
    }
    state.resetDate = getNextResetDate();
    saveCredits(state);
  }

  return state;
}

/**
 * Add purchased credits to remaining count.
 * If the user is on free tier, switches them to "credits" tier.
 */
export function addCredits(amount: number): CreditState {
  const state = getCredits();

  if (state.tier === "free") {
    state.tier = "credits";
  }

  state.remaining += amount;
  state.total += amount;
  saveCredits(state);
  return state;
}

/**
 * Upgrade to a paid tier (monthly or yearly).
 */
export function upgradeTier(tier: "monthly" | "yearly"): CreditState {
  const limit = TIER_LIMITS[tier];
  const state: CreditState = {
    remaining: limit,
    total: limit,
    resetDate: getNextResetDate(),
    tier,
  };
  saveCredits(state);
  return state;
}
