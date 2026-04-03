/**
 * Client-side trigger for avatar rendering.
 *
 * Call `triggerAvatarRender` after: creating an avatar, changing appearance,
 * leveling up, or publishing. It renders all frames and uploads them to
 * Supabase Storage, then saves the URLs to the avatars table.
 *
 * This is async and non-blocking -- callers should fire-and-forget,
 * with the UI showing PixelAvatar as a fallback until stored assets are ready.
 */

import type { AvatarAppearance } from "./avatar";
import { renderAvatarFrames } from "./avatar-renderer";
import {
  uploadAvatarAssets,
  saveAvatarAssetUrls,
  type StoredAvatarUrls,
} from "./avatar-storage";

/**
 * Render all frames client-side, upload to Supabase Storage,
 * and save URLs to the avatars table.
 *
 * Returns the stored URLs on success, or null on failure.
 * Safe to call from the browser only (needs canvas).
 */
export async function triggerAvatarRender(
  userId: string,
  avatarId: string,
  appearance: AvatarAppearance,
  level: number,
): Promise<StoredAvatarUrls | null> {
  if (typeof window === "undefined") return null;

  try {
    // 1. Render all animation frames to canvas
    const assets = renderAvatarFrames(appearance, level);

    // 2. Upload PNGs to Supabase Storage
    const urls = await uploadAvatarAssets(
      userId,
      avatarId,
      assets.preview,
      assets.activities,
    );

    if (!urls) return null;

    // 3. Persist URLs in the avatars table
    await saveAvatarAssetUrls(avatarId, urls);

    return urls;
  } catch (err) {
    console.error("[avatar-render-trigger] Render failed:", err);
    return null;
  }
}
