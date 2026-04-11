/**
 * BIP39 mnemonic generation and validation.
 *
 * Pure Web Crypto implementation — no external dependencies.
 * Only supports 12-word mnemonics (128-bit entropy + 4-bit checksum).
 */

import { BIP39_ENGLISH } from "./bip39-wordlist";

const ENTROPY_BYTES = 16; // 128 bits → 12 words
const WORD_COUNT = 12;

/**
 * Generate a 12-word BIP39 mnemonic from 128 bits of entropy.
 */
export async function generateMnemonic(): Promise<string> {
  const entropy = crypto.getRandomValues(new Uint8Array(ENTROPY_BYTES));
  return entropyToMnemonic(entropy);
}

/**
 * Convert raw entropy bytes to a mnemonic sentence.
 *
 * 128 bits of entropy → SHA-256 hash → take first 4 bits as checksum →
 * concatenate entropy + checksum → split into 12 groups of 11 bits →
 * each group indexes into the 2048-word BIP39 wordlist.
 */
export async function entropyToMnemonic(entropy: Uint8Array): Promise<string> {
  if (entropy.length !== ENTROPY_BYTES) {
    throw new Error(`Expected ${ENTROPY_BYTES} bytes of entropy`);
  }

  const hash = new Uint8Array(
    await crypto.subtle.digest("SHA-256", entropy.buffer as ArrayBuffer),
  );

  // Build a bit string: entropy bits + first 4 bits of hash (checksum)
  const bits = bytesToBits(entropy) + bytesToBits(hash).slice(0, 4);

  const words: string[] = [];
  for (let i = 0; i < WORD_COUNT; i++) {
    const idx = parseInt(bits.slice(i * 11, i * 11 + 11), 2);
    words.push(BIP39_ENGLISH[idx]);
  }

  return words.join(" ");
}

/**
 * Convert a mnemonic back to its raw entropy bytes.
 * Throws if the mnemonic is invalid (bad checksum, wrong word count, unknown word).
 */
export async function mnemonicToEntropy(mnemonic: string): Promise<Uint8Array> {
  const words = mnemonic.trim().toLowerCase().split(/\s+/);
  if (words.length !== WORD_COUNT) {
    throw new Error(`Expected ${WORD_COUNT} words, got ${words.length}`);
  }

  let bits = "";
  for (const word of words) {
    const idx = BIP39_ENGLISH.indexOf(word);
    if (idx === -1) throw new Error(`Unknown BIP39 word: "${word}"`);
    bits += idx.toString(2).padStart(11, "0");
  }

  // 132 bits total: 128 entropy + 4 checksum
  const entropyBits = bits.slice(0, 128);
  const checksumBits = bits.slice(128);

  const entropy = bitsToBytes(entropyBits);

  // Verify checksum
  const hash = new Uint8Array(
    await crypto.subtle.digest("SHA-256", entropy.buffer as ArrayBuffer),
  );
  const expectedChecksum = bytesToBits(hash).slice(0, 4);

  if (checksumBits !== expectedChecksum) {
    throw new Error("Invalid mnemonic checksum");
  }

  return entropy;
}

/**
 * Validate a mnemonic without throwing.
 */
export async function validateMnemonic(mnemonic: string): Promise<boolean> {
  try {
    await mnemonicToEntropy(mnemonic);
    return true;
  } catch {
    return false;
  }
}

function bytesToBits(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(2).padStart(8, "0"))
    .join("");
}

function bitsToBytes(bits: string): Uint8Array {
  const bytes = new Uint8Array(bits.length / 8);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.slice(i * 8, i * 8 + 8), 2);
  }
  return bytes;
}
