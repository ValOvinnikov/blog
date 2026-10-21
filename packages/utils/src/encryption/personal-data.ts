import { createHmac } from 'node:crypto';

import { normalizeEmailIdentity } from '@blog/utils/normalize-email-identity';

import {
  HMAC_ALGORITHM,
  KEY_ENCODING,
  PAYLOAD_ENCODING,
} from './crypto-encoding';
import { decryptSecret, encryptSecret } from './encrypt-secret';

const VERSION_SEPARATOR = ':';
const KEY_SEPARATOR = ',';
const KEY_VERSION_PATTERN = /^v\d+$/;

export interface IPersonalDataKeyring {
  currentVersion: string;
  keys: Readonly<Record<string, string>>;
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

/** A keyed hash of the address an email lookup compares against instead of the address itself. */
export function personalDataIndex(email: string, keyBase64: string): string {
  return createHmac(HMAC_ALGORITHM, Buffer.from(keyBase64, KEY_ENCODING))
    .update(normalizeEmailIdentity(email))
    .digest(PAYLOAD_ENCODING);
}
