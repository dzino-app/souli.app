import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { synthesizeSpeech } from "@/lib/tts";
import { checkTTSAccess, type UserTierRow } from "@/lib/tts-tier";
import type { SoundDNA } from "@/lib/avatar";

export const maxDuration = 30;

/**
 * POST /api/voice/tts
 * Body: { text: string, locale: string, soundDNA?: SoundDNA }
 * Returns: audio/mpeg on success, 402 when trial exhausted (client falls back to Web Speech)
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      text?: string;
      locale?: string;
      soundDNA?: SoundDNA;
    };

    const text = body.text?.trim();
    const locale = body.locale || "en";

    if (!text) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }
    if (text.length > 2000) {
      return NextResponse.json({ error: "text too long (max 2000)" }, { status: 400 });
    }

    // Anonymous users get Web Speech only — no server cost for them
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "auth_required", fallback: "web_speech" },
        { status: 402 },
      );
    }

    // Load tier info, or create default free-tier row with trial starting now
    let { data: row } = await supabase
      .from("user_credits")
      .select("tier, remaining, tts_trial_started_at, tts_trial_calls_used")
      .eq("user_id", user.id)
      .single();

    if (!row) {
      const { data: inserted } = await supabase
        .from("user_credits")
        .insert({
          user_id: user.id,
          tier: "free",
          remaining: 20,
          total: 20,
          tts_trial_started_at: new Date().toISOString(),
          tts_trial_calls_used: 0,
        })
        .select("tier, remaining, tts_trial_started_at, tts_trial_calls_used")
        .single();
      row = inserted;
    }

    const tierRow = row as UserTierRow | null;
    if (!tierRow) {
      return NextResponse.json({ error: "tier_check_failed" }, { status: 500 });
    }

    const access = checkTTSAccess(tierRow);
    if (!access.allowed) {
      return NextResponse.json(
        { error: access.reason, fallback: "web_speech" },
        { status: 402 },
      );
    }

    // Approved — synthesize
    const { audio, mimeType, voiceName } = await synthesizeSpeech(text, locale, body.soundDNA);

    // Decrement the appropriate counter (fire-and-forget)
    if (access.reason === "trial") {
      void supabase
        .from("user_credits")
        .update({ tts_trial_calls_used: tierRow.tts_trial_calls_used + 1 })
        .eq("user_id", user.id);
    } else if (tierRow.tier === "credits") {
      void supabase
        .from("user_credits")
        .update({ remaining: Math.max(0, tierRow.remaining - 1) })
        .eq("user_id", user.id);
    }

    return new NextResponse(audio as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "X-Voice-Name": voiceName,
        "X-TTS-Tier": access.reason,
        "X-TTS-Remaining": String(access.remainingCalls ?? -1),
        "X-TTS-Days-Left": String(access.daysLeft ?? -1),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    console.error("[tts]", err);
    const message = err instanceof Error ? err.message : "TTS failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
