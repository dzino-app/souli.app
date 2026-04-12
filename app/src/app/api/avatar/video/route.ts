import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateVideo } from "@/lib/veo";

/**
 * POST /api/avatar/video
 * Generate an AI video clip for an avatar using Vertex AI Veo.
 * Stores the result in Supabase Storage and updates the avatar row.
 *
 * Note: Veo generation takes 30-120 seconds. The client should poll
 * or use a loading indicator.
 */
export const maxDuration = 300; // Veo can take up to 2 min

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { avatarId, species, bodyColor, personality, action } = body;

  if (!avatarId || !species) {
    return NextResponse.json(
      { error: "avatarId and species are required" },
      { status: 400 },
    );
  }

  const { data: avatar } = await supabase
    .from("avatars")
    .select("id, user_id")
    .eq("id", avatarId)
    .single();

  if (!avatar || avatar.user_id !== user.id) {
    return NextResponse.json({ error: "Avatar not found" }, { status: 404 });
  }

  try {
    const videoBase64 = await generateVideo({
      species,
      bodyColor: bodyColor || "#4F46E5",
      personality,
      action,
    });

    const videoBuffer = Buffer.from(videoBase64, "base64");
    const path = `videos/${avatarId}.mp4`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, videoBuffer, {
        contentType: "video/mp4",
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: "Upload failed: " + uploadError.message },
        { status: 500 },
      );
    }

    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(path);

    await supabase
      .from("avatars")
      .update({
        avatar_type: "veo",
        video_url: urlData.publicUrl,
      })
      .eq("id", avatarId);

    return NextResponse.json({
      videoUrl: urlData.publicUrl,
      avatarType: "veo",
    });
  } catch (err) {
    console.error("[video] Generation failed:", err);
    return NextResponse.json(
      { error: "Video generation failed" },
      { status: 500 },
    );
  }
}
