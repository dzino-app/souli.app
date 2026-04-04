"use client";

/**
 * Sticker pack: 12 preset sticker combos + ZIP download.
 * No external dependencies — uses a minimal uncompressed ZIP encoder.
 */

import type { AvatarAppearance, AvatarState } from "./avatar";
import { generateSticker } from "./sticker-generator";

// ---------------------------------------------------------------------------
// Sticker set definition
// ---------------------------------------------------------------------------

export interface StickerDef {
  state: AvatarState;
  label: string;
  filename: string;
}

export const STICKER_SET: StickerDef[] = [
  { state: "waving",   label: "Hello!",    filename: "01-hello" },
  { state: "happy",    label: "Yes!",      filename: "02-yes" },
  { state: "sad",      label: "Oh no...",  filename: "03-oh-no" },
  { state: "thinking", label: "Hmm...",    filename: "04-hmm" },
  { state: "talking",  label: "LOL",       filename: "05-lol" },
  { state: "eating",   label: "Nom nom",   filename: "06-nom-nom" },
  { state: "sleeping", label: "ZZZ",       filename: "07-zzz" },
  { state: "walking",  label: "BRB",       filename: "08-brb" },
  { state: "idle",     label: "...",       filename: "09-idle" },
  { state: "happy",    label: "Thanks!",   filename: "10-thanks" },
  { state: "waving",   label: "Bye!",      filename: "11-bye" },
  { state: "thinking", label: "Wait...",   filename: "12-wait" },
];

// ---------------------------------------------------------------------------
// Generate all stickers
// ---------------------------------------------------------------------------

export interface GeneratedSticker {
  blob: Blob;
  label: string;
  state: AvatarState;
  url: string; // object URL for preview
}

export async function generateStickerPack(
  appearance: AvatarAppearance,
  level: number,
): Promise<GeneratedSticker[]> {
  const results: GeneratedSticker[] = [];

  for (const def of STICKER_SET) {
    const blob = await generateSticker(appearance, level, def.state, def.label);
    const url = URL.createObjectURL(blob);
    results.push({ blob, label: def.label, state: def.state, url });
  }

  return results;
}

// ---------------------------------------------------------------------------
// Minimal uncompressed ZIP encoder (STORE method, no compression)
// ---------------------------------------------------------------------------

function stringToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/**
 * CRC-32 lookup table (standard polynomial 0xEDB88320).
 */
