"use client";

import { useEffect, useRef } from "react";
import {
  getNotificationSettings,
  getNotificationPermission,
  getNextScheduledSlot,
  generateSouliMessage,
  scheduleLocalNotification,
  clearScheduledNotification,
} from "@/lib/notifications";

/**
 * Background scheduler mounted in the root locale layout.
 * On mount (and on visibility change) it calculates the next notification
 * slot and uses setTimeout to fire a browser Notification at that time.
 *
 * v1: pure client-side, no service worker / Push API.
 */
export function NotificationScheduler() {
  const rescheduleRef = useRef<() => void>(noop);

  useEffect(() => {
    function reschedule() {
      // Clear any existing timer
      clearScheduledNotification();

      // Check prerequisites
      const permission = getNotificationPermission();
      if (permission !== "granted") return;

      const settings = getNotificationSettings();
      if (!settings.enabled) return;

      const next = getNextScheduledSlot(settings);
      if (!next) return;

      const message = generateSouliMessage(next.slot);
      scheduleLocalNotification("Souli", message, next.delayMs);
    }

    rescheduleRef.current = reschedule;

    // Initial schedule
    reschedule();

    // Re-schedule when tab becomes visible (user returned)
    function handleVisibility() {
      if (!document.hidden) {
        reschedule();
      }
    }

    // Re-schedule when localStorage changes (settings updated in another tab or same tab)
    function handleStorage(e: StorageEvent) {
      if (e.key === "dzino_notification_settings") {
        reschedule();
      }
    }

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("storage", handleStorage);

    return () => {
      clearScheduledNotification();
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return null;
}

function noop() {
  /* placeholder */
}
