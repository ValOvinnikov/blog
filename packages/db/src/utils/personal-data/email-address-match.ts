import {
  decryptPersonalValue,
  requireEmailIndex,
} from '@blog/db/utils/personal-data/personal-data';
import { personalDataIndex } from '@blog/utils/encryption';
import { normalizeEmail } from '@blog/utils/normalize-email-identity';
import { eq, type SQL } from 'drizzle-orm';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';

type TEmailRow = {
  emailEncrypted: string;
};

export function byEmailAddress(
  normalizedEmail: string,
  index: AnyPgColumn,
): SQL {
  return eq(index, requireEmailIndex(normalizedEmail, personalDataIndex));
}

// The index ignores a `+tag`, so a row it reaches matches only on its own exact address.
export function withExactEmailAddress<TRow extends TEmailRow>(
  rows: TRow[],
  normalizedEmail: string,
): Array<{ row: TRow; address: string }> {
  return rows
    .map((row) => ({ row, address: decryptPersonalValue(row.emailEncrypted) }))
    .filter(({ address }) => normalizeEmail(address) === normalizedEmail);
}
