import type { TMaybeNull, TMaybeUndefined } from '@blog/config/types';
import {
  PERSONAL_DATA_FALLBACK_REASON,
  type TPersonalDataOwner,
} from '@blog/db/constants';
import {
  isEmailIndexConfigured,
  readPersonalValue,
  reportPlainPersonalRead,
  requireEmailIndex,
} from '@blog/db/utils/personal-data/personal-data';
import { notifyPersonalDataFallback } from '@blog/db/utils/personal-data/personal-data-fallback';
import { personalDataIndex } from '@blog/utils/encryption';
import { normalizeEmail } from '@blog/utils/normalize-email-identity';
import { and, eq, isNull, or, sql, type SQL } from 'drizzle-orm';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';

type TEmailAddressColumns = {
  index: AnyPgColumn;
  plain: AnyPgColumn;
  owner: TPersonalDataOwner;
};

type TEmailRow = {
  email: string;
  emailEncrypted: TMaybeNull<string>;
};

export function byEmailAddress(
  normalizedEmail: string,
  { index, plain, owner }: TEmailAddressColumns,
): TMaybeUndefined<SQL> {
  const plainMatch = sql`lower(trim(${plain})) = ${normalizedEmail}`;
  if (!isEmailIndexConfigured()) {
    notifyPersonalDataFallback({
      owner,
      reason: PERSONAL_DATA_FALLBACK_REASON.INDEX_KEY_UNSET,
    });
    return plainMatch;
  }

  return or(
    eq(index, requireEmailIndex(normalizedEmail, personalDataIndex)),
    and(isNull(index), plainMatch),
  );
}

// The index ignores a `+tag`, so a row it reaches matches only on its own exact address.
export function withExactEmailAddress<TRow extends TEmailRow>(
  rows: TRow[],
  normalizedEmail: string,
  owner: TPersonalDataOwner,
): Array<{ row: TRow; address: string }> {
  const matches = rows
    .map((row) => ({
      row,
      address: readPersonalValue(row.emailEncrypted, row.email),
    }))
    .filter(({ address }) => normalizeEmail(address) === normalizedEmail);
  matches.forEach(({ row }) =>
    reportPlainPersonalRead(owner, row.emailEncrypted),
  );

  return matches;
}
