"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Settings,
  Home,
  MessageCircle,
  BookOpen,
  Calendar,
  Trophy,
  Trash2,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const NAV_ITEMS = [
  { href: "/", icon: Home, label: "Domov" },
  { href: "/chat", icon: MessageCircle, label: "Chat" },
  { href: "/dusa", icon: BookOpen, label: "Du\u0161a" },
  { href: "/udalosti", icon: Calendar, label: "Udalosti" },
  { href: "/uspechy", icon: Trophy, label: "\u00DAspechy" },
] as const;

export default function SettingsPage() {
  const [deleted, setDeleted] = useState(false);
  const [confirming, setConfirming] = useState(false);

  function handleDeleteAll() {
    localStorage.removeItem("dzino_soul");
    localStorage.removeItem("dzino_conversations");
    localStorage.removeItem("dzino_avatar");
    localStorage.removeItem("dzino_events");
    localStorage.removeItem("dzino_memories");
    localStorage.removeItem("dzino_onboarding");
    localStorage.removeItem("dzino_soul_migrated");
    setDeleted(true);
    setConfirming(false);
    setTimeout(() => setDeleted(false), 3000);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-primary/10 p-2">
          <Settings className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-xl font-bold">Nastavenia</h1>
      </div>

      {/* Navigation */}
      <Card>
        <CardContent className="p-0 divide-y">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => (
            <Link
              key={label}
              href={href}
              className="flex items-center justify-between px-4 py-3 hover:bg-secondary transition-colors first:rounded-t-lg last:rounded-b-lg"
            >
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{label}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          ))}
        </CardContent>
      </Card>

      {/* Account */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Účet
        </h2>
        <form action="/api/auth/signout" method="POST">
          <Button type="submit" variant="outline" className="w-full justify-start">
            <LogOut className="h-4 w-4 mr-2" />
            Odhlásiť sa
          </Button>
        </form>
      </div>

      {/* Danger zone */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-destructive mb-3">
          Nebezpečná zóna
        </h2>
        <Card className="border-destructive/30">
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground mb-3">
              Toto vymaže celú dušu Dzina, konverzácie a udalosti. Tento krok sa nedá vrátiť.
            </p>
            {deleted ? (
              <p className="text-sm text-success">Dáta boli vymazané</p>
            ) : confirming ? (
              <div className="flex gap-2">
                <Button variant="destructive" size="sm" onClick={handleDeleteAll}>
                  Naozaj vymazať?
                </Button>
                <Button variant="outline" size="sm" onClick={() => setConfirming(false)}>
                  Zrušiť
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
                Vymazať všetky dáta
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
