import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generatePortrait } from "@/lib/imagen";

/**
 * POST /api/avatar/portrait
 * Generate an AI portrait for an avatar using Vertex AI Imagen.
 * Stores the result in Supabase Storage and updates the avatar row.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { avatarId, species, bodyColor, personality, accessories } = body;

  if (!avatarId || !species) {
    return NextResponse.json(
      { error: "avatarId and species are required" },
      { status: 400 },
    );
  }

  // Verify the avatar belongs to this user
  const { data: avatar } = await supabase
    .from("avatars")
    .select("id, user_id")
    .eq("id", avatarId)
    .single();

  if (!avatar || avatar.user_id !== user.id) {
    return NextResponse.json({ error: "Avatar not found" }, { status: 404 });
  }

  try {
    const imageBase64 = await generatePortrait({
      species,
      bodyColor: bodyColor || "#4F46E5",
      personality,
      accessories,
    });

    // Upload to Supabase Storage
    const imageBuffer = Buffer.from(imageBase64, "base64");
    const path = `portraits/${avatarId}.png`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, imageBuffer, {
        contentType: "image/png",
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

    // Update avatar row
    await supabase
      .from("avatars")
      .update({
        avatar_type: "imagen",
        portrait_url: urlData.publicUrl,
      })
      .eq("id", avatarId);

    return NextResponse.json({
      portraitUrl: urlData.publicUrl,
      avatarType: "imagen",
    });
  } catch (err) {
    console.error("[portrait] Generation failed:", err);
    return NextResponse.json(
      { error: "Portrait generation failed" },
      { status: 500 },
    );
  }
}
