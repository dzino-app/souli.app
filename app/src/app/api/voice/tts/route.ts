import { NextResponse } from "next/server";
import { synthesizeSpeech } from "@/lib/tts";
import type { SoundDNA } from "@/lib/avatar";

export const maxDuration = 30;

/**
 * POST /api/voice/tts
 * Body: { text: string, locale: string, soundDNA?: SoundDNA }
 * Returns: audio/mpeg
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

    const { audio, mimeType, voiceName } = await synthesizeSpeech(text, locale, body.soundDNA);

    return new NextResponse(audio as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "X-Voice-Name": voiceName,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    console.error("[tts]", err);
    const message = err instanceof Error ? err.message : "TTS failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
