import type { TOutcome } from '@blog/config';
import type { TOAuthProvider } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import { ROW_LOCK } from '@blog/db/constants';
import { accounts, users } from '@blog/db/schema/auth';
import { hasLength } from '@blog/utils/primitives';
import { toOutcome } from '@blog/utils/to-outcome';
import { and, eq, sql } from 'drizzle-orm';

// The magic-link method has no `accounts` row to delete, so it is not a
// valid target; dropping it means clearing `users.emailVerified` instead.
export type TLinkableProvider = TOAuthProvider;

export type TUnlinkProviderResult =
  TOutcome<'unlinked'> | TOutcome<'last-method'>;

// Refuses to remove the user's last sign-in method. The guard and the delete
// are one statement because `neon-http` has no transactions: the CTE locks
// every `accounts` row for the user `FOR UPDATE`, so two concurrent unlinks
// of different providers cannot both pass the count and leave zero methods.
// Performs no authorization check — pass the session's own user id.
export async function unlinkProvider(
  userId: string,
  provider: TLinkableProvider,
): Promise<TUnlinkProviderResult> {
  const db = getDb();

  const lockedAccounts = db
    .$with('locked_accounts')
    .as(
      db
        .select({ provider: accounts.provider })
        .from(accounts)
        .where(eq(accounts.userId, userId))
        .for(ROW_LOCK.UPDATE),
    );

  const deletedRows = await db
    .with(lockedAccounts)
    .delete(accounts)
    .where(
      and(
        eq(accounts.userId, userId),
        eq(accounts.provider, provider),
        sql`(
          (select count(*) from ${lockedAccounts} where ${lockedAccounts.provider} <> ${provider})
          + (select case when ${users.emailVerified} is not null then 1 else 0 end
             from ${users} where ${users.id} = ${userId})
        ) >= 1`,
      ),
    )
    .returning();

  if (hasLength(deletedRows)) {
    return toOutcome('unlinked');
  }

  const [stillLinked] = await db
    .select({ provider: accounts.provider })
    .from(accounts)
    .where(and(eq(accounts.userId, userId), eq(accounts.provider, provider)));

  return stillLinked ? toOutcome('last-method') : toOutcome('unlinked');
}
