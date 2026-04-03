import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const zip = new JSZip();

    // Soul files
    if (Array.isArray(data.soulFiles)) {
      const soulFolder = zip.folder("soul");
      for (const file of data.soulFiles) {
        if (file.slug && typeof file.content === "string") {
          soulFolder!.file(`${file.slug}.md`, file.content);
        }
      }
    }

    // Conversations
    if (Array.isArray(data.conversations)) {
      const convFolder = zip.folder("conversations");
      for (const conv of data.conversations) {
        if (conv.id) {
          convFolder!.file(
            `${conv.id}.json`,
            JSON.stringify(conv, null, 2)
          );
        }
      }
    }

    // Events
    if (data.events !== undefined) {
      zip.file("events.json", JSON.stringify(data.events, null, 2));
    }

    // Gamification
    if (data.gamification !== undefined) {
      zip.file("gamification.json", JSON.stringify(data.gamification, null, 2));
    }

    // Avatar
    if (data.avatar !== undefined) {
      zip.file("avatar.json", JSON.stringify(data.avatar, null, 2));
    }

    // Mood history
    if (data.moodHistory !== undefined) {
      zip.file("mood-history.json", JSON.stringify(data.moodHistory, null, 2));
    }

    // Settings
    if (data.settings !== undefined) {
      zip.file("settings.json", JSON.stringify(data.settings, null, 2));
    }

    // README
    zip.file(
      "README.md",
      [
        "# Dzino Data Export",
        "",
        `Exported: ${new Date().toISOString()}`,
        "",
        "## Contents",
        "",
        "- `/soul/` — Soul files (.md) that define Dzino's personality and memories",
        "- `/conversations/` — Chat conversations as JSON files",
        "- `events.json` — Calendar events and diary entries",
        "- `gamification.json` — XP, level, streak, and achievements",
        "- `avatar.json` — Avatar appearance, name, and mood",
        "- `mood-history.json` — Daily mood tracking data",
        "- `settings.json` — User preferences and feature toggles",
        "",
        "## Format",
        "",
        "All files use UTF-8 encoding. JSON files are pretty-printed.",
        "Soul files are standard Markdown.",
      ].join("\n")
    );

    const zipBuffer = await zip.generateAsync({ type: "arraybuffer" });

    return new NextResponse(Buffer.from(zipBuffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="dzino-export-${new Date().toISOString().slice(0, 10)}.zip"`,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Export failed: ${msg}` },
      { status: 500 }
    );
  }
}
