import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkTTSAccess, TRIAL_CALLS, TRIAL_DAYS, type UserTierRow } from "@/lib/tts-tier";

/** GET /api/voice/status — returns TTS tier + trial counters for the current user */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ authenticated: false });
  }

  const { data: row } = await supabase
    .from("user_credits")
    .select("tier, remaining, tts_trial_started_at, tts_trial_calls_used")
    .eq("user_id", user.id)
    .single();

  if (!row) {
    // Never touched credits/TTS yet — trial hasn't started
    return NextResponse.json({
      authenticated: true,
      tier: "free",
      allowed: true,
      reason: "trial",
      remainingCalls: TRIAL_CALLS,
      daysLeft: TRIAL_DAYS,
      trialLimit: TRIAL_CALLS,
      trialDays: TRIAL_DAYS,
    });
  }

  const access = checkTTSAccess(row as UserTierRow);
  return NextResponse.json({
    authenticated: true,
    tier: row.tier,
    allowed: access.allowed,
    reason: access.reason,
    remainingCalls: "remainingCalls" in access ? access.remainingCalls : undefined,
    daysLeft: "daysLeft" in access ? access.daysLeft : undefined,
    trialLimit: TRIAL_CALLS,
    trialDays: TRIAL_DAYS,
  });
}
