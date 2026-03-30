"use client";

import { useEffect, useState } from "react";
import { UserPlus, Copy, Check, Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function getOrCreateReferralCode(): string {
  if (typeof window === "undefined") return "";
  let code = localStorage.getItem("dzino_referral_code");
  if (!code) {
    code = crypto.randomUUID().slice(0, 8);
    localStorage.setItem("dzino_referral_code", code);
  }
  return code;
}

function getInviteCount(): number {
  if (typeof window === "undefined") return 0;
  const count = localStorage.getItem("dzino_invite_count");
  return count ? parseInt(count, 10) : 0;
}

export default function InvitePage() {
  const t = useTranslations("invite");
  const [code, setCode] = useState("");
  const [inviteCount, setInviteCount] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCode(getOrCreateReferralCode());
    setInviteCount(getInviteCount());
  }, []);

  const inviteUrl = typeof window !== "undefined"
    ? `${window.location.origin}?ref=${code}`
    : "";

  async function handleCopy() {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleShare() {
    if (navigator.share) {
      await navigator.share({
        title: "Dzino",
        text: t("shareText"),
        url: inviteUrl,
      });
    } else {
      handleCopy();
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-primary/10 p-2">
          <UserPlus className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
      </div>

      {/* Invite link */}
      <Card>
        <CardContent className="py-6">
          <p className="text-sm font-medium mb-3">{t("yourLink")}</p>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={inviteUrl}
              className="flex-1 rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground"
            />
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? (
                <Check className="h-4 w-4 mr-1" />
              ) : (
                <Copy className="h-4 w-4 mr-1" />
              )}
              {copied ? t("copied") : t("copyLink")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Share button */}
      <Button size="lg" onClick={handleShare}>
        <Share2 className="h-4 w-4 mr-2" />
        {t("title")}
      </Button>

      {/* Invite count */}
      <Card>
        <CardContent className="py-6 text-center">
          <p className="text-3xl font-bold text-primary">{inviteCount}</p>
          <p className="text-sm text-muted-foreground">{t("inviteCount")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
