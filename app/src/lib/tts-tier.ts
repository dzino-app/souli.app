/**
 * TTS tier gating logic.
 * Free tier: 50 neural calls OR 7 days trial, whichever first → then Web Speech.
 * Paid tier (monthly/yearly): unlimited neural.
 * Credits tier: each neural call costs 1 credit.
 */

export const TRIAL_CALLS = 50;
export const TRIAL_DAYS = 7;

export type TTSAccess =
  | { allowed: true; reason: "paid" | "trial"; remainingCalls?: number; daysLeft?: number }
  | { allowed: false; reason: "trial_exhausted" | "no_credits"; remainingCalls?: number; daysLeft?: number };

export interface UserTierRow {
  tier: "free" | "credits" | "monthly" | "yearly";
  remaining: number;
  tts_trial_started_at: string | null;
  tts_trial_calls_used: number;
}

export function checkTTSAccess(row: UserTierRow): TTSAccess {
  // Paid tiers: unlimited
  if (row.tier === "monthly" || row.tier === "yearly") {
    return { allowed: true, reason: "paid" };
  }

  // Credits tier: must have ≥1 credit
  if (row.tier === "credits") {
    if (row.remaining > 0) return { allowed: true, reason: "paid" };
    return { allowed: false, reason: "no_credits" };
  }

  // Free tier: check trial
  const now = Date.now();
  const trialStart = row.tts_trial_started_at
    ? new Date(row.tts_trial_started_at).getTime()
    : now;
  const daysElapsed = Math.floor((now - trialStart) / (1000 * 60 * 60 * 24));
  const daysLeft = Math.max(0, TRIAL_DAYS - daysElapsed);
  const callsLeft = Math.max(0, TRIAL_CALLS - row.tts_trial_calls_used);

  if (daysLeft > 0 && callsLeft > 0) {
    return {
      allowed: true,
      reason: "trial",
      remainingCalls: callsLeft,
      daysLeft,
    };
  }

  return {
    allowed: false,
    reason: "trial_exhausted",
    remainingCalls: 0,
    daysLeft: 0,
  };
}
