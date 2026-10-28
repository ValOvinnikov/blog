import type { TMaybeNull } from '@blog/config/types';
import { env } from '@blog/db/utils/env/env';
import {
  accountEmailIndex,
  decryptPersonalData,
  encryptPersonalData,
  parsePersonalDataKeyring,
  personalDataIndex,
  type IPersonalDataKeyring,
} from '@blog/utils/encryption';
import { isNull } from '@blog/utils/primitives';

function requireEncryptionKeyring(): IPersonalDataKeyring {
  const raw = env.PERSONAL_DATA_ENCRYPTION_KEY;
  if (!raw) throw new Error('PERSONAL_DATA_ENCRYPTION_KEY is not configured.');
  return parsePersonalDataKeyring(raw);
}

export function encryptPersonalValue(value: string): string {
  return encryptPersonalData(value, requireEncryptionKeyring());
}

export function decryptPersonalValue(encrypted: string): string {
  return decryptPersonalData(encrypted, requireEncryptionKeyring());
}

export function decryptOptionalPersonalValue(
  encrypted: TMaybeNull<string>,
): TMaybeNull<string> {
  return isNull(encrypted) ? null : decryptPersonalValue(encrypted);
}

export type TEmailIndexer = (email: string, keyBase64: string) => string;

type TEmailColumns = {
  emailEncrypted: string;
  emailIndex: string;
};

export function requireEmailIndex(
  email: string,
  indexer: TEmailIndexer,
): string {
  const key = env.PERSONAL_DATA_INDEX_KEY;
  if (!key) throw new Error('PERSONAL_DATA_INDEX_KEY is not configured.');
  return indexer(email, key);
}

export function emailColumns(
  email: string,
  indexer: TEmailIndexer,
): TEmailColumns {
  return {
    emailEncrypted: encryptPersonalValue(email),
    emailIndex: requireEmailIndex(email, indexer),
  };
}

/** The email columns of a table kept unique per exact address, so `+tag` variants stay separate rows. */
export function uniqueEmailColumns(
  email: string,
): TEmailColumns & { emailExactIndex: string } {
  return {
    ...emailColumns(email, personalDataIndex),
    emailExactIndex: requireEmailIndex(email, accountEmailIndex),
  };
}
