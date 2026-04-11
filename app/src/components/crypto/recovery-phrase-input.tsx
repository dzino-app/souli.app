"use client";

import { useState, useCallback } from "react";
import { ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { validateMnemonic } from "@/lib/bip39";

interface RecoveryPhraseInputProps {
  onSubmit: (mnemonic: string) => void | Promise<void>;
  loading?: boolean;
  error?: string;
}

export function RecoveryPhraseInput({ onSubmit, loading, error }: RecoveryPhraseInputProps) {
  const [words, setWords] = useState<string[]>(Array(12).fill(""));
  const [valid, setValid] = useState<boolean | null>(null);

  const handleChange = useCallback((index: number, value: string) => {
    const next = [...words];
    next[index] = value.toLowerCase().trim();
    setWords(next);
    setValid(null);
  }, [words]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text").trim();
    const pasted = text.split(/\s+/);
    if (pasted.length === 12) {
      e.preventDefault();
      setWords(pasted.map((w) => w.toLowerCase()));
      setValid(null);
    }
  }, []);

  async function handleValidateAndSubmit() {
    const mnemonic = words.join(" ");
    const isValid = await validateMnemonic(mnemonic);
    setValid(isValid);
    if (isValid) onSubmit(mnemonic);
  }

  const allFilled = words.every((w) => w.length > 0);

  return (
    <div className="space-y-4 max-w-sm mx-auto">
      <div className="text-center space-y-2">
        <ShieldCheck className="h-8 w-8 text-primary mx-auto" />
        <h2 className="text-lg font-bold">Obnovovacia fráza</h2>
        <p className="text-sm text-muted-foreground">
          Zadajte 12 slov z vašej obnovovacej frázy
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2" onPaste={handlePaste}>
        {words.map((word, i) => (
          <div key={i} className="flex items-center gap-1 text-sm">
            <span className="text-[10px] text-muted-foreground w-4 text-right shrink-0">{i + 1}.</span>
            <input
              type="text"
              value={word}
              onChange={(e) => handleChange(i, e.target.value)}
              autoComplete="off"
              className="w-full rounded border bg-background px-2 py-1.5 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        ))}
      </div>

      {valid === false && (
        <p className="text-sm text-destructive text-center">Neplatná obnovovacia fráza</p>
      )}
      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}

      <Button
        onClick={handleValidateAndSubmit}
        disabled={!allFilled || loading}
        className="w-full"
        size="lg"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        {loading ? "Obnovujem..." : "Obnoviť prístup"}
      </Button>
    </div>
  );
}
