"use client";

// 8-bit chiptune sounds generated with Web Audio API
// Each Souli gets a unique "voice" — SoundDNA stored with avatar data

import type { SoundDNA } from "@/lib/avatar";
import { getUserSettings } from "@/lib/user-settings";

/* eslint-disable @typescript-eslint/no-explicit-any */

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

function tone(
  dna: SoundDNA,
  freqOffset: number,
  duration: number,
  startTime: number,
  volume = 0.12,
  freqEndOffset?: number,
) {
  const ctx = getCtx();
  if (!ctx) return;

  const freq = dna.basePitch + freqOffset;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = dna.timbre;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
  if (freqEndOffset !== undefined) {
    osc.frequency.linearRampToValueAtTime(
      dna.basePitch + freqEndOffset,
      ctx.currentTime + startTime + duration
    );
  }

  gain.gain.setValueAtTime(volume, ctx.currentTime + startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime + startTime);
  osc.stop(ctx.currentTime + startTime + duration);
}

function t(duration: number, dna: SoundDNA): number {
  return duration * dna.tempo;
}

// Waving: ascending "hello!" jingle — 4 rising notes
function playWaving(dna: SoundDNA) {
  const s = dna.chirpRange;
  tone(dna, 0, t(0.1, dna), 0);
  tone(dna, s * 0.5, t(0.1, dna), t(0.1, dna));
  tone(dna, s, t(0.15, dna), t(0.2, dna));
  tone(dna, s * 1.5, t(0.2, dna), t(0.35, dna));
}

// Happy: bouncy celebration — ascending then a little fanfare
function playHappy(dna: SoundDNA) {
  const s = dna.chirpRange;
  const h = dna.harmonicShift * 0.5;
  tone(dna, 0, t(0.07, dna), 0);
  tone(dna, s * 0.4 + h, t(0.07, dna), t(0.07, dna));
  tone(dna, s * 0.8, t(0.07, dna), t(0.14, dna));
  tone(dna, s * 1.2 + h, t(0.07, dna), t(0.21, dna));
  tone(dna, s * 0.8, t(0.07, dna), t(0.28, dna));
  tone(dna, s * 1.2, t(0.12, dna), t(0.35, dna));
  tone(dna, s * 1.8 + h, t(0.18, dna), t(0.47, dna));
}

// Eating: "nom nom" — descending blips
function playEating(dna: SoundDNA) {
  const base = dna.basePitch * 0.5;
  const ctx = getCtx();
  if (!ctx) return;
  for (let i = 0; i < 3; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    const st = i * t(0.15, dna);
    osc.frequency.setValueAtTime(base + 80, ctx.currentTime + st);
    osc.frequency.linearRampToValueAtTime(base, ctx.currentTime + st + t(0.08, dna));
    gain.gain.setValueAtTime(0.08, ctx.currentTime + st);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + st + t(0.1, dna));
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + st);
    osc.stop(ctx.currentTime + st + t(0.1, dna));
  }
}

// Walking: rhythmic footstep pattern
function playWalking(dna: SoundDNA) {
  const base = dna.basePitch * 0.3;
  for (let i = 0; i < 4; i++) {
    const pitch = i % 2 === 0 ? base : base + 30;
    tone(dna, pitch - dna.basePitch, t(0.05, dna), i * t(0.12, dna), 0.08);
  }
}

// Thinking: slow mysterious wobble
function playThinking(dna: SoundDNA) {
  tone(dna, dna.chirpRange * 0.5, t(0.2, dna), 0, 0.06, 0);
  tone(dna, dna.chirpRange * 0.3, t(0.2, dna), t(0.25, dna), 0.06, -dna.chirpRange * 0.2);
  tone(dna, 0, t(0.3, dna), t(0.5, dna), 0.04, -dna.chirpRange * 0.3);
}

// Sad: slow descending minor tones
function playSad(dna: SoundDNA) {
  tone(dna, 0, t(0.2, dna), 0, 0.06);
  tone(dna, -dna.chirpRange * 0.2, t(0.2, dna), t(0.25, dna), 0.06);
  tone(dna, -dna.chirpRange * 0.5, t(0.3, dna), t(0.5, dna), 0.04);
}

// Talking: quick chirpy blips at the Souli's pitch
function playTalking(dna: SoundDNA) {
  const h = dna.harmonicShift * 0.3;
  tone(dna, dna.chirpRange * 0.3, t(0.04, dna), 0, 0.06);
  tone(dna, dna.chirpRange * 0.5 + h, t(0.04, dna), t(0.06, dna), 0.06);
  tone(dna, dna.chirpRange * 0.4, t(0.04, dna), t(0.12, dna), 0.06);
}

// Sleeping: very soft low pulse
function playSleeping(dna: SoundDNA) {
  const ctx = getCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(dna.basePitch * 0.4, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(dna.basePitch * 0.35, ctx.currentTime + 0.8);
  gain.gain.setValueAtTime(0.03, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.8);
}

const SOUND_MAP: Record<string, (dna: SoundDNA) => void> = {
  waving: playWaving,
  happy: playHappy,
  eating: playEating,
  walking: playWalking,
  thinking: playThinking,
  sad: playSad,
  talking: playTalking,
  sleeping: playSleeping,
};

export function playAvatarSound(state: string, dna: SoundDNA) {
  if (!getUserSettings().soundEnabled) return;
  const fn = SOUND_MAP[state];
  if (fn) fn(dna);
}

// Timer/stopwatch sounds
export function playTimerTick() {
  if (!getUserSettings().soundEnabled) return;
  const ctx = getCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(800, ctx.currentTime);
  gain.gain.setValueAtTime(0.05, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.05);
}

export function playTimerComplete() {
  if (!getUserSettings().soundEnabled) return;
  const ctx = getCtx();
  if (!ctx) return;
  // Victory fanfare
  const notes = [523, 659, 784, 1047, 1319];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
    gain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + i * 0.12);
    osc.stop(ctx.currentTime + i * 0.12 + 0.2);
  });
}

export function playStopwatchLap() {
  if (!getUserSettings().soundEnabled) return;
  const ctx = getCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(1200, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.1);
  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.15);
}
