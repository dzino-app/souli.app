/**
 * Avatar asset storage — upload/download pre-rendered frames to Supabase Storage.
 *
 * Storage layout:
 *   avatars/{user_id}/{avatar_id}/preview.png
 *   avatars/{user_id}/{avatar_id}/{activity}/frame-{N}.png
 */

import { createClient } from "./supabase/client";
import { dataUrlToBlob } from "./avatar-renderer";

const BUCKET = "avatars";

/** All activities that get rendered */
const ALL_ACTIVITIES = [
  "idle", "happy", "sad", "walking", "talking",
  "thinking", "waving", "eating", "sleeping",
] as const;

export interface StoredAvatarUrls {
  previewUrl: string;
  animationUrls: Record<string, string[]>;
}

/**
 * Upload pre-rendered avatar frames to Supabase Storage.
 * Returns public URLs for the uploaded assets.
 */
export async function uploadAvatarAssets(
  userId: string,
  avatarId: string,
  preview: string,
  activities: Record<string, string[]>,
): Promise<StoredAvatarUrls | null> {
  const supabase = createClient();
  const basePath = `${userId}/${avatarId}`;

  // 1. Upload preview PNG
  const previewBlob = dataUrlToBlob(preview);
  const previewPath = `${basePath}/preview.png`;

  const { error: previewErr } = await supabase.storage
    .from(BUCKET)
    .upload(previewPath, previewBlob, {
      contentType: "image/png",
      upsert: true,
    });

  if (previewErr) {
    console.error("Failed to upload avatar preview:", previewErr);
    return null;
  }

  // 2. Upload activity frames
  const animationUrls: Record<string, string[]> = {};

  for (const activity of ALL_ACTIVITIES) {
    const frames = activities[activity];
    if (!frames) continue;

    const frameUrls: string[] = [];

    for (let i = 0; i < frames.length; i++) {
      const framePath = `${basePath}/${activity}/frame-${i}.png`;
      const frameBlob = dataUrlToBlob(frames[i]);

      const { error: frameErr } = await supabase.storage
        .from(BUCKET)
        .upload(framePath, frameBlob, {
          contentType: "image/png",
          upsert: true,
        });

      if (frameErr) {
        console.error(`Failed to upload frame ${activity}/${i}:`, frameErr);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(framePath);

      frameUrls.push(publicUrl);
    }

    animationUrls[activity] = frameUrls;
  }

  // 3. Get preview public URL
  const { data: { publicUrl: previewUrl } } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(previewPath);

  return { previewUrl, animationUrls };
}

/**
 * Delete all stored avatar assets from Supabase Storage.
 */
export async function deleteAvatarAssets(
  userId: string,
  avatarId: string,
): Promise<void> {
  const supabase = createClient();
  const basePath = `${userId}/${avatarId}`;

  // List all files under the avatar's folder
  const { data: files } = await supabase.storage
    .from(BUCKET)
    .list(basePath, { limit: 200 });

  if (!files || files.length === 0) return;

  // Also list activity subfolders
  const allPaths: string[] = [];

  for (const file of files) {
    if (file.name === ".emptyFolderPlaceholder") continue;

    // Check if it's a folder (activity subfolder)
    const { data: subFiles } = await supabase.storage
      .from(BUCKET)
      .list(`${basePath}/${file.name}`, { limit: 50 });

    if (subFiles && subFiles.length > 0) {
      for (const sf of subFiles) {
        if (sf.name !== ".emptyFolderPlaceholder") {
          allPaths.push(`${basePath}/${file.name}/${sf.name}`);
        }
      }
    } else {
      allPaths.push(`${basePath}/${file.name}`);
    }
  }

  if (allPaths.length > 0) {
    await supabase.storage.from(BUCKET).remove(allPaths);
  }
}

/**
 * Save avatar asset URLs to the database (avatars table).
 */
export async function saveAvatarAssetUrls(
  avatarId: string,
  urls: StoredAvatarUrls,
): Promise<void> {
  const supabase = createClient();
  await supabase
    .from("avatars")
    .update({
      preview_url: urls.previewUrl,
      animation_urls: urls.animationUrls,
      updated_at: new Date().toISOString(),
    })
    .eq("id", avatarId);
}

/**
 * Get stored avatar asset URLs from the database.
 * Returns null if no stored assets exist.
 */
export function getAvatarAssetUrls(
  avatar: { preview_url?: string | null; animation_urls?: Record<string, string[]> | null },
): StoredAvatarUrls | null {
  if (!avatar.preview_url || !avatar.animation_urls) return null;
  return {
    previewUrl: avatar.preview_url,
    animationUrls: avatar.animation_urls,
  };
}
