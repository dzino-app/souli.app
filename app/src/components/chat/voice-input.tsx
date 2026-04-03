"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getUserLanguage } from "@/lib/languages";

const SPEECH_LOCALE_MAP: Record<string, string> = {
  sk: "sk-SK", cs: "cs-CZ", en: "en-US", de: "de-DE",
  fr: "fr-FR", es: "es-ES", it: "it-IT", pt: "pt-PT",
  pl: "pl-PL", hu: "hu-HU", ro: "ro-RO", tr: "tr-TR",
  uk: "uk-UA", hi: "hi-IN", ja: "ja-JP", ko: "ko-KR",
  zh: "zh-CN", ar: "ar-SA", bn: "bn-BD", ta: "ta-IN", te: "te-IN",
  hr: "hr-HR", sl: "sl-SI", mr: "mr-IN",
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
  const transcriptRef = useRef<string>("");
  const sentRef = useRef(false);

  useEffect(() => {
    setSupported(getSpeechRecognitionCtor() !== null);
  }, []);

  const sendTranscript = useCallback(() => {
    const text = transcriptRef.current.trim();
    if (text && !sentRef.current) {
      sentRef.current = true;
      onTranscript(text);
    }
  }, [onTranscript]);

  const startListening = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;

    const recognition = new Ctor();
    recognitionRef.current = recognition;
    transcriptRef.current = "";
    sentRef.current = false;

    // Set language
    const lang = getUserLanguage() || "en";
    recognition.lang = SPEECH_LOCALE_MAP[lang] || `${lang}-${lang.toUpperCase()}`;
    recognition.continuous = false;
    recognition.interimResults = false; // only final results — more reliable

    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      transcriptRef.current = transcript;
    };

    recognition.onend = () => {
      setListening(false);
      // Send whatever we have when recognition ends
      sendTranscript();
      recognitionRef.current = null;
    };

    recognition.onerror = (event: any) => {
      // "no-speech" is common — not a real error
      if (event.error !== "no-speech") {
        console.warn("Speech recognition error:", event.error);
      }
      setListening(false);
      recognitionRef.current = null;
    };

    try {
      recognition.start();
      setListening(true);
    } catch {
      // Already started or not available
      setListening(false);
    }
  }, [sendTranscript]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

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
