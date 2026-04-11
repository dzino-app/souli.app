import { describe, it, expect, beforeEach } from "bun:test";
import {
  deriveKey,
  encrypt,
  decrypt,
  generateSalt,
  toBase64,
  fromBase64,
  isEncrypted,
  ENCRYPTED_PREFIX,
} from "../crypto";
import {
  initCryptoSession,
  getCryptoKey,
  clearCryptoSession,
  isEncryptionActive,
  encryptIfActive,
  decryptIfActive,
} from "../crypto-session";

describe("crypto", () => {
  describe("base64 helpers", () => {
    it("roundtrips bytes through base64", () => {
      const original = new Uint8Array([0, 1, 127, 128, 255]);
      const encoded = toBase64(original);
      const decoded = fromBase64(encoded);
      expect(decoded).toEqual(original);
    });

    it("handles empty array", () => {
      const empty = new Uint8Array(0);
      const encoded = toBase64(empty);
      const decoded = fromBase64(encoded);
      expect(decoded).toEqual(empty);
    });
  });

  describe("salt generation", () => {
    it("generates 16-byte salt", () => {
      const salt = generateSalt();
      expect(salt.length).toBe(16);
    });

    it("generates unique salts", () => {
      const salt1 = generateSalt();
      const salt2 = generateSalt();
      expect(toBase64(salt1)).not.toBe(toBase64(salt2));
    });
  });

  describe("key derivation", () => {
    it("derives a CryptoKey from password and salt", async () => {
      const salt = generateSalt();
      const key = await deriveKey("test-password", salt);
      expect(key).toBeTruthy();
      expect(key.type).toBe("secret");
      expect(key.algorithm).toMatchObject({ name: "AES-GCM", length: 256 });
    });

    it("same password + salt produces consistent encryption", async () => {
      const salt = generateSalt();
      const key1 = await deriveKey("same-password", salt);
      const key2 = await deriveKey("same-password", salt);

      // Both keys should decrypt data encrypted by the other
      const encrypted = await encrypt("test data", key1);
      const decrypted = await decrypt(encrypted, key2);
      expect(decrypted).toBe("test data");
    });

    it("different passwords produce different keys", async () => {
      const salt = generateSalt();
      const key1 = await deriveKey("password-a", salt);
      const key2 = await deriveKey("password-b", salt);

      const encrypted = await encrypt("test data", key1);
      // Decrypting with wrong key should fail
      await expect(decrypt(encrypted, key2)).rejects.toThrow();
    });

    it("different salts produce different keys", async () => {
      const salt1 = generateSalt();
      const salt2 = generateSalt();
      const key1 = await deriveKey("same-password", salt1);
      const key2 = await deriveKey("same-password", salt2);

      const encrypted = await encrypt("test data", key1);
      await expect(decrypt(encrypted, key2)).rejects.toThrow();
    });
  });

  describe("encrypt / decrypt", () => {
    let key: CryptoKey;

    beforeEach(async () => {
      const salt = generateSalt();
      key = await deriveKey("test-password-123", salt);
    });

    it("roundtrips plaintext through encrypt/decrypt", async () => {
      const original = "Hello, world! This is a secret message.";
      const encrypted = await encrypt(original, key);
      const decrypted = await decrypt(encrypted, key);
      expect(decrypted).toBe(original);
    });

    it("encrypted output starts with enc: prefix", async () => {
      const encrypted = await encrypt("test", key);
      expect(encrypted.startsWith(ENCRYPTED_PREFIX)).toBe(true);
    });

    it("encrypted output has correct format (enc:iv:ciphertext)", async () => {
      const encrypted = await encrypt("test", key);
      const parts = encrypted.split(":");
      expect(parts.length).toBe(3); // "enc", iv, ciphertext
      expect(parts[0]).toBe("enc");
    });

    it("produces different ciphertexts for same plaintext (random IV)", async () => {
      const encrypted1 = await encrypt("same input", key);
      const encrypted2 = await encrypt("same input", key);
      expect(encrypted1).not.toBe(encrypted2);
    });

    it("handles empty string", async () => {
      const encrypted = await encrypt("", key);
      const decrypted = await decrypt(encrypted, key);
      expect(decrypted).toBe("");
    });

    it("handles unicode content", async () => {
      const original = "Ahoj, ako sa mas? Dzino je super! Emojis too!";
      const encrypted = await encrypt(original, key);
      const decrypted = await decrypt(encrypted, key);
      expect(decrypted).toBe(original);
    });

    it("handles long content (soul files)", async () => {
      const original = "# Soul File\n\n" + "- Entry ".repeat(1000) + "\n\nEnd.";
      const encrypted = await encrypt(original, key);
      const decrypted = await decrypt(encrypted, key);
      expect(decrypted).toBe(original);
    });

    it("detects tampered ciphertext", async () => {
      const encrypted = await encrypt("sensitive data", key);
      // Tamper with one character in the ciphertext portion
      const tampered = encrypted.slice(0, -2) + "AA";
      await expect(decrypt(tampered, key)).rejects.toThrow();
    });
  });

  describe("isEncrypted", () => {
    it("returns true for encrypted strings", async () => {
      const salt = generateSalt();
      const key = await deriveKey("pw", salt);
      const encrypted = await encrypt("test", key);
      expect(isEncrypted(encrypted)).toBe(true);
    });

    it("returns false for plaintext", () => {
      expect(isEncrypted("Hello, world!")).toBe(false);
      expect(isEncrypted("# Soul File")).toBe(false);
      expect(isEncrypted("")).toBe(false);
    });
  });
});

describe("crypto-session", () => {
  beforeEach(() => {
    clearCryptoSession();
  });

  it("starts with no active session", () => {
    expect(isEncryptionActive()).toBe(false);
    expect(getCryptoKey()).toBeNull();
  });

  it("initializes a session from password and salt", async () => {
    const salt = generateSalt();
    await initCryptoSession("my-password", salt);
    expect(isEncryptionActive()).toBe(true);
    expect(getCryptoKey()).not.toBeNull();
  });

  it("clears the session", async () => {
    const salt = generateSalt();
    await initCryptoSession("my-password", salt);
    expect(isEncryptionActive()).toBe(true);
    clearCryptoSession();
    expect(isEncryptionActive()).toBe(false);
    expect(getCryptoKey()).toBeNull();
  });

  describe("encryptIfActive / decryptIfActive", () => {
    it("passes through when no session is active", async () => {
      const text = "plaintext data";
      const result = await encryptIfActive(text);
      expect(result).toBe(text);
    });

    it("decryptIfActive passes through plaintext", async () => {
      const text = "plaintext data";
      const result = await decryptIfActive(text);
      expect(result).toBe(text);
    });

    it("encrypts and decrypts when session is active", async () => {
      const salt = generateSalt();
      await initCryptoSession("session-password", salt);

      const original = "This is private user data";
      const encrypted = await encryptIfActive(original);
      expect(encrypted).not.toBe(original);
      expect(isEncrypted(encrypted)).toBe(true);

      const decrypted = await decryptIfActive(encrypted);
      expect(decrypted).toBe(original);
    });

    it("decryptIfActive returns empty when no session — never leaks ciphertext", async () => {
      const salt = generateSalt();
      await initCryptoSession("session-password", salt);

      const encrypted = await encryptIfActive("secret");
      clearCryptoSession();

      // Without session, ciphertext must NOT be returned to callers — they could
      // forward it to the LLM or render it. We return empty instead.
      const result = await decryptIfActive(encrypted);
      expect(result).toBe("");
    });
  });
});
