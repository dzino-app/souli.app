"use client";

/**
 * Minimal GIF89a encoder for pixel art avatars.
 * Supports: animated GIFs, transparency, indexed color (up to 256 colors).
 * No external dependencies.
 */

function rgbaToIndex(
  r: number, g: number, b: number, a: number,
  palette: number[][],
  transparentIndex: number,
): number {
  if (a < 128) return transparentIndex;

  let bestIdx = 0;
  let bestDist = Infinity;
  for (let i = 0; i < palette.length; i++) {
    if (i === transparentIndex) continue;
    const dr = r - palette[i][0];
    const dg = g - palette[i][1];
    const db = b - palette[i][2];
    const dist = dr * dr + dg * dg + db * db;
    if (dist === 0) return i;
    if (dist < bestDist) {
      bestDist = dist;
      bestIdx = i;
    }
  }
  return bestIdx;
}

function extractPalette(frames: ImageData[]): number[][] {
  const colorSet = new Map<string, number[]>();

  for (const frame of frames) {
    const d = frame.data;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 128) continue; // skip transparent
      const key = `${d[i]},${d[i + 1]},${d[i + 2]}`;
      if (!colorSet.has(key)) {
        colorSet.set(key, [d[i], d[i + 1], d[i + 2]]);
      }
    }
  }

  const colors = Array.from(colorSet.values());
  // GIF needs power-of-2 palette, max 256. Reserve slot 0 for transparent.
  const palette: number[][] = [[0, 0, 0]]; // index 0 = transparent
  for (let i = 0; i < Math.min(colors.length, 255); i++) {
    palette.push(colors[i]);
  }
  // Pad to nearest power of 2
  const size = Math.max(4, 1 << Math.ceil(Math.log2(palette.length)));
  while (palette.length < size) palette.push([0, 0, 0]);
  return palette;
}

function lzwEncode(indices: number[], minCodeSize: number): number[] {
  const clearCode = 1 << minCodeSize;
  const eoiCode = clearCode + 1;

  let codeSize = minCodeSize + 1;
  let nextCode = eoiCode + 1;

  const table = new Map<string, number>();
  for (let i = 0; i < clearCode; i++) {
    table.set(String(i), i);
  }

  const output: number[] = [];
  let bitBuffer = 0;
  let bitCount = 0;

  function writeBits(code: number, bits: number) {
    bitBuffer |= code << bitCount;
    bitCount += bits;
    while (bitCount >= 8) {
      output.push(bitBuffer & 0xff);
      bitBuffer >>= 8;
      bitCount -= 8;
    }
  }

  writeBits(clearCode, codeSize);

  let current = String(indices[0]);
  for (let i = 1; i < indices.length; i++) {
    const next = current + "," + indices[i];
    if (table.has(next)) {
      current = next;
    } else {
      writeBits(table.get(current)!, codeSize);
      if (nextCode < 4096) {
        table.set(next, nextCode++);
        if (nextCode > (1 << codeSize) && codeSize < 12) {
          codeSize++;
        }
      } else {
        writeBits(clearCode, codeSize);
        table.clear();
        for (let j = 0; j < clearCode; j++) {
          table.set(String(j), j);
        }
        codeSize = minCodeSize + 1;
        nextCode = eoiCode + 1;
      }
      current = String(indices[i]);
    }
  }

  writeBits(table.get(current)!, codeSize);
  writeBits(eoiCode, codeSize);

  if (bitCount > 0) {
    output.push(bitBuffer & 0xff);
  }

  return output;
}

function subBlocks(data: number[]): number[] {
  const result: number[] = [];
  let i = 0;
  while (i < data.length) {
    const chunkSize = Math.min(255, data.length - i);
    result.push(chunkSize);
    for (let j = 0; j < chunkSize; j++) {
      result.push(data[i++]);
    }
  }
  result.push(0); // block terminator
  return result;
}

export function encodeAnimatedGif(
  frames: { imageData: ImageData; delay: number }[],
  width: number,
  height: number,
): Uint8Array {
  const palette = extractPalette(frames.map((f) => f.imageData));
  const transparentIndex = 0;
  const colorBits = Math.ceil(Math.log2(palette.length));
  const minCodeSize = Math.max(2, colorBits);

  const bytes: number[] = [];

  // Header
  bytes.push(0x47, 0x49, 0x46, 0x38, 0x39, 0x61); // GIF89a

  // Logical Screen Descriptor
  bytes.push(width & 0xff, (width >> 8) & 0xff);
  bytes.push(height & 0xff, (height >> 8) & 0xff);
  bytes.push(0x80 | ((colorBits - 1) & 7)); // GCT flag + color resolution
  bytes.push(transparentIndex); // background color
  bytes.push(0); // pixel aspect ratio

  // Global Color Table
  for (const [r, g, b] of palette) {
    bytes.push(r, g, b);
  }

  // Netscape Application Extension (infinite loop)
  bytes.push(0x21, 0xff, 0x0b);
  bytes.push(0x4e, 0x45, 0x54, 0x53, 0x43, 0x41, 0x50, 0x45, 0x32, 0x2e, 0x30); // NETSCAPE2.0
  bytes.push(0x03, 0x01, 0x00, 0x00, 0x00); // loop count = 0 (infinite)

  for (const frame of frames) {
    const delayCs = Math.round(frame.delay / 10); // centiseconds

    // Graphic Control Extension
    bytes.push(0x21, 0xf9, 0x04);
    bytes.push(0x09); // disposal = restore to bg, transparent flag
    bytes.push(delayCs & 0xff, (delayCs >> 8) & 0xff);
    bytes.push(transparentIndex);
    bytes.push(0x00);

    // Image Descriptor
    bytes.push(0x2c);
    bytes.push(0, 0, 0, 0); // left, top
    bytes.push(width & 0xff, (width >> 8) & 0xff);
    bytes.push(height & 0xff, (height >> 8) & 0xff);
    bytes.push(0x00); // no local color table

    // Image Data
    const d = frame.imageData.data;
    const indices: number[] = [];
    for (let i = 0; i < d.length; i += 4) {
      indices.push(rgbaToIndex(d[i], d[i + 1], d[i + 2], d[i + 3], palette, transparentIndex));
    }

    bytes.push(minCodeSize);
    const compressed = lzwEncode(indices, minCodeSize);
    const blocks = subBlocks(compressed);
    for (const b of blocks) bytes.push(b);
  }

  // Trailer
  bytes.push(0x3b);

  return new Uint8Array(bytes);
}
