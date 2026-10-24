import { createHmac } from 'node:crypto';

import { SHA256_ALGORITHM } from '@blog/utils/hash';
import {
  normalizeEmail,
  normalizeEmailIdentity,
} from '@blog/utils/normalize-email-identity';

import { KEY_ENCODING, PAYLOAD_ENCODING } from './crypto-encoding';
import { decryptSecret, encryptSecret } from './encrypt-secret';

const VERSION_SEPARATOR = ':';
const KEY_SEPARATOR = ',';
const KEY_VERSION_PATTERN = /^v\d+$/;
const BASE64_PATTERN = /^[A-Za-z0-9+/]+={0,2}$/;
// AES-256 and the HMAC-SHA256 index both take a 256-bit key.
const PERSONAL_DATA_KEY_BYTES = 32;

export const PERSONAL_DATA_KEY_FORMAT =
  'Must be a 32-byte key, base64-encoded (openssl rand -base64 32).';
export const PERSONAL_DATA_KEYRING_FORMAT =
  'Must be comma-separated v<n>:<key> entries, each key 32 bytes base64-encoded (openssl rand -base64 32).';

export interface IPersonalDataKeyring {
  currentVersion: string;
  keys: Readonly<Record<string, string>>;
}

export function isPersonalDataKey(keyBase64: string): boolean {
  return (
    BASE64_PATTERN.test(keyBase64) &&
    Buffer.from(keyBase64, KEY_ENCODING).length === PERSONAL_DATA_KEY_BYTES
  );
}

/** Reads `PERSONAL_DATA_ENCRYPTION_KEY`'s `v2:<base64>,v1:<base64>` form; the first entry encrypts, every entry decrypts. */
export function parsePersonalDataKeyring(raw: string): IPersonalDataKeyring {
  const entries = raw
    .split(KEY_SEPARATOR)
    .map((entry) => entry.trim().split(VERSION_SEPARATOR));

  const keys: Record<string, string> = {};
  for (const [version, key, ...rest] of entries) {
    if (
      !version ||
      !KEY_VERSION_PATTERN.test(version) ||
      !key ||
      !isPersonalDataKey(key) ||
      rest.length > 0 ||
      version in keys
    ) {
      throw new Error('Malformed personal data keyring.');
    }
    keys[version] = key;
  }

  const [[currentVersion = ''] = []] = entries;
  return { currentVersion, keys };
}

export function isPersonalDataKeyring(raw: string): boolean {
  try {
    parsePersonalDataKeyring(raw);
    return true;
  } catch {
    return false;
  }
}

export function encryptPersonalData(
  plaintext: string,
  keyring: IPersonalDataKeyring,
): string {
  const { currentVersion, keys } = keyring;
  const key = keys[currentVersion];
  if (!key) throw new Error('Missing current personal data key.');

  return `${currentVersion}${VERSION_SEPARATOR}${encryptSecret(plaintext, key)}`;
}

export function decryptPersonalData(
  encrypted: string,
  keyring: IPersonalDataKeyring,
): string {
  const separatorIndex = encrypted.indexOf(VERSION_SEPARATOR);
  const version = encrypted.slice(0, separatorIndex);
  const { keys } = keyring;
  const key = Object.hasOwn(keys, version) ? keys[version] : undefined;
  if (!key) throw new Error('Unknown personal data key version.');

  return decryptSecret(encrypted.slice(separatorIndex + 1), key);
}

function keyedIndex(value: string, keyBase64: string): string {
  return createHmac(SHA256_ALGORITHM, Buffer.from(keyBase64, KEY_ENCODING))
    .update(value)
    .digest(PAYLOAD_ENCODING);
}

/** A keyed hash of the mailbox an email lookup compares against instead of the address itself; `+tag` variants share it. */
export function personalDataIndex(email: string, keyBase64: string): string {
  return keyedIndex(normalizeEmailIdentity(email), keyBase64);
}

/** A keyed hash of the exact address an account is looked up by; `+tag` variants each get their own. */
export function accountEmailIndex(email: string, keyBase64: string): string {
  return keyedIndex(normalizeEmail(email), keyBase64);
}
