/**
 * Google Cloud Text-to-Speech integration.
 * Maps Souli's SoundDNA to voice selection + prosody (SSML).
 * Cached in-memory by hash(text + voiceId) to reduce cost on repeated plays.
 */

import { TextToSpeechClient } from "@google-cloud/text-to-speech";
import * as crypto from "crypto";
import type { SoundDNA } from "./avatar";

let _client: TextToSpeechClient | null = null;

function getClient(): TextToSpeechClient {
  if (_client) return _client;
  // Credentials are already set up by ensureCredentials() in llm.ts,
  // but call it here too in case TTS is hit before LLM.
  const jsonStr = process.env.GOOGLE_CLOUD_CREDENTIALS_JSON;
  if (jsonStr && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // Delegate to same bootstrap
    void import("./llm");
  }
  _client = new TextToSpeechClient();
  return _client;
}

/**
 * Language code → BCP-47 + default voice pool.
 * Using Neural2 voices (higher quality than standard, 18× cheaper than ElevenLabs).
 */
const VOICE_POOLS: Record<string, { lang: string; voices: string[] }> = {
  sk: { lang: "sk-SK", voices: ["sk-SK-Wavenet-A"] },
  cs: { lang: "cs-CZ", voices: ["cs-CZ-Wavenet-A", "cs-CZ-Standard-A"] },
  en: {
    lang: "en-US",
    voices: [
      "en-US-Neural2-A", "en-US-Neural2-C", "en-US-Neural2-D",
      "en-US-Neural2-E", "en-US-Neural2-F", "en-US-Neural2-G",
      "en-US-Neural2-H", "en-US-Neural2-I", "en-US-Neural2-J",
    ],
  },
  de: { lang: "de-DE", voices: ["de-DE-Neural2-B", "de-DE-Neural2-C", "de-DE-Neural2-D", "de-DE-Neural2-F"] },
  fr: { lang: "fr-FR", voices: ["fr-FR-Neural2-A", "fr-FR-Neural2-B", "fr-FR-Neural2-C", "fr-FR-Neural2-D", "fr-FR-Neural2-E"] },
  es: { lang: "es-ES", voices: ["es-ES-Neural2-A", "es-ES-Neural2-B", "es-ES-Neural2-C", "es-ES-Neural2-D", "es-ES-Neural2-E", "es-ES-Neural2-F"] },
  hu: { lang: "hu-HU", voices: ["hu-HU-Wavenet-A", "hu-HU-Standard-A"] },
  pl: { lang: "pl-PL", voices: ["pl-PL-Wavenet-A", "pl-PL-Wavenet-B", "pl-PL-Wavenet-C", "pl-PL-Wavenet-D", "pl-PL-Wavenet-E"] },
  hi: { lang: "hi-IN", voices: ["hi-IN-Neural2-A", "hi-IN-Neural2-B", "hi-IN-Neural2-C", "hi-IN-Neural2-D"] },
};

/**
 * Deterministic voice pick based on SoundDNA — same Souli always gets same voice.
 */
export function pickVoiceForDNA(
  locale: string,
  dna: SoundDNA | undefined,
): { lang: string; name: string } {
  const pool = VOICE_POOLS[locale] ?? VOICE_POOLS.en;
  if (!dna) return { lang: pool.lang, name: pool.voices[0] };
  // Hash SoundDNA fields → index into voice pool
  const h = (dna.basePitch * 7 + Math.round(dna.tempo * 100) + dna.chirpRange * 3 + dna.harmonicShift * 5) | 0;
  const idx = Math.abs(h) % pool.voices.length;
  return { lang: pool.lang, name: pool.voices[idx] };
}

/**
 * SoundDNA → SSML prosody (pitch + rate adjustments beyond the base voice).
 */
function buildSSML(text: string, dna: SoundDNA | undefined): string {
  const cleanText = text.replace(/[<>&"']/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[c] || c),
  );

  if (!dna) return `<speak>${cleanText}</speak>`;

  // Normalize pitch offset: basePitch 350 → -4st, 550 → 0st, 750 → +4st
  const pitchSemitones = ((dna.basePitch - 550) / 200) * 4;
  const pitchAttr = `${pitchSemitones >= 0 ? "+" : ""}${pitchSemitones.toFixed(1)}st`;
  // Rate from tempo (0.8-1.3) → "slow" to "fast"
  const rate = dna.tempo < 0.9 ? "slow" : dna.tempo > 1.1 ? "fast" : "medium";

  return `<speak><prosody pitch="${pitchAttr}" rate="${rate}">${cleanText}</prosody></speak>`;
}

// Simple in-memory LRU cache (10 MB cap)
const cache = new Map<string, Buffer>();
let cacheSize = 0;
const MAX_CACHE = 10 * 1024 * 1024;

function cacheKey(text: string, voiceName: string): string {
  return crypto.createHash("sha256").update(`${voiceName}::${text}`).digest("hex");
}

/**
 * Synthesize speech. Returns MP3 audio as Buffer.
 */
export async function synthesizeSpeech(
  text: string,
  locale: string,
  dna?: SoundDNA,
): Promise<{ audio: Buffer; mimeType: string; voiceName: string }> {
  const trimmed = text.slice(0, 2000); // Google hard limit ~5000 bytes; stay safe
  const voice = pickVoiceForDNA(locale, dna);
  const key = cacheKey(trimmed, voice.name);

  const cached = cache.get(key);
  if (cached) {
    return { audio: cached, mimeType: "audio/mpeg", voiceName: voice.name };
  }

  const client = getClient();
  const [response] = await client.synthesizeSpeech({
    input: { ssml: buildSSML(trimmed, dna) },
    voice: { languageCode: voice.lang, name: voice.name },
    audioConfig: { audioEncoding: "MP3" },
  });

  if (!response.audioContent) {
    throw new Error("No audio content from Google TTS");
  }

  const audio =
    typeof response.audioContent === "string"
      ? Buffer.from(response.audioContent, "base64")
      : Buffer.from(response.audioContent);

  // LRU eviction: drop oldest until under cap
  cache.set(key, audio);
  cacheSize += audio.length;
  while (cacheSize > MAX_CACHE && cache.size > 1) {
    const firstKey = cache.keys().next().value;
    if (firstKey) {
      const v = cache.get(firstKey);
      if (v) cacheSize -= v.length;
      cache.delete(firstKey);
    }
  }

  return { audio, mimeType: "audio/mpeg", voiceName: voice.name };
}
