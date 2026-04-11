"use client";

import { useState } from "react";
import { Copy, Check, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface RecoveryPhraseDisplayProps {
  mnemonic: string;
  onConfirm: () => void;
}

export function RecoveryPhraseDisplay({ mnemonic, onConfirm }: RecoveryPhraseDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const words = mnemonic.split(" ");

  async function handleCopy() {
    await navigator.clipboard.writeText(mnemonic);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4 max-w-sm mx-auto">
      <div className="text-center space-y-2">
        <ShieldAlert className="h-8 w-8 text-primary mx-auto" />
        <h2 className="text-lg font-bold">Obnovovacia fráza</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Zapíšte si týchto 12 slov. Sú jediný spôsob, ako obnoviť
          vaše dáta, ak zabudnete heslo.
        </p>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-4 px-4">
          <div className="grid grid-cols-3 gap-2">
            {words.map((word, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-background border text-sm"
              >
                <span className="text-[10px] text-muted-foreground w-4 text-right">{i + 1}.</span>
                <span className="font-mono font-medium">{word}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Button
        variant="outline"
        size="sm"
        onClick={handleCopy}
        className="w-full gap-1.5"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? "Skopírované" : "Kopírovať"}
      </Button>

      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
        <p className="text-xs text-destructive leading-relaxed">
          Túto frázu vám už nikdy neukážeme. Ak stratíte heslo aj frázu,
          vaše šifrované dáta nie je možné obnoviť — nikým, vrátane nás.
        </p>
      </div>

      <label className="flex items-start gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-0.5 rounded border-border"
        />
        <span className="text-sm text-muted-foreground leading-snug">
          Zapísal/a som si obnovovaciu frázu na bezpečné miesto
        </span>
      </label>

      <Button
        onClick={onConfirm}
        disabled={!confirmed}
        className="w-full"
        size="lg"
      >
        Pokračovať
      </Button>
    </div>
  );
}
