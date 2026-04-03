/**
 * Hook to trigger client-side avatar rendering and upload to Supabase Storage.
 *
 * Usage:
 *   const { renderAndUpload, rendering } = useAvatarRender();
 *   await renderAndUpload(userId, avatarId, appearance, level);
 */

"use client";

import { useState, useCallback } from "react";
import type { AvatarAppearance } from "@/lib/avatar";
import { renderAvatarFrames } from "@/lib/avatar-renderer";
import {
  uploadAvatarAssets,
  saveAvatarAssetUrls,
  type StoredAvatarUrls,
} from "@/lib/avatar-storage";

export function useAvatarRender() {
  const [rendering, setRendering] = useState(false);

  const renderAndUpload = useCallback(
    async (
      userId: string,
      avatarId: string,
      appearance: AvatarAppearance,
      level: number,
    ): Promise<StoredAvatarUrls | null> => {
      setRendering(true);
      try {
        // 1. Render all frames client-side
        const assets = renderAvatarFrames(appearance, level);

        // 2. Upload to Supabase Storage
        const urls = await uploadAvatarAssets(
          userId,
          avatarId,
          assets.preview,
          assets.activities,
        );

        if (!urls) return null;

        // 3. Save URLs to the avatars table
        await saveAvatarAssetUrls(avatarId, urls);

        return urls;
      } catch (err) {
        console.error("Avatar render/upload failed:", err);
        return null;
      } finally {
        setRendering(false);
      }
    },
    [],
  );

  return { renderAndUpload, rendering };
}
