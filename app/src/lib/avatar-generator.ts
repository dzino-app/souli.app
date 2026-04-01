import { saveVoxelAvatar, getVoxelAvatar, type VoxelAvatarData, type VoxelAnimationSet } from "./voxel";
import { getSoulFile } from "./soul";

// Generate or regenerate the voxel avatar via the API
export async function generateVoxelAvatar(
  withAnimations: boolean = true
): Promise<VoxelAvatarData | null> {
  // Get description from vzhľad.md soul file, or use default
  const vzhladFile = getSoulFile("vzhlad");
  const description =
    vzhladFile?.content
      .split("\n")
      .filter((l) => l.startsWith("- ") || (!l.startsWith("#") && !l.startsWith("_") && l.trim()))
      .join(". ") ||
    "Malý priateľský voxelový robot, farebný, veľké okrúhle oči, usmievavý, roztomilý";

  const response = await fetch("/api/avatar/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      description,
      generateAnimations: withAnimations,
    }),
  });

  if (!response.ok) return null;

  const data = await response.json();
  if (!data.baseGrid) return null;

  const avatarData: VoxelAvatarData = {
    baseGrid: data.baseGrid,
    animations: (data.animations || {}) as VoxelAnimationSet,
    description,
    generatedAt: new Date().toISOString(),
  };

  saveVoxelAvatar(avatarData);
  return avatarData;
}

// Check if we need to generate the avatar
export function needsGeneration(): boolean {
  return getVoxelAvatar() === null;
}
