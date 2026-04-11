"use client";

// 8-bit chiptune sounds generated with Web Audio API
// Each Souli gets a unique "voice" — SoundDNA stored with avatar data
// Score-based design lets us play live OR render offline to a WAV blob.

import type { SoundDNA } from "@/lib/avatar";
import { getUserSettings } from "@/lib/user-settings";

/* eslint-disable @typescript-eslint/no-explicit-any */

// ── Score format ──────────────────────────────────────────────────────────

interface SoundEvent {
  type: OscillatorType;
  freqStart: number;
  freqEnd?: number;
  start: number;
  duration: number;
  volume: number;
}

interface Score {
  events: SoundEvent[];
  duration: number;
}

function ev(s: Partial<SoundEvent> & { freqStart: number; start: number; duration: number }): SoundEvent {
  return {
    type: "square",
    volume: 0.1,
    ...s,
  };
}

function score(events: SoundEvent[], pad = 0.1): Score {
  let end = 0;
  for (const e of events) end = Math.max(end, e.start + e.duration);
  return { events, duration: end + pad };
}

function t(duration: number, dna: SoundDNA): number {
  return duration * dna.tempo;
}

// ── Score composers (one per activity) ────────────────────────────────────

function composeWaving(dna: SoundDNA): Score {
  const s = dna.chirpRange;
  const b = dna.basePitch;
  return score([
    ev({ type: dna.timbre, freqStart: b,             start: 0,             duration: t(0.1, dna) }),
    ev({ type: dna.timbre, freqStart: b + s * 0.5,   start: t(0.1, dna),   duration: t(0.1, dna) }),
    ev({ type: dna.timbre, freqStart: b + s,         start: t(0.2, dna),   duration: t(0.15, dna) }),
    ev({ type: dna.timbre, freqStart: b + s * 1.5,   start: t(0.35, dna),  duration: t(0.2, dna) }),
  ]);
}

function composeHappy(dna: SoundDNA): Score {
  const s = dna.chirpRange;
  const h = dna.harmonicShift * 0.5;
  const b = dna.basePitch;
  return score([
    ev({ type: dna.timbre, freqStart: b,                  start: 0,             duration: t(0.07, dna) }),
    ev({ type: dna.timbre, freqStart: b + s * 0.4 + h,    start: t(0.07, dna),  duration: t(0.07, dna) }),
    ev({ type: dna.timbre, freqStart: b + s * 0.8,        start: t(0.14, dna),  duration: t(0.07, dna) }),
    ev({ type: dna.timbre, freqStart: b + s * 1.2 + h,    start: t(0.21, dna),  duration: t(0.07, dna) }),
    ev({ type: dna.timbre, freqStart: b + s * 0.8,        start: t(0.28, dna),  duration: t(0.07, dna) }),
    ev({ type: dna.timbre, freqStart: b + s * 1.2,        start: t(0.35, dna),  duration: t(0.12, dna) }),
    ev({ type: dna.timbre, freqStart: b + s * 1.8 + h,    start: t(0.47, dna),  duration: t(0.18, dna) }),
  ]);
}

function composeEating(dna: SoundDNA): Score {
  const base = dna.basePitch * 0.5;
  const events: SoundEvent[] = [];
  for (let i = 0; i < 3; i++) {
    const st = i * t(0.15, dna);
    events.push(ev({
      type: "sawtooth",
      freqStart: base + 80,
      freqEnd: base,
      start: st,
      duration: t(0.1, dna),
      volume: 0.08,
    }));
  }
  return score(events);
}

function composeWalking(dna: SoundDNA): Score {
  const base = dna.basePitch * 0.3;
  const events: SoundEvent[] = [];
  for (let i = 0; i < 4; i++) {
    const pitch = i % 2 === 0 ? base : base + 30;
    events.push(ev({
      type: dna.timbre,
      freqStart: pitch,
      start: i * t(0.12, dna),
      duration: t(0.05, dna),
      volume: 0.08,
    }));
  }
  return score(events);
}

