"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, BellOff, Sun, CloudSun, Moon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  getNotificationSettings,
  saveNotificationSettings,
  getNotificationPermission,
  requestNotificationPermission,
  type NotificationSettings as Settings,
} from "@/lib/notifications";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

function formatHour(h: number): string {
  return `${h.toString().padStart(2, "0")}:00`;
}

function PermissionBadge({ permission }: { permission: string }) {
  if (permission === "granted") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-green-600">
        <Bell className="h-3 w-3" />
        Povolené
      </span>
    );
  }
  if (permission === "denied") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-destructive">
        <BellOff className="h-3 w-3" />
        Zablokované v prehliadači
      </span>
    );
  }
  if (permission === "unsupported") {
    return (
      <span className="text-xs text-muted-foreground">
        Tento prehliadač nepodporuje upozornenia
      </span>
    );
  }
  return (
    <span className="text-xs text-muted-foreground">
      Ešte nepovolené
    </span>
  );
}

export function NotificationSettings() {
  const [settings, setSettings] = useState<Settings>(() =>
    getNotificationSettings(),
  );
  const [permission, setPermission] = useState<string>("default");

  useEffect(() => {
    setPermission(getNotificationPermission());
  }, []);

  const persist = useCallback((next: Settings) => {
    setSettings(next);
    saveNotificationSettings(next);
  }, []);

  async function handleMainToggle() {
    if (!settings.enabled) {
      // Turning ON — request permission first
      const result = await requestNotificationPermission();
      setPermission(result);
      if (result === "granted") {
        persist({ ...settings, enabled: true });
      }
      // If denied or dismissed, don't enable
    } else {
      // Turning OFF
      persist({ ...settings, enabled: false });
    }
  }

  function handleSlotToggle(slot: "morning" | "midday" | "evening") {
    persist({ ...settings, [slot]: !settings[slot] });
  }

  function handleQuietChange(
    field: "quietStart" | "quietEnd",
    value: number,
  ) {
    persist({ ...settings, [field]: value });
  }

  const isBlocked = permission === "denied";
  const isUnsupported = permission === "unsupported";
  const canToggle = !isBlocked && !isUnsupported;

  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="p-0 divide-y">
          {/* Main toggle */}
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex-1 min-w-0 mr-3">
              <p className="text-sm font-medium">Povoliť upozornenia</p>
              <p className="text-xs text-muted-foreground">
                Souli ti pošle 1-3 správy denne
              </p>
              <div className="mt-1">
                <PermissionBadge permission={permission} />
              </div>
            </div>
            <button
              role="switch"
              aria-checked={settings.enabled}
              onClick={handleMainToggle}
              disabled={!canToggle}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                settings.enabled ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform ${
                  settings.enabled ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {/* Slot toggles — only shown when enabled */}
          {settings.enabled && (
            <>
              {/* Morning */}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3 flex-1 min-w-0 mr-3">
                  <Sun className="h-4 w-4 text-amber-500 shrink-0" />
                  <div>
                    <p className="text-sm">Ranné (7:00 – 9:00)</p>
                  </div>
                </div>
                <button
                  role="switch"
                  aria-checked={settings.morning}
                  onClick={() => handleSlotToggle("morning")}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    settings.morning ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform ${
                      settings.morning ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              {/* Midday */}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3 flex-1 min-w-0 mr-3">
                  <CloudSun className="h-4 w-4 text-orange-500 shrink-0" />
                  <div>
                    <p className="text-sm">Obedné (12:00 – 14:00)</p>
                  </div>
                </div>
                <button
                  role="switch"
                  aria-checked={settings.midday}
                  onClick={() => handleSlotToggle("midday")}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    settings.midday ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform ${
                      settings.midday ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              {/* Evening */}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3 flex-1 min-w-0 mr-3">
                  <Moon className="h-4 w-4 text-indigo-500 shrink-0" />
                  <div>
                    <p className="text-sm">Večerné (19:00 – 21:00)</p>
                  </div>
                </div>
                <button
                  role="switch"
                  aria-checked={settings.evening}
                  onClick={() => handleSlotToggle("evening")}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    settings.evening ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform ${
                      settings.evening ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Quiet hours */}
      {settings.enabled && (
        <Card>
          <CardContent className="py-4 px-4 space-y-3">
            <p className="text-sm font-medium">Tiché hodiny</p>
            <p className="text-xs text-muted-foreground">
              Počas tichých hodín Souli nebude posielať upozornenia
            </p>
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground whitespace-nowrap">
                Od
              </label>
              <select
                value={settings.quietStart}
                onChange={(e) =>
                  handleQuietChange("quietStart", Number(e.target.value))
                }
                className="rounded-md border bg-background px-2 py-1.5 text-sm flex-1"
              >
                {HOURS.map((h) => (
                  <option key={h} value={h}>
                    {formatHour(h)}
                  </option>
                ))}
              </select>
              <label className="text-xs text-muted-foreground whitespace-nowrap">
                do
              </label>
              <select
                value={settings.quietEnd}
                onChange={(e) =>
                  handleQuietChange("quietEnd", Number(e.target.value))
                }
                className="rounded-md border bg-background px-2 py-1.5 text-sm flex-1"
              >
                {HOURS.map((h) => (
                  <option key={h} value={h}>
                    {formatHour(h)}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
