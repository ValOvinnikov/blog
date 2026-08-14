import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
// 96-bit IV is the AES-GCM-recommended length (NIST SP 800-38D).
const IV_LENGTH = 12;

/**
 * Encrypts `plaintext` with a 32-byte AES-256-GCM key (base64-encoded).
 * Returns `iv.authTag.ciphertext`, each segment base64url — safe to store
 * as a single text column value. A fresh random IV each call means the
 * same plaintext never produces the same ciphertext twice.
 */
export function encryptSecret(plaintext: string, keyBase64: string): string {
  const key = Buffer.from(keyBase64, 'base64');
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [iv, authTag, ciphertext]
    .map((buffer) => buffer.toString('base64url'))
    .join('.');
}

/** Inverse of {@link encryptSecret}. Throws on a wrong key or malformed input — GCM's auth tag makes tampering/corruption detectable, not silently wrong. */
export function decryptSecret(encrypted: string, keyBase64: string): string {
  const key = Buffer.from(keyBase64, 'base64');
  const [ivB64, authTagB64, ciphertextB64] = encrypted.split('.');
  if (!ivB64 || !authTagB64 || !ciphertextB64) {
    throw new Error('Malformed encrypted secret.');
  }

  const decipher = createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(ivB64, 'base64url'),
  );
  decipher.setAuthTag(Buffer.from(authTagB64, 'base64url'));

  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextB64, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}