const crc32Table = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }
  return table;
})();

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = crc32Table[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/** Write a uint16 little-endian into buf at pos, return new pos. */
function w16(buf: Uint8Array, pos: number, n: number): number {
  buf[pos] = n & 0xff;
  buf[pos + 1] = (n >> 8) & 0xff;
  return pos + 2;
}

/** Write a uint32 little-endian into buf at pos, return new pos. */
function w32(buf: Uint8Array, pos: number, n: number): number {
  buf[pos] = n & 0xff;
  buf[pos + 1] = (n >> 8) & 0xff;
  buf[pos + 2] = (n >> 16) & 0xff;
  buf[pos + 3] = (n >> 24) & 0xff;
  return pos + 4;
}

interface ZipEntry {
  name: string;
  data: Uint8Array;
}

function buildLocalHeader(
  buf: Uint8Array,
  pos: number,
  crc: number,
  size: number,
  nameLen: number,
): number {
  // signature
  buf[pos++] = 0x50; buf[pos++] = 0x4b; buf[pos++] = 0x03; buf[pos++] = 0x04;
  pos = w16(buf, pos, 20);       // version needed
  pos = w16(buf, pos, 0);        // flags
  pos = w16(buf, pos, 0);        // compression: STORE
  pos = w16(buf, pos, 0);        // mod time
  pos = w16(buf, pos, 0);        // mod date
  pos = w32(buf, pos, crc);
  pos = w32(buf, pos, size);     // compressed
  pos = w32(buf, pos, size);     // uncompressed
  pos = w16(buf, pos, nameLen);
  pos = w16(buf, pos, 0);        // extra field length
  return pos;
}

function buildCentralDirEntry(
  buf: Uint8Array,
  pos: number,
  crc: number,
  size: number,
  nameLen: number,
  localOffset: number,
): number {
  // signature
  buf[pos++] = 0x50; buf[pos++] = 0x4b; buf[pos++] = 0x01; buf[pos++] = 0x02;
  pos = w16(buf, pos, 20);       // version made by
  pos = w16(buf, pos, 20);       // version needed
  pos = w16(buf, pos, 0);        // flags
  pos = w16(buf, pos, 0);        // compression: STORE
  pos = w16(buf, pos, 0);        // mod time
  pos = w16(buf, pos, 0);        // mod date
  pos = w32(buf, pos, crc);
  pos = w32(buf, pos, size);     // compressed
  pos = w32(buf, pos, size);     // uncompressed
  pos = w16(buf, pos, nameLen);
  pos = w16(buf, pos, 0);        // extra field length
  pos = w16(buf, pos, 0);        // comment length
  pos = w16(buf, pos, 0);        // disk number
  pos = w16(buf, pos, 0);        // internal attrs
  pos = w32(buf, pos, 0);        // external attrs
  pos = w32(buf, pos, localOffset);
  return pos;
}

function buildZip(entries: ZipEntry[]): Uint8Array {
  // Pre-calculate total size
  const nameBytes: Uint8Array[] = [];
  let localSize = 0;
  let cdSize = 0;

  for (const entry of entries) {
    const nb = stringToBytes(entry.name);
    nameBytes.push(nb);
    localSize += 30 + nb.length + entry.data.length;  // local header + name + data
    cdSize += 46 + nb.length;                          // cd entry + name
  }
  const eocdSize = 22;
  const totalSize = localSize + cdSize + eocdSize;

  const result = new Uint8Array(totalSize);
  let pos = 0;
  const localOffsets: number[] = [];

  // Write local file entries
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const nb = nameBytes[i];
    const fileCrc = crc32(entry.data);
    const size = entry.data.length;

    localOffsets.push(pos);
    pos = buildLocalHeader(result, pos, fileCrc, size, nb.length);
    result.set(nb, pos);
    pos += nb.length;
    result.set(entry.data, pos);
    pos += entry.data.length;
  }

  // Write central directory
  const cdOffset = pos;
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const nb = nameBytes[i];
    const fileCrc = crc32(entry.data);
    const size = entry.data.length;

    pos = buildCentralDirEntry(result, pos, fileCrc, size, nb.length, localOffsets[i]);
    result.set(nb, pos);
    pos += nb.length;
  }

  // Write end-of-central-directory
  result[pos++] = 0x50; result[pos++] = 0x4b; result[pos++] = 0x05; result[pos++] = 0x06;
  pos = w16(result, pos, 0);                 // disk number
  pos = w16(result, pos, 0);                 // disk with CD
  pos = w16(result, pos, entries.length);     // entries on disk
  pos = w16(result, pos, entries.length);     // total entries
  pos = w32(result, pos, cdSize);
  pos = w32(result, pos, cdOffset);
  w16(result, pos, 0);                       // comment length

  return result;
}

// ---------------------------------------------------------------------------
// Download as ZIP
// ---------------------------------------------------------------------------

export async function downloadStickerPack(
  packName: string,
  appearance: AvatarAppearance,
  level: number,
): Promise<void> {
  const entries: ZipEntry[] = [];

  for (const def of STICKER_SET) {
    const blob = await generateSticker(appearance, level, def.state, def.label);
    const arrayBuf = await blob.arrayBuffer();
    const ext = blob.type === "image/webp" ? "webp" : "png";
    entries.push({
      name: `${def.filename}.${ext}`,
      data: new Uint8Array(arrayBuf),
    });
  }

  const zip = buildZip(entries);
  const zipBlob = new Blob([zip.buffer as ArrayBuffer], {
    type: "application/zip",
  });

  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${packName}-stickers.zip`;
  a.click();
  URL.revokeObjectURL(url);
}
