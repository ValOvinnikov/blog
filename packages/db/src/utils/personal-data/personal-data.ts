import type { TMaybeNull } from '@blog/config/types';
import { env } from '@blog/db/utils/env/env';
import {
  decryptPersonalData,
  encryptPersonalData,
  parsePersonalDataKeyring,
  personalDataIndex,
} from '@blog/utils/encryption';

// Null while a key is unset, so writes keep working on the plain columns and the backfill fills the gap.
export function encryptPersonalValue(value: string): TMaybeNull<string> {
  const raw = env.PERSONAL_DATA_ENCRYPTION_KEY;
  return raw ? encryptPersonalData(value, parsePersonalDataKeyring(raw)) : null;
}

export function decryptPersonalValue(encrypted: string): string {
  const raw = env.PERSONAL_DATA_ENCRYPTION_KEY;
  if (!raw) throw new Error('PERSONAL_DATA_ENCRYPTION_KEY is not configured.');
  return decryptPersonalData(encrypted, parsePersonalDataKeyring(raw));
}

function indexPersonalEmail(email: string): TMaybeNull<string> {
  const key = env.PERSONAL_DATA_INDEX_KEY;
  return key ? personalDataIndex(email, key) : null;
}

export function requirePersonalEmailIndex(email: string): string {
  const index = indexPersonalEmail(email);
  if (!index) throw new Error('PERSONAL_DATA_INDEX_KEY is not configured.');
  return index;
}

export function personalEmailColumns(email: string): {
  emailEncrypted: TMaybeNull<string>;
  emailIndex: TMaybeNull<string>;
} {
  return {
    emailEncrypted: encryptPersonalValue(email),
    emailIndex: indexPersonalEmail(email),
  };
}
