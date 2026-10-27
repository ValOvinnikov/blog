import type { TMaybeNull, TMaybeUndefined } from '@blog/config/types';
import {
  PERSONAL_DATA_FALLBACK_REASON,
  type TPersonalDataFallbackReason,
  type TPersonalDataOwner,
} from '@blog/db/constants';
import { env } from '@blog/db/utils/env/env';
import { notifyPersonalDataFallback } from '@blog/db/utils/personal-data/personal-data-fallback';
import {
  decryptPersonalData,
  encryptPersonalData,
  parsePersonalDataKeyring,
} from '@blog/utils/encryption';
import { isNull } from '@blog/utils/primitives';

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

function plainReadReason(
  encrypted: TMaybeNull<string>,
): TMaybeUndefined<TPersonalDataFallbackReason> {
  if (isNull(encrypted)) return PERSONAL_DATA_FALLBACK_REASON.NOT_BACKFILLED;
  if (!env.PERSONAL_DATA_ENCRYPTION_KEY) {
    return PERSONAL_DATA_FALLBACK_REASON.ENCRYPTION_KEY_UNSET;
  }
  return undefined;
}

// TODO: drop the plain fallback along with the plain columns (#5666).
export function readOptionalPersonalValue(
  encrypted: TMaybeNull<string>,
  plain: TMaybeNull<string>,
): TMaybeNull<string> {
  if (isNull(encrypted) || !env.PERSONAL_DATA_ENCRYPTION_KEY) return plain;
  return decryptPersonalValue(encrypted);
}

export function readPersonalValue(
  encrypted: TMaybeNull<string>,
  plain: string,
): string {
  return readOptionalPersonalValue(encrypted, plain) ?? plain;
}

export function reportPlainPersonalRead(
  owner: TPersonalDataOwner,
  encrypted: TMaybeNull<string>,
): void {
  const reason = plainReadReason(encrypted);
  if (reason) notifyPersonalDataFallback({ owner, reason });
}

export function readReportedPersonalValue(
  owner: TPersonalDataOwner,
  encrypted: TMaybeNull<string>,
  plain: TMaybeNull<string>,
): TMaybeNull<string> {
  const value = readOptionalPersonalValue(encrypted, plain);
  if (!isNull(value)) reportPlainPersonalRead(owner, encrypted);
  return value;
}

export type TEmailIndexer = (email: string, keyBase64: string) => string;

type TEmailColumns = {
  emailEncrypted: TMaybeNull<string>;
  emailIndex: TMaybeNull<string>;
};

function indexEmail(email: string, indexer: TEmailIndexer): TMaybeNull<string> {
  const key = env.PERSONAL_DATA_INDEX_KEY;
  return key ? indexer(email, key) : null;
}

export function isEmailIndexConfigured(): boolean {
  return Boolean(env.PERSONAL_DATA_INDEX_KEY);
}

export function requireEmailIndex(
  email: string,
  indexer: TEmailIndexer,
): string {
  const index = indexEmail(email, indexer);
  if (!index) throw new Error('PERSONAL_DATA_INDEX_KEY is not configured.');
  return index;
}

export function emailColumns(
  email: string,
  indexer: TEmailIndexer,
): TEmailColumns {
  return {
    emailEncrypted: encryptPersonalValue(email),
    emailIndex: indexEmail(email, indexer),
  };
}
