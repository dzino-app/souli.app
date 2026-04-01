"use client";

import { useEffect } from "react";
import { AvatarScene } from "@/components/avatar/avatar-scene";
import { migrateMemoriesToSoul } from "@/lib/migrate-memories-to-soul";

export default function Home() {
  // Run one-time migration from old memory system
  useEffect(() => {
    migrateMemoriesToSoul();
  }, []);

  return <AvatarScene />;
}
