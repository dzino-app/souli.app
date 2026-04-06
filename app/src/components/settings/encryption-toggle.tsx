"use client";

import { useState, useEffect } from "react";
import { Lock, Unlock, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { clearCryptoSession } from "@/lib/crypto-session";
import { readAllSoulFiles, writeSoulFile } from "@/lib/supabase/soul-storage";

export function EncryptionToggle() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [migrating, setMigrating] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("user_crypto")
        .select("encryption_enabled")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => {
          setEnabled(data?.encryption_enabled !== false);
        });
    });
  }, []);

  async function disableEncryption() {
    setMigrating(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setMigrating(false); return; }

    try {
      // Read all soul files with current key (decrypts automatically)
      const files = (await readAllSoulFiles()) ?? [];

      // Mark encryption as disabled
      await supabase
        .from("user_crypto")
        .update({ encryption_enabled: false })
        .eq("user_id", user.id);

      // Clear the crypto session so future writes are plaintext
      clearCryptoSession();

      // Re-write all files as plaintext
      for (const file of files) {
        await writeSoulFile(file.slug, file.content, file.updatedBy);
      }

      setEnabled(false);
      setConfirming(false);
    } catch (err) {
      console.error("Failed to disable encryption:", err);
    }
    setMigrating(false);
  }

  if (enabled === null) return null;

  return (
    <Card>
      <CardContent className="py-4 px-4 space-y-3">
        <div className="flex items-start gap-3">
          {enabled ? (
            <Lock className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
          ) : (
            <Unlock className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p className="text-sm font-medium">
              {enabled ? "End-to-end šifrovanie je aktívne" : "Šifrovanie je vypnuté"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {enabled
                ? "Tvoje dáta sú šifrované. Nikto, ani my, ich nevie prečítať."
                : "Tvoje dáta sú uložené nešifrované. Administrátori ich môžu vidieť."}
            </p>
          </div>
        </div>

        {enabled && !confirming && (
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={() => setConfirming(true)}
          >
            Vypnúť šifrovanie
          </Button>
        )}

        {confirming && !migrating && (
          <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-3 space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-orange-700">Si si istý/á?</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Všetky tvoje dáta budú uložené ako čistý text. Administrátori ich budú môcť vidieť. Môžeš to kedykoľvek zmeniť späť.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                className="text-xs flex-1"
                onClick={disableEncryption}
              >
                Áno, vypnúť
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs flex-1"
                onClick={() => setConfirming(false)}
              >
                Zrušiť
              </Button>
            </div>
          </div>
        )}

        {migrating && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Dešifrovávam a znova ukladám...
          </div>
        )}

        {!enabled && (
          <p className="text-xs text-muted-foreground">
            Na znovu-zapnutie šifrovania sa odhlás a znova prihlás.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
