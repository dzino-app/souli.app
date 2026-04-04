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
  const manualStopRef = useRef(false);

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
    manualStopRef.current = false;

    const lang = getUserLanguage() || "en";
    recognition.lang = SPEECH_LOCALE_MAP[lang] || `${lang}-${lang.toUpperCase()}`;
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      transcriptRef.current = transcript;
    };

    recognition.onend = () => {
      if (!manualStopRef.current) {
        // Browser stopped recognition unexpectedly (e.g. silence timeout)
        // Restart it to keep listening
        try {
          recognition.start();
          return;
        } catch {
          // Can't restart — fall through to cleanup
        }
      }
      setListening(false);
      sendTranscript();
      recognitionRef.current = null;
    };

    recognition.onerror = (event: any) => {
      if (event.error === "no-speech" || event.error === "aborted") {
        // Not real errors — ignore
        return;
      }
      console.warn("Speech recognition error:", event.error);
      setListening(false);
      recognitionRef.current = null;
    };

    try {
      recognition.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }, [sendTranscript]);

  const stopListening = useCallback(() => {
    manualStopRef.current = true;
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
      aria-label={listening ? "Stop recording" : "Voice input"}
    >
      {listening ? (
        <MicOff className="h-4 w-4" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </Button>
  );
}
