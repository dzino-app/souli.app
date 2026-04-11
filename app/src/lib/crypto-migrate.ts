"use client";

/**
 * Migrate a user from crypto v1 (password-is-key) to v2 (wrapped master key).
 *
 * Flow:
 * 1. Derive old v1 key from password + salt
 * 2. Generate a random master key (v2)
 * 3. Load all encrypted data, re-encrypt under the new master key
 * 4. Wrap master key under password + recovery phrase
 * 5. Store wrapped keys + update crypto_version in DB
 * 6. Return the recovery mnemonic for one-time display
 */

import { deriveKey } from "./crypto";
import { toBase64 } from "./crypto";
import {
  generateMasterKey,
  deriveWrappingKey,
  deriveRecoveryWrappingKey,
  wrapMasterKey,
  generateRecoverySalt,
} from "./crypto-keys";
import { generateMnemonic, mnemonicToEntropy } from "./bip39";
import { initCryptoSessionV2 } from "./crypto-session";
import { createClient } from "./supabase/client";

export interface MigrationResult {
  mnemonic: string;
  success: boolean;
}

/**
 * Full v1 → v2 migration. Call this when a logged-in v1 user sets up recovery.
 *
 * The caller must have already verified the password (via Supabase auth).
 * This function re-encrypts all user data under the new master key.
 */
export async function migrateToV2(
  password: string,
  salt: Uint8Array,
): Promise<MigrationResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // 1. Derive old v1 key (for re-reading data)
  const oldKey = await deriveKey(password, salt);

  // 2. Generate new master key
  const masterKey = await generateMasterKey();

  // 3. Re-encrypt conversations
  await reEncryptMessages(supabase, user.id, oldKey, masterKey);

  // 4. Re-encrypt soul files
  await reEncryptSoulFiles(supabase, user.id, oldKey, masterKey);

  // 5. Generate recovery phrase + wrap master key
  const mnemonic = await generateMnemonic();
  const entropy = await mnemonicToEntropy(mnemonic);
  const recoverySalt = generateRecoverySalt();

  const passwordWrappingKey = await deriveWrappingKey(password, salt);
  const recoveryWrappingKey = await deriveRecoveryWrappingKey(entropy, recoverySalt);

  const wrappedByPassword = await wrapMasterKey(masterKey, passwordWrappingKey);
  const wrappedByRecovery = await wrapMasterKey(masterKey, recoveryWrappingKey);

  // 6. Store in DB
  const { error } = await supabase
    .from("user_crypto")
    .update({
      crypto_version: 2,
      wrapped_key_password: wrappedByPassword,
      wrapped_key_recovery: wrappedByRecovery,
      recovery_salt: toBase64(recoverySalt),
      recovery_created_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (error) {
    console.error("[crypto-migrate] Failed to update user_crypto:", error);
    return { mnemonic: "", success: false };
  }

  // 7. Switch session to the new master key
  initCryptoSessionV2(masterKey, salt);

  return { mnemonic, success: true };
}

// ---- Internal: re-encrypt data ----

import { encrypt, decrypt, isEncrypted } from "./crypto";

async function reEncryptMessages(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  oldKey: CryptoKey,
  newKey: CryptoKey,
): Promise<void> {
  // Get all conversations for this user
  const { data: convos } = await supabase
    .from("conversations")
    .select("id")
    .eq("user_id", userId);

  if (!convos?.length) return;

  const convoIds = convos.map((c) => c.id);

  // Get all messages
  const { data: messages } = await supabase
    .from("messages")
    .select("id, content")
    .in("conversation_id", convoIds);

  if (!messages?.length) return;

  // Re-encrypt each message
  for (const msg of messages) {
    if (!isEncrypted(msg.content)) continue;
    try {
      const plaintext = await decrypt(msg.content, oldKey);
      const newCiphertext = await encrypt(plaintext, newKey);
      await supabase
        .from("messages")
        .update({ content: newCiphertext })
        .eq("id", msg.id);
    } catch {
      console.warn(`[crypto-migrate] Skipping message ${msg.id} — decrypt failed`);
    }
  }
}

async function reEncryptSoulFiles(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  oldKey: CryptoKey,
  newKey: CryptoKey,
): Promise<void> {
  // List soul files in storage
  const { data: files } = await supabase.storage
    .from("souls")
    .list(userId, { limit: 200 });

  if (!files?.length) return;

  for (const file of files) {
    const path = `${userId}/${file.name}`;
    const { data: blob } = await supabase.storage
      .from("souls")
      .download(path);

    if (!blob) continue;

    const raw = await blob.text();
    if (!isEncrypted(raw)) continue;

    try {
      const plaintext = await decrypt(raw, oldKey);
      const newCiphertext = await encrypt(plaintext, newKey);
      await supabase.storage
        .from("souls")
        .upload(path, newCiphertext, {
          contentType: "text/plain",
          upsert: true,
        });
    } catch {
      console.warn(`[crypto-migrate] Skipping soul file ${path} — decrypt failed`);
    }
  }
}
