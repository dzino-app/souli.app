"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getUserLanguage } from "@/lib/languages";

// Language code to BCP-47 speech recognition locale
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
  bn: "bn-BD",
  ta: "ta-IN",
  te: "te-IN",
};

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

function getSpeechRecognitionCtor(): (new () => any) | null {
  if (typeof window === "undefined") return null;
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function VoiceInput({ onTranscript, disabled }: VoiceInputProps) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    setSupported(getSpeechRecognitionCtor() !== null);
  }, []);

  const startListening = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;

    const recognition = new Ctor();
    recognitionRef.current = recognition;

    // Detect language from soul preferences
    const lang = getUserLanguage() || "sk";
    recognition.lang = SPEECH_LOCALE_MAP[lang] || `${lang}-${lang.toUpperCase()}`;
    recognition.continuous = false;
    recognition.interimResults = true;

    let finalTranscript = "";

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        }
      }
      // When we have a final result, send it
      if (finalTranscript) {
        onTranscript(finalTranscript.trim());
        finalTranscript = "";
      }
    };

    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };

    recognition.onerror = () => {
      setListening(false);
      recognitionRef.current = null;
    };

    recognition.start();
    setListening(true);
  }, [onTranscript]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setListening(false);
  }, []);

  // Hide button if not supported
  if (!supported) return null;

  return (
    <Button
      type="button"
      size="icon"
      variant={listening ? "destructive" : "outline"}
      className={`rounded-full h-10 w-10 shrink-0 ${listening ? "animate-pulse" : ""}`}
      disabled={disabled}
      onClick={listening ? stopListening : startListening}
      aria-label={listening ? "Zastaviť nahrávanie" : "Hlasový vstup"}
    >
      {listening ? (
        <MicOff className="h-4 w-4" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </Button>
  );
}
