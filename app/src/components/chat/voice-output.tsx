"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { getUserLanguage } from "@/lib/languages";
import type { SoundDNA } from "@/lib/avatar";

// Language code to BCP-47 for speech synthesis voice matching
const SPEECH_LOCALE_MAP: Record<string, string> = {
  sk: "sk-SK",
  cs: "cs-CZ",
  en: "en-US",
  de: "de-DE",
  fr: "fr-FR",
  es: "es-ES",
  it: "it-IT",
  pt: "pt-PT",
  pl: "pl-PL",
  hu: "hu-HU",
  ro: "ro-RO",
  tr: "tr-TR",
  uk: "uk-UA",
  hi: "hi-IN",
  ja: "ja-JP",
  ko: "ko-KR",
  zh: "zh-CN",
  ar: "ar-SA",
};

interface VoiceOutputProps {
  text: string;
  /** Souli's unique sound fingerprint — drives pitch/rate */
  soundDNA?: SoundDNA;
  /** Auto-play on mount (for latest message) */
  autoplay?: boolean;
}

/**
 * Map Souli's SoundDNA to Web Speech API parameters.
 * - basePitch (350-750 Hz) → utterance.pitch (0.6-1.4)
 * - tempo (0.8-1.3) → utterance.rate (0.85-1.25)
 * - timbre (square/sawtooth/triangle) → voice gender preference
 */
function dnaToSpeechParams(dna: SoundDNA) {
  // Normalize pitch: 350→0.6, 550→1.0, 750→1.4
  const pitch = Math.max(0.6, Math.min(1.4, 0.6 + ((dna.basePitch - 350) / 400) * 0.8));
  // Tempo already close to rate scale; clamp
  const rate = Math.max(0.85, Math.min(1.25, dna.tempo));
  // Sawtooth = rougher → prefer male voices, triangle = softer → female, square = neutral
  const voicePreference: "male" | "female" | "any" =
    dna.timbre === "sawtooth" ? "male" : dna.timbre === "triangle" ? "female" : "any";
  return { pitch, rate, voicePreference };
}

function pickVoiceForSouli(
  voices: SpeechSynthesisVoice[],
  lang: string,
  preference: "male" | "female" | "any",
): SpeechSynthesisVoice | null {
  const matches = voices.filter((v) => v.lang.startsWith(lang));
  if (matches.length === 0) return null;
  if (preference === "any") return matches[0];
  // Heuristic: voice names often contain hints
  const genderHints = {
    male: /male|man|miroslav|daniel|jakub|milan|paul|alex|david/i,
    female: /female|woman|katarina|iveta|lucie|zuzana|samantha|karen|eva|maria/i,
  };
  const preferred = matches.find((v) => genderHints[preference].test(v.name));
  return preferred || matches[0];
}

function isSpeechSynthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function VoiceOutput({ text, soundDNA, autoplay = false }: VoiceOutputProps) {
  const [supported, setSupported] = useState(false);
  const [playing, setPlaying] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setSupported(isSpeechSynthesisSupported());
  }, []);

  // Stop playback if component unmounts
  useEffect(() => {
    return () => {
      if (isSpeechSynthesisSupported()) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speakViaWebSpeech = useCallback((cleanText: string) => {
    if (!isSpeechSynthesisSupported()) return;
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utteranceRef.current = utterance;

    // Match voice to user's language
    const lang = getUserLanguage() || "sk";
    const locale = SPEECH_LOCALE_MAP[lang] || `${lang}-${lang.toUpperCase()}`;
    utterance.lang = locale;

    // Apply Souli-specific voice characteristics from SoundDNA
    if (soundDNA) {
      const params = dnaToSpeechParams(soundDNA);
      utterance.pitch = params.pitch;
      utterance.rate = params.rate;
      const voices = window.speechSynthesis.getVoices();
      const picked = pickVoiceForSouli(voices, lang, params.voicePreference);
      if (picked) utterance.voice = picked;
    } else {
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      const voices = window.speechSynthesis.getVoices();
      const matchingVoice = voices.find((v) => v.lang.startsWith(lang)) ||
        voices.find((v) => v.lang.startsWith(locale));
      if (matchingVoice) utterance.voice = matchingVoice;
    }

    utterance.onend = () => {
      setPlaying(false);
      utteranceRef.current = null;
    };

    utterance.onerror = () => {
      setPlaying(false);
      utteranceRef.current = null;
    };

    window.speechSynthesis.speak(utterance);
    setPlaying(true);
  }, [soundDNA]);

  const speak = useCallback(async () => {
    // Strip markdown for cleaner speech
    const cleanText = text
      .replace(/[#*_~`>]/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/\n+/g, ". ")
      .trim();
    if (!cleanText) return;

    const lang = getUserLanguage() || "sk";

    // Try server-side Google TTS first (neural quality)
    try {
      const res = await fetch("/api/voice/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: cleanText, locale: lang, soundDNA }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => {
          setPlaying(false);
          URL.revokeObjectURL(url);
          audioRef.current = null;
        };
        audio.onerror = () => {
          setPlaying(false);
          URL.revokeObjectURL(url);
          audioRef.current = null;
          // Fallback to Web Speech on playback error
          speakViaWebSpeech(cleanText);
        };
        setPlaying(true);
        await audio.play();
        return;
      }
    } catch {
      // Network / API failure — fall through to Web Speech
    }

    // Fallback: Web Speech API
    speakViaWebSpeech(cleanText);
  }, [text, soundDNA, speakViaWebSpeech]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (isSpeechSynthesisSupported()) {
      window.speechSynthesis.cancel();
    }
    setPlaying(false);
    utteranceRef.current = null;
  }, []);

  // Auto-play when requested (on new message arrival)
  useEffect(() => {
    if (!autoplay || !supported || !text) return;
    // Short delay so voices list is populated
    const timer = setTimeout(() => speak(), 150);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, autoplay, supported]);

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={playing ? stop : speak}
      className="inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md"
      aria-label={playing ? "Zastaviť čítanie" : "Prečítať nahlas"}
    >
      {playing ? (
        <VolumeX className="h-3.5 w-3.5" />
      ) : (
        <Volume2 className="h-3.5 w-3.5" />
      )}
    </button>
  );
}
