import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

import { KEY_ENCODING, PAYLOAD_ENCODING } from './crypto-encoding';

const ALGORITHM = 'aes-256-gcm';
// 96-bit IV is the AES-GCM-recommended length (NIST SP 800-38D).
const IV_LENGTH = 12;

/** A fresh random IV each call, so one plaintext never encrypts to the same value twice and the output cannot be looked up. */
export function encryptSecret(plaintext: string, keyBase64: string): string {
  const key = Buffer.from(keyBase64, KEY_ENCODING);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [iv, authTag, ciphertext]
    .map((buffer) => buffer.toString(PAYLOAD_ENCODING))
    .join('.');
}

/** Throws on a wrong key or a tampered value rather than returning garbage. */
export function decryptSecret(encrypted: string, keyBase64: string): string {
  const key = Buffer.from(keyBase64, KEY_ENCODING);
  const segments = encrypted.split('.');
  if (segments.length !== 3) {
    throw new Error('Malformed encrypted secret.');
  }
  const [ivB64, authTagB64, ciphertextB64] = segments as [
    string,
    string,
    string,
  ];

  const decipher = createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(ivB64, PAYLOAD_ENCODING),
  );
  decipher.setAuthTag(Buffer.from(authTagB64, PAYLOAD_ENCODING));

  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextB64, PAYLOAD_ENCODING)),
    decipher.final(),
  ]).toString('utf8');
}
