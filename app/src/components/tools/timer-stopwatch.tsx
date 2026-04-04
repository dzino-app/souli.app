"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Play, Pause, RotateCcw, Timer, Clock, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { playTimerTick, playTimerComplete, playStopwatchLap } from "@/lib/pixel-sounds";

type Mode = "timer" | "stopwatch";

function formatTime(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}

interface TimerStopwatchProps {
  /** Pre-set timer duration in seconds (from chat) */
  initialSeconds?: number;
  /** Label shown above the timer */
  label?: string;
  /** Called when timer completes */
  onComplete?: () => void;
  /** Allow dismissing */
  onDismiss?: () => void;
}

export function TimerStopwatch({ initialSeconds, label, onComplete, onDismiss }: TimerStopwatchProps) {
  const [mode, setMode] = useState<Mode>(initialSeconds ? "timer" : "stopwatch");
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0); // ms for stopwatch
  const [remaining, setRemaining] = useState((initialSeconds || 0) * 1000); // ms for timer
  const [laps, setLaps] = useState<number[]>([]);
  const [completed, setCompleted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTickRef = useRef(0);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setRunning(false);
  }, []);

  const start = useCallback(() => {
    if (completed) return;
    setRunning(true);
    const startTime = Date.now();
    const startElapsed = elapsed;
    const startRemaining = remaining;

    intervalRef.current = setInterval(() => {
      const delta = Date.now() - startTime;

      if (mode === "stopwatch") {
        setElapsed(startElapsed + delta);
      } else {
        const newRemaining = startRemaining - delta;
        setRemaining(newRemaining);

        // Tick sound every second in last 10 seconds
        if (newRemaining <= 10000 && newRemaining > 0) {
          const sec = Math.floor(newRemaining / 1000);
          if (sec !== lastTickRef.current) {
            lastTickRef.current = sec;
            playTimerTick();
          }
        }

        if (newRemaining <= 0) {
          setRemaining(0);
          setCompleted(true);
          setRunning(false);
          if (intervalRef.current) clearInterval(intervalRef.current);
          playTimerComplete();
          onComplete?.();
        }
      }
    }, 50);
  }, [mode, elapsed, remaining, completed, onComplete]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  function reset() {
    stop();
    setElapsed(0);
    setRemaining((initialSeconds || 0) * 1000);
    setLaps([]);
    setCompleted(false);
    lastTickRef.current = 0;
  }

  function lap() {
    playStopwatchLap();
    setLaps((prev) => [...prev, elapsed]);
  }

  function switchMode(m: Mode) {
    stop();
    setMode(m);
    setElapsed(0);
    setRemaining((initialSeconds || 0) * 1000);
    setLaps([]);
    setCompleted(false);
  }

  // Quick timer presets (in seconds)
  const presets = [60, 120, 300, 600];

  const displayTime = mode === "timer" ? formatTime(remaining) : formatTime(elapsed);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardContent className="py-4 px-4">
        {/* Label */}
        {label && (
          <p className="text-xs text-muted-foreground text-center mb-2">{label}</p>
        )}

        {/* Mode toggle (only if no preset timer) */}
        {!initialSeconds && (
          <div className="flex justify-center gap-1 mb-3">
            <button
              onClick={() => switchMode("timer")}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs transition-colors ${
                mode === "timer" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              }`}
            >
              <Timer className="h-3 w-3" /> Timer
            </button>
            <button
              onClick={() => switchMode("stopwatch")}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs transition-colors ${
                mode === "stopwatch" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              }`}
            >
              <Clock className="h-3 w-3" /> Stopky
            </button>
          </div>
        )}

        {/* Timer presets */}
        {mode === "timer" && !running && !completed && remaining === 0 && !initialSeconds && (
          <div className="flex justify-center gap-2 mb-3">
            {presets.map((s) => (
              <button
                key={s}
                onClick={() => setRemaining(s * 1000)}
                className="px-2.5 py-1 rounded-full text-xs bg-secondary hover:bg-secondary/80 transition-colors"
              >
                {s >= 60 ? `${s / 60}min` : `${s}s`}
              </button>
            ))}
          </div>
        )}

        {/* Display */}
        <div className="text-center mb-3">
          <p className={`text-4xl font-mono font-bold tabular-nums ${
            completed ? "text-green-600 animate-pulse" :
            remaining <= 10000 && mode === "timer" && running ? "text-destructive" :
            "text-foreground"
          }`}>
            {displayTime}
          </p>
          {completed && (
            <p className="text-sm text-green-600 mt-1">Hotovo!</p>
          )}
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-2">
          {!running && !completed && (
            <Button
              size="sm"
              onClick={start}
              disabled={mode === "timer" && remaining === 0}
              className="gap-1"
            >
              <Play className="h-3.5 w-3.5" /> Štart
            </Button>
          )}
          {running && (
            <Button size="sm" variant="outline" onClick={stop} className="gap-1">
              <Pause className="h-3.5 w-3.5" /> Pauza
            </Button>
          )}
          {mode === "stopwatch" && running && (
            <Button size="sm" variant="outline" onClick={lap} className="gap-1">
              <Flag className="h-3.5 w-3.5" /> Lap
            </Button>
          )}
          {(elapsed > 0 || remaining !== (initialSeconds || 0) * 1000 || completed) && (
            <Button size="sm" variant="ghost" onClick={reset} className="gap-1">
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </Button>
          )}
          {onDismiss && (
            <Button size="sm" variant="ghost" onClick={onDismiss} className="text-xs">
              Zavrieť
            </Button>
          )}
        </div>

        {/* Laps */}
        {laps.length > 0 && (
          <div className="mt-3 space-y-1">
            {laps.map((lapMs, i) => (
              <div key={i} className="flex justify-between text-xs text-muted-foreground px-2">
                <span>Lap {i + 1}</span>
                <span className="font-mono">{formatTime(lapMs)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
