"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { getUserLanguage } from "@/lib/languages";

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
}

function isSpeechSynthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function VoiceOutput({ text }: VoiceOutputProps) {
  const [supported, setSupported] = useState(false);
  const [playing, setPlaying] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

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

  const speak = useCallback(() => {
    if (!isSpeechSynthesisSupported()) return;

    // Strip markdown formatting for cleaner speech
    const cleanText = text
      .replace(/[#*_~`>]/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/\n+/g, ". ")
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utteranceRef.current = utterance;

    // Match voice to user's language
    const lang = getUserLanguage() || "sk";
    const locale = SPEECH_LOCALE_MAP[lang] || `${lang}-${lang.toUpperCase()}`;
    utterance.lang = locale;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Try to find a matching voice
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find((v) => v.lang.startsWith(lang)) ||
      voices.find((v) => v.lang.startsWith(locale));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
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
  }, [text]);

  const stop = useCallback(() => {
    if (isSpeechSynthesisSupported()) {
      window.speechSynthesis.cancel();
    }
    setPlaying(false);
    utteranceRef.current = null;
  }, []);

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
