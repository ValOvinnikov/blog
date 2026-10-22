import type { TMaybeNull } from '@blog/config/types';
import { env } from '@blog/db/utils/env/env';
import {
  accountEmailIndex,
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

export function readPersonalValue(
  encrypted: TMaybeNull<string>,
  plain: string,
): string {
  return encrypted === null ? plain : decryptPersonalValue(encrypted);
}

type TEmailIndexer = (email: string, keyBase64: string) => string;

type TPersonalEmailColumns = {
  emailEncrypted: TMaybeNull<string>;
  emailIndex: TMaybeNull<string>;
};

function indexEmail(email: string, indexer: TEmailIndexer): TMaybeNull<string> {
  const key = env.PERSONAL_DATA_INDEX_KEY;
  return key ? indexer(email, key) : null;
}

function requireEmailIndex(email: string, indexer: TEmailIndexer): string {
  const index = indexEmail(email, indexer);
  if (!index) throw new Error('PERSONAL_DATA_INDEX_KEY is not configured.');
  return index;
}

export function requirePersonalEmailIndex(email: string): string {
  return requireEmailIndex(email, personalDataIndex);
}

export function requireAccountEmailIndex(email: string): string {
  return requireEmailIndex(email, accountEmailIndex);
}

export function personalEmailColumns(email: string): TPersonalEmailColumns {
  return {
    emailEncrypted: encryptPersonalValue(email),
    emailIndex: indexEmail(email, personalDataIndex),
  };
}

export function accountEmailColumns(email: string): TPersonalEmailColumns {
  return {
    emailEncrypted: encryptPersonalValue(email),
    emailIndex: indexEmail(email, accountEmailIndex),
  };
}
