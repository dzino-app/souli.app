/**
 * Soul Knowledge Base compilation engine.
 * Implements Karpathy's LLM-Wiki pattern:
 * - Periodically compiles soul files + recent messages into _index.md
 * - _index.md serves as a structured summary for fast retrieval
 * - _log.md tracks compilation history
 */

import { getSoulFile, saveSoulFile } from "./soul";

// ---- Types ----

export interface CompilationState {
  lastCompiledAt: string; // ISO timestamp
  lastMsgCount: number; // messages processed so far
  version: number;
}

export interface CompilationResult {
  index: string;
  updates: SoulUpdate[];
  log: string;
}

export interface SoulUpdate {
  slug: string;
  operation: "pridat" | "nahradit";
  content: string;
}

// ---- Constants ----

const COMPILE_COUNTER_KEY = "dzino_compile_counter";
const COMPILE_STATE_KEY = "dzino_compile_state";
const COMPILE_THRESHOLD = 10; // messages before next compile
const COMPILE_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

// ---- State management ----

function getCompileCounter(): number {
  if (typeof window === "undefined") return 0;
  const raw = localStorage.getItem(COMPILE_COUNTER_KEY);
  return raw ? parseInt(raw, 10) : 0;
}

function setCompileCounter(count: number): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(COMPILE_COUNTER_KEY, String(count));
}

export function getCompilationState(): CompilationState | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(COMPILE_STATE_KEY);
  return raw ? JSON.parse(raw) : null;
}

function setCompilationState(state: CompilationState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(COMPILE_STATE_KEY, JSON.stringify(state));
}

// ---- Public API ----

/**
 * Increment the message counter. Called after each user message.
 */
export function incrementCompileCounter(): void {
  setCompileCounter(getCompileCounter() + 1);
}

/**
 * Check if compilation is needed.
 * Returns true if:
 * - Message counter >= COMPILE_THRESHOLD since last compile
 * - OR >24h since lastCompiledAt
 */
export function shouldCompile(): boolean {
  const counter = getCompileCounter();
  const state = getCompilationState();

  // If never compiled, compile after threshold messages
  if (!state) {
    return counter >= COMPILE_THRESHOLD;
  }

  // Check message threshold
  if (counter >= COMPILE_THRESHOLD) {
    return true;
  }

  // Check time threshold (24h)
  const elapsed = Date.now() - new Date(state.lastCompiledAt).getTime();
  if (elapsed >= COMPILE_INTERVAL_MS && counter > 0) {
    return true;
  }

  return false;
}

/**
 * Trigger compilation (async, non-blocking).
 * Calls POST /api/soul/compile and stores the result.
 */
export async function triggerCompilation(): Promise<void> {
  try {
    const response = await fetch("/api/soul/compile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      console.warn("[soul-compiler] Compilation failed:", response.status);
      return;
    }

    const result: CompilationResult = await response.json();

    // Store _index.md
    if (result.index) {
      await saveSoulFile("_index", result.index, "dzino");
    }

    // Store _log.md (append to existing)
    if (result.log) {
      const existingLog = getSoulFile("_log");
      const newLogContent = existingLog
        ? existingLog.content.trimEnd() + "\n\n" + result.log
        : "# Compilation Log\n\n" + result.log;
      await saveSoulFile("_log", newLogContent, "dzino");
    }

    // Apply cascading soul updates
    if (result.updates && result.updates.length > 0) {
      const { appendToSoulFile, updateSoulFile } = await import("./soul");
      for (const update of result.updates) {
        if (update.operation === "nahradit") {
          await updateSoulFile(update.slug, update.content, "dzino");
        } else {
          await appendToSoulFile(update.slug, update.content, "dzino");
        }
      }
    }

    // Update state
    const prevState = getCompilationState();
    setCompilationState({
      lastCompiledAt: new Date().toISOString(),
      lastMsgCount: (prevState?.lastMsgCount ?? 0) + getCompileCounter(),
      version: (prevState?.version ?? 0) + 1,
    });

    // Reset counter
    setCompileCounter(0);
  } catch (err) {
    console.warn("[soul-compiler] Compilation error:", err);
  }
}

/**
 * Get the current _index.md content (from cache or null).
 */
export function getIndexContent(): string | null {
  const file = getSoulFile("_index");
  return file?.content ?? null;
}
