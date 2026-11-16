import type { TMaybeNull } from '@shinefold/config';
import type { TErrorCode } from '@shinefold/config/constants';
import { getDb } from '@shinefold/db/client';
import { admins } from '@shinefold/db/schema/admins';
import { users } from '@shinefold/db/schema/auth';
import {
  blockedSignupIdentities,
  type TBlockedSignupIdentity,
} from '@shinefold/db/schema/blocked-signup-identities';
import { decryptOptionalPersonalValue } from '@shinefold/db/utils/personal-data/personal-data';
import { okResult, type TResult } from '@shinefold/utils';
import { desc, eq } from 'drizzle-orm';

export type TBlockedIdentityListing = TBlockedSignupIdentity & {
  addedByEmail: TMaybeNull<string>;
};

export async function listBlockedIdentities(): Promise<
  TResult<TBlockedIdentityListing[], TErrorCode>
> {
  const db = getDb();

  const rows = await db
    .select({
      entry: blockedSignupIdentities,
      addedByEmailEncrypted: users.emailEncrypted,
    })
    .from(blockedSignupIdentities)
    .leftJoin(admins, eq(admins.id, blockedSignupIdentities.createdByAdminId))
    .leftJoin(users, eq(users.id, admins.userId))
    .orderBy(
      desc(blockedSignupIdentities.createdAt),
      desc(blockedSignupIdentities.id),
    );

  return okResult(
    rows.map(({ entry, addedByEmailEncrypted }) => ({
      ...entry,
      addedByEmail: decryptOptionalPersonalValue(addedByEmailEncrypted),
    })),
  );
}
