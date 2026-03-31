"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Settings,
  Home,
  PenLine,
  Clock,
  Brain,
  Sparkles,
  Store,
  UserPlus,
  Trash2,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const NAV_ITEMS = [
  { href: "/", icon: Home, key: "home" },
  { href: "/napisat", icon: PenLine, key: "write" },
  { href: "/historia", icon: Clock, key: "history" },
  { href: "/pamat", icon: Brain, key: "memory" },
  { href: "/zrucnosti", icon: Sparkles, key: "skills" },
  { href: "/trhovisko", icon: Store, key: "marketplace" },
  { href: "/pozvat", icon: UserPlus, key: "invite" },
] as const;

export default function SettingsPage() {
  const t = useTranslations("settings");
  const [deleted, setDeleted] = useState(false);
  const [confirming, setConfirming] = useState(false);

  function handleDeleteAll() {
    localStorage.removeItem("dzino_memories");
    localStorage.removeItem("dzino_conversations");
    localStorage.removeItem("dzino_skills");
    localStorage.removeItem("dzino_onboarding");
    setDeleted(true);
    setConfirming(false);
    setTimeout(() => setDeleted(false), 3000);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-primary/10 p-2">
          <Settings className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-xl font-bold">{t("title")}</h1>
      </div>

      {/* Navigation */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          {t("navigation")}
        </h2>
        <Card>
          <CardContent className="p-0 divide-y">
            {NAV_ITEMS.map(({ href, icon: Icon, key }) => (
              <Link
                key={key}
                href={href}
                className="flex items-center justify-between px-4 py-3 hover:bg-secondary transition-colors first:rounded-t-lg last:rounded-b-lg"
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{t(key)}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Account */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          {t("account")}
        </h2>
        <form action="/api/auth/signout" method="POST">
          <Button type="submit" variant="outline" className="w-full justify-start">
            <LogOut className="h-4 w-4 mr-2" />
            {t("signOut")}
          </Button>
        </form>
      </div>

      {/* Danger zone */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-destructive mb-3">
          {t("dangerZone")}
        </h2>
        <Card className="border-destructive/30">
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground mb-3">
              {t("deleteDataDesc")}
            </p>
            {deleted ? (
              <p className="text-sm text-success">{t("dataDeleted")}</p>
            ) : confirming ? (
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteAll}
                >
                  {t("deleteConfirm")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirming(false)}
                >
                  {t("navigation")}
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="text-destructive border-destructive/30 hover:bg-destructive/5"
                onClick={() => setConfirming(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t("deleteData")}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
