"use client";

/**
 * AR sensor utilities — brightness analysis, motion/tilt, audio loudness.
 * Used to make the Souli reactive to its real-world environment.
 */

export interface ARSensorSnapshot {
  /** 0-255 average luminance of the camera frame */
  brightness: number;
  /** Phone tilt in degrees: beta = front/back, gamma = left/right */
  tilt: { beta: number; gamma: number };
  /** Recent shake intensity (0-1) */
  shake: number;
  /** Ambient sound level (0-1), 0 if mic not available */
  loudness: number;
}

/**
 * Compute average luminance from a video frame by sampling pixels on an
 * offscreen canvas. Fast — samples a small 32×18 grid, not every pixel.
 */
export function measureBrightness(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
): number {
  if (!video.videoWidth) return 128;
  const w = 32;
  const h = 18;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return 128;

  ctx.drawImage(video, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;

  let sum = 0;
  const count = data.length / 4;
  for (let i = 0; i < data.length; i += 4) {
    // Rec. 709 luma
    sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
  }
  return sum / count;
}

/**
 * Request permission for DeviceMotion on iOS (requires user gesture).
 * On Android / other browsers, resolves immediately.
 */
export async function requestMotionPermission(): Promise<boolean> {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const DM = (window as any).DeviceMotionEvent;
  const DO = (window as any).DeviceOrientationEvent;
  if (DM && typeof DM.requestPermission === "function") {
    try {
      const result = await DM.requestPermission();
      return result === "granted";
    } catch {
      return false;
    }
  }
  if (DO && typeof DO.requestPermission === "function") {
    try {
      const result = await DO.requestPermission();
      return result === "granted";
    } catch {
      return false;
    }
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */
  return true;
}

/**
 * Request microphone access and return an AnalyserNode for loudness sampling.
 * Returns null if unavailable or denied.
 */
export async function initAudioAnalyser(): Promise<AnalyserNode | null> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const ctx = new AudioContext();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    return analyser;
  } catch {
    return null;
  }
}

/**
 * Measure current loudness from an analyser (0-1 normalized).
 */
export function measureLoudness(analyser: AnalyserNode): number {
  const bufferLength = analyser.frequencyBinCount;
  const data = new Uint8Array(bufferLength);
  analyser.getByteFrequencyData(data);
  let sum = 0;
  for (let i = 0; i < bufferLength; i++) sum += data[i];
  return Math.min(1, sum / bufferLength / 128);
}

import type { AvatarState } from "./avatar";

/**
 * Pick an avatar state based on sensor readings.
 */
export function pickReactiveState(snap: ARSensorSnapshot): AvatarState {
  // Loud → cover ears (sad proxy — closest expression we have)
  if (snap.loudness > 0.7) return "sad";
  // Shake → dance with excitement
  if (snap.shake > 0.6) return "dancing";
  // Very dark → sleeping
  if (snap.brightness < 40) return "sleeping";
  // Very bright / sunny → happy
  if (snap.brightness > 180) return "happy";
  // Gentle tilt → thinking (pondering the world)
  if (Math.abs(snap.tilt.gamma) > 25) return "thinking";
  // Default
  return "idle";
}
