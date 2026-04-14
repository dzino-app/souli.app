import { NextResponse } from "next/server";

/**
 * POST /api/stickers/telegram
 *
 * Creates a Telegram sticker pack via the Bot API.
 *
 * Flow:
 * 1. User must first message @DzinoStickersBot on Telegram to get their user_id
 * 2. Bot replies with user_id, user pastes it into our UI
 * 3. UI calls this endpoint with user_id + stickers (base64 webp) + pack metadata
 * 4. Server calls Bot API to create the set
 * 5. Returns the t.me/addstickers/<set_name> link
 *
 * Env vars required:
 * - TELEGRAM_BOT_TOKEN: bot token from @BotFather
 * - TELEGRAM_BOT_USERNAME: bot username (no @), e.g. "DzinoStickersBot"
 */

export const maxDuration = 60;

interface StickerInput {
  data: string; // base64-encoded webp or png
  emoji: string; // emoji associated with this sticker
}

interface CreatePackRequest {
  telegramUserId: number;
  packTitle: string;
  stickers: StickerInput[];
}

export async function POST(request: Request) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const botUsername = process.env.TELEGRAM_BOT_USERNAME;

  if (!token || !botUsername) {
    return NextResponse.json(
      { error: "Telegram bot not configured. Set TELEGRAM_BOT_TOKEN and TELEGRAM_BOT_USERNAME." },
      { status: 501 },
    );
  }

  const body = (await request.json()) as CreatePackRequest;
  const { telegramUserId, packTitle, stickers } = body;

  if (!telegramUserId || !packTitle || !stickers?.length) {
    return NextResponse.json(
      { error: "telegramUserId, packTitle, and stickers are required" },
      { status: 400 },
    );
  }

  // Pack name must end with _by_<bot_username>
  const safeTitle = packTitle.replace(/[^a-zA-Z0-9]/g, "").slice(0, 24);
  const timestamp = Date.now().toString(36);
  const setName = `dzino_${safeTitle}_${timestamp}_by_${botUsername}`;

  const api = `https://api.telegram.org/bot${token}`;

  try {
    // 1. Upload each sticker file
    const uploadedFileIds: { file_id: string; emoji: string }[] = [];
    for (const sticker of stickers) {
      const buffer = Buffer.from(sticker.data, "base64");
      const formData = new FormData();
      formData.append("user_id", String(telegramUserId));
      formData.append("sticker_format", "static");
      formData.append("sticker", new Blob([buffer], { type: "image/webp" }), "sticker.webp");

      const uploadRes = await fetch(`${api}/uploadStickerFile`, {
        method: "POST",
        body: formData,
      });
      const uploadJson = await uploadRes.json();
      if (!uploadJson.ok) {
        return NextResponse.json(
          { error: `Upload failed: ${uploadJson.description}` },
          { status: 502 },
        );
      }
      uploadedFileIds.push({ file_id: uploadJson.result.file_id, emoji: sticker.emoji });
    }

    // 2. Create the sticker set with the first sticker
    const firstSticker = uploadedFileIds[0];
    const createRes = await fetch(`${api}/createNewStickerSet`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: telegramUserId,
        name: setName,
        title: packTitle,
        sticker_format: "static",
        stickers: [
          {
            sticker: firstSticker.file_id,
            emoji_list: [firstSticker.emoji],
            format: "static",
          },
        ],
      }),
    });
    const createJson = await createRes.json();
    if (!createJson.ok) {
      return NextResponse.json(
        { error: `Create failed: ${createJson.description}` },
        { status: 502 },
      );
    }

    // 3. Add the remaining stickers to the set
    for (let i = 1; i < uploadedFileIds.length; i++) {
      const s = uploadedFileIds[i];
      await fetch(`${api}/addStickerToSet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: telegramUserId,
          name: setName,
          sticker: {
            sticker: s.file_id,
            emoji_list: [s.emoji],
            format: "static",
          },
        }),
      });
    }

    return NextResponse.json({
      setName,
      url: `https://t.me/addstickers/${setName}`,
    });
  } catch (err) {
    console.error("[telegram-stickers]", err);
    return NextResponse.json(
      { error: "Telegram API call failed" },
      { status: 500 },
    );
  }
}
