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
import {
  getUserSettings,
  updateSetting,
  type UserSettings,
} from "@/lib/user-settings";
import { ExportData } from "@/components/settings/export-data";
import { LlmSettings } from "@/components/settings/llm-settings";

const NAV_ITEMS = [
  { href: "/", icon: Home, label: "Domov" },
  { href: "/chat", icon: MessageCircle, label: "Chat" },
  { href: "/dusa", icon: BookOpen, label: "Du\u0161a" },
  { href: "/udalosti", icon: Calendar, label: "Udalosti" },
  { href: "/uspechy", icon: Trophy, label: "\u00DAspechy" },
] as const;

interface FeatureToggle {
  key: keyof UserSettings;
  label: string;
  description: string;
}

const FEATURE_TOGGLES: FeatureToggle[] = [
  {
    key: "dailyGreeting",
    label: "Denn\u00e9 priv\u00edtanie",
    description: "Dzino \u0165a pozdrav\u00ed ke\u010f otvor\u00ed\u0161 apku",
  },
  {
    key: "moodTracking",
    label: "Sledovanie n\u00e1lady",
    description: "Ka\u017ed\u00fd de\u0148 sa \u0165a op\u00fdta, ako sa c\u00edti\u0161",
  },
  {
    key: "weeklyReview",
    label: "T\u00fd\u017edenn\u00fd preh\u013ead",
    description: "Zhrnutie t\u00fd\u017ed\u0148a v nede\u013eu",
  },
  {
    key: "healthNudges",
    label: "Zdravotn\u00e9 tipy",
    description: "Jemn\u00e9 pripomienky o zdravom \u017eivotnom \u0161t\u00fdle",
  },
  {
    key: "interestingFacts",
    label: "Zauj\u00edmavosti",
    description: "Fakty zo sveta pr\u00edrody, vedy a hist\u00f3rie",
  },
  {
    key: "challengeNotifications",
    label: "Upozornenia na v\u00fdzvy",
    description: "Pripomienky o denn\u00fdch v\u00fdzvach",
  },
];

export default function SettingsPage() {
  const [deleted, setDeleted] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [settings, setSettings] = useState<UserSettings>(() =>
    getUserSettings()
  );

  function handleToggle(key: keyof UserSettings) {
    const updated = updateSetting(key, !settings[key]);
    setSettings(updated);
  }

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

      {/* Feature toggles */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Funkcie
        </h2>
        <Card>
          <CardContent className="p-0 divide-y">
            {FEATURE_TOGGLES.map(({ key, label, description }) => (
              <div
                key={key}
                className="flex items-center justify-between px-4 py-3"
              >
                <div className="flex-1 min-w-0 mr-3">
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
                <button
                  role="switch"
                  aria-checked={settings[key]}
                  onClick={() => handleToggle(key)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    settings[key] ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform ${
                      settings[key] ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Custom LLM */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          {"Vlastn\u00fd LLM"}
        </h2>
        <LlmSettings
          translations={{
            title: "Vlastn\u00fd LLM",
            desc: "Pou\u017ei vlastn\u00fd API k\u013e\u00fa\u010d. Konverz\u00e1cie p\u00f4jdu priamo cez tvoj \u00fa\u010det.",
            provider: "Poskytovate\u013e",
            apiKey: "API k\u013e\u00fa\u010d",
            model: "Model",
            test: "Otestova\u0165",
            testSuccess: "Funguje!",
            testFail: "Nefunguje",
            keyWarning: "K\u013e\u00fa\u010d je ulo\u017een\u00fd len v tvojom prehliada\u010di.",
          }}
        />
      </div>

      {/* Account */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          {"\u00DA\u010det"}
        </h2>
        <div className="space-y-3">
          <ExportData
            translations={{
              title: "Stiahnu\u0165 v\u0161etky d\u00e1ta",
              desc: "V\u0161etky tvoje d\u00e1ta v jednom s\u00fabore. Du\u0161a, konverz\u00e1cie, udalosti, nastavenia.",
              button: "Stiahnu\u0165 ZIP",
              loading: "Pripravujem...",
            }}
          />
          <form action="/api/auth/signout" method="POST">
            <Button type="submit" variant="outline" className="w-full justify-start">
              <LogOut className="h-4 w-4 mr-2" />
              {"Odhl\u00e1si\u0165 sa"}
            </Button>
          </form>
        </div>
      </div>

      {/* Danger zone */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-destructive mb-3">
          {"Nebezpe\u010dn\u00e1 z\u00f3na"}
        </h2>
        <Card className="border-destructive/30">
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground mb-3">
              {"Toto vyma\u017ee cel\u00fa du\u0161u Dzina, konverz\u00e1cie a udalosti. Tento krok sa ned\u00e1 vr\u00e1ti\u0165."}
            </p>
            {deleted ? (
              <p className="text-sm text-success">{"D\u00e1ta boli vymazan\u00e9"}</p>
            ) : confirming ? (
              <div className="flex gap-2">
                <Button variant="destructive" size="sm" onClick={handleDeleteAll}>
                  {"Naozaj vymaza\u0165?"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setConfirming(false)}>
                  {"Zru\u0161i\u0165"}
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
                {"Vymaza\u0165 v\u0161etky d\u00e1ta"}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
