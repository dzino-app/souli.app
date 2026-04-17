"use client";

import { useEffect, useRef, useState } from "react";
import {
  measureBrightness,
  requestMotionPermission,
  initAudioAnalyser,
  measureLoudness,
  type ARSensorSnapshot,
} from "@/lib/ar-sensors";

const TICK_MS = 100;

interface UseARSensorsOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  enabled: boolean;
  enableAudio?: boolean;
}

export function useARSensors({
  videoRef,
  enabled,
  enableAudio = false,
}: UseARSensorsOptions): ARSensorSnapshot {
  const [snap, setSnap] = useState<ARSensorSnapshot>({
    brightness: 128,
    tilt: { beta: 0, gamma: 0 },
    shake: 0,
    loudness: 0,
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const tiltRef = useRef({ beta: 0, gamma: 0 });
  const shakeRef = useRef(0);
  const lastAccelRef = useRef({ x: 0, y: 0, z: 0, t: 0 });

  useEffect(() => {
    if (!enabled) return;

    canvasRef.current = document.createElement("canvas");

    let cancelled = false;

    const onOrientation = (e: DeviceOrientationEvent) => {
      tiltRef.current = {
        beta: e.beta ?? 0,
        gamma: e.gamma ?? 0,
      };
    };

    const onMotion = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity;
      if (!a) return;
      const now = performance.now();
      const dt = now - lastAccelRef.current.t;
      if (dt < 16) return;
      const dx = (a.x ?? 0) - lastAccelRef.current.x;
      const dy = (a.y ?? 0) - lastAccelRef.current.y;
      const dz = (a.z ?? 0) - lastAccelRef.current.z;
      const magnitude = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const normalized = Math.min(1, magnitude / 25);
      shakeRef.current = Math.max(normalized, shakeRef.current * 0.8);
      lastAccelRef.current = { x: a.x ?? 0, y: a.y ?? 0, z: a.z ?? 0, t: now };
    };

    requestMotionPermission().then((granted) => {
      if (cancelled || !granted) return;
      window.addEventListener("deviceorientation", onOrientation);
      window.addEventListener("devicemotion", onMotion);
    });

    if (enableAudio) {
      initAudioAnalyser().then((analyser) => {
        if (cancelled) return;
        analyserRef.current = analyser;
      });
    }

    const interval = setInterval(() => {
      if (cancelled) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) return;

      const brightness = measureBrightness(video, canvas);
      const loudness = analyserRef.current ? measureLoudness(analyserRef.current) : 0;

      setSnap({
        brightness,
        tilt: { ...tiltRef.current },
        shake: shakeRef.current,
        loudness,
      });

      shakeRef.current *= 0.9;
    }, TICK_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener("deviceorientation", onOrientation);
      window.removeEventListener("devicemotion", onMotion);
    };
  }, [enabled, enableAudio, videoRef]);

  return snap;
}