function composeThinking(dna: SoundDNA): Score {
  const b = dna.basePitch;
  const c = dna.chirpRange;
  return score([
    ev({ type: dna.timbre, freqStart: b + c * 0.5, freqEnd: b + c * 0.5, start: 0,            duration: t(0.2, dna), volume: 0.06 }),
    ev({ type: dna.timbre, freqStart: b + c * 0.3, freqEnd: b + c * 0.1, start: t(0.25, dna), duration: t(0.2, dna), volume: 0.06 }),
    ev({ type: dna.timbre, freqStart: b,           freqEnd: b - c * 0.3, start: t(0.5, dna),  duration: t(0.3, dna), volume: 0.04 }),
  ]);
}

function composeSad(dna: SoundDNA): Score {
  const b = dna.basePitch;
  const c = dna.chirpRange;
  return score([
    ev({ type: dna.timbre, freqStart: b,             start: 0,            duration: t(0.2, dna), volume: 0.06 }),
    ev({ type: dna.timbre, freqStart: b - c * 0.2,   start: t(0.25, dna), duration: t(0.2, dna), volume: 0.06 }),
    ev({ type: dna.timbre, freqStart: b - c * 0.5,   start: t(0.5, dna),  duration: t(0.3, dna), volume: 0.04 }),
  ]);
}

function composeTalking(dna: SoundDNA): Score {
  const b = dna.basePitch;
  const c = dna.chirpRange;
  const h = dna.harmonicShift * 0.3;
  return score([
    ev({ type: dna.timbre, freqStart: b + c * 0.3,     start: 0,            duration: t(0.04, dna), volume: 0.06 }),
    ev({ type: dna.timbre, freqStart: b + c * 0.5 + h, start: t(0.06, dna), duration: t(0.04, dna), volume: 0.06 }),
    ev({ type: dna.timbre, freqStart: b + c * 0.4,     start: t(0.12, dna), duration: t(0.04, dna), volume: 0.06 }),
  ]);
}

function composeSleeping(dna: SoundDNA): Score {
  return score([
    ev({
      type: "sine",
      freqStart: dna.basePitch * 0.4,
      freqEnd: dna.basePitch * 0.35,
      start: 0,
      duration: 0.8,
      volume: 0.03,
    }),
  ]);
}

function composeIdle(dna: SoundDNA): Score {
  // Soft two-note hum at the Souli's base pitch
  return score([
    ev({ type: "triangle", freqStart: dna.basePitch * 0.6, start: 0,           duration: t(0.18, dna), volume: 0.04 }),
    ev({ type: "triangle", freqStart: dna.basePitch * 0.7, start: t(0.2, dna), duration: t(0.18, dna), volume: 0.04 }),
  ]);
}

function composeDancing(dna: SoundDNA): Score {
  // Upbeat 8-bit dance loop: bass thump + melodic skips + claps
  const b = dna.basePitch;
  const s = dna.chirpRange;
  const h = dna.harmonicShift * 0.4;
  const events: SoundEvent[] = [];
  const beat = t(0.12, dna);

  // 8-step melody (root → 5th → octave → 5th, twice with variation)
  const melody = [0, s * 0.5, s, s * 0.5, h, s * 0.6, s * 1.2 + h, s * 0.8];
  melody.forEach((offset, i) => {
    events.push(ev({
      type: dna.timbre,
      freqStart: b + offset,
      start: i * beat,
      duration: beat * 0.85,
      volume: 0.09,
    }));
  });

  // Bass thump on beats 1, 3, 5, 7
  for (let i = 0; i < 4; i++) {
    events.push(ev({
      type: "sawtooth",
      freqStart: b * 0.35,
      freqEnd: b * 0.25,
      start: i * beat * 2,
      duration: beat * 0.5,
      volume: 0.1,
    }));
  }

  // Hi-hat clicks on off-beats (square wave at high freq, very short)
  for (let i = 0; i < 4; i++) {
    events.push(ev({
      type: "square",
      freqStart: 2200,
      start: i * beat * 2 + beat,
      duration: 0.02,
      volume: 0.05,
    }));
  }

  return score(events);
}

const SCORE_MAP: Record<string, (dna: SoundDNA) => Score> = {
  idle: composeIdle,
  waving: composeWaving,
  happy: composeHappy,
  dancing: composeDancing,
  eating: composeEating,
  walking: composeWalking,
  thinking: composeThinking,
  sad: composeSad,
  talking: composeTalking,
  sleeping: composeSleeping,
};

