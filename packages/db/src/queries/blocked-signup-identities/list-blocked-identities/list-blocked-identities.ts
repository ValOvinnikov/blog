import type { TMaybeNull } from '@blog/config';
import type { TErrorCode } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import { admins } from '@blog/db/schema/admins';
import { users } from '@blog/db/schema/auth';
import {
  blockedSignupIdentities,
  type TBlockedSignupIdentity,
} from '@blog/db/schema/blocked-signup-identities';
import type { TResult } from '@blog/utils';
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
      addedByEmail: users.email,
    })
    .from(blockedSignupIdentities)
    .leftJoin(admins, eq(admins.id, blockedSignupIdentities.createdByAdminId))
    .leftJoin(users, eq(users.id, admins.userId))
    .orderBy(
      desc(blockedSignupIdentities.createdAt),
      desc(blockedSignupIdentities.id),
    );

  return {
    ok: true,
    data: rows.map(({ entry, addedByEmail }) => ({ ...entry, addedByEmail })),
  };
}