export function composeAvatarScore(state: string, dna: SoundDNA): Score | null {
  const fn = SCORE_MAP[state];
  return fn ? fn(dna) : null;
}

// ── Live playback ─────────────────────────────────────────────────────────

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

function scheduleEvent(ctx: BaseAudioContext, e: SoundEvent, t0: number, destination: AudioNode) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = e.type;
  osc.frequency.setValueAtTime(e.freqStart, t0 + e.start);
  if (e.freqEnd !== undefined) {
    osc.frequency.linearRampToValueAtTime(e.freqEnd, t0 + e.start + e.duration);
  }

  gain.gain.setValueAtTime(e.volume, t0 + e.start);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + e.start + e.duration);

  osc.connect(gain);
  gain.connect(destination);
  osc.start(t0 + e.start);
  osc.stop(t0 + e.start + e.duration);
}

function playScore(s: Score) {
  const ctx = getCtx();
  if (!ctx) return;
  const t0 = ctx.currentTime;
  for (const e of s.events) scheduleEvent(ctx, e, t0, ctx.destination);
}

export function playAvatarSound(state: string, dna: SoundDNA) {
  if (!getUserSettings().soundEnabled) return;
  const s = composeAvatarScore(state, dna);
  if (s) playScore(s);
}

// ── Offline rendering to WAV ──────────────────────────────────────────────

const SAMPLE_RATE = 44100;

async function renderScoreToBuffer(s: Score): Promise<AudioBuffer | null> {
  if (typeof window === "undefined") return null;
  const OfflineCtx =
    (window as any).OfflineAudioContext || (window as any).webkitOfflineAudioContext;
  if (!OfflineCtx) return null;

  const length = Math.ceil(s.duration * SAMPLE_RATE);
  const ctx: OfflineAudioContext = new OfflineCtx(1, length, SAMPLE_RATE);
  for (const e of s.events) scheduleEvent(ctx, e, 0, ctx.destination);
  return await ctx.startRendering();
}

function audioBufferToWav(buffer: AudioBuffer): Uint8Array {
  const channels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const samples = buffer.length;
  const bytesPerSample = 2;
  const dataSize = samples * channels * bytesPerSample;
  const blockAlign = channels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;

  const out = new Uint8Array(44 + dataSize);
  const view = new DataView(out.buffer);

  // RIFF header
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, "WAVE");
  // fmt chunk
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);          // PCM chunk size
  view.setUint16(20, 1, true);           // PCM format
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);          // bits per sample
  // data chunk
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  // Interleaved PCM samples
  let offset = 44;
  const channelData: Float32Array[] = [];
  for (let c = 0; c < channels; c++) channelData.push(buffer.getChannelData(c));
  for (let i = 0; i < samples; i++) {
    for (let c = 0; c < channels; c++) {
      let sample = Math.max(-1, Math.min(1, channelData[c][i]));
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, sample, true);
      offset += 2;
    }
  }
  return out;
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
}

export async function renderAvatarSoundToWav(
  state: string,
  dna: SoundDNA,
): Promise<Blob | null> {
  const s = composeAvatarScore(state, dna);
  if (!s) return null;
  const buf = await renderScoreToBuffer(s);
  if (!buf) return null;
  const wav = audioBufferToWav(buf);
  return new Blob([wav.buffer as ArrayBuffer], { type: "audio/wav" });
}

export async function downloadAvatarSound(
  name: string,
  state: string,
  dna: SoundDNA,
): Promise<void> {
  const blob = await renderAvatarSoundToWav(state, dna);
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}-${state}.wav`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function uploadAvatarSound(
  avatarId: string,
  state: string,
  dna: SoundDNA,
): Promise<string | null> {
  try {
    const blob = await renderAvatarSoundToWav(state, dna);
    if (!blob) return null;
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();

    const path = `sounds/${avatarId}/${state}.wav`;
    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, blob, {
        contentType: "audio/wav",
        upsert: true,
      });
    if (error) return null;

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    return data.publicUrl;
  } catch {
    return null;
  }
}

// ── Timer / stopwatch sounds (independent, kept as-is) ────────────────────

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
