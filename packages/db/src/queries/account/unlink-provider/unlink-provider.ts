import type { TOutcome } from '@shinefold/config';
import type { TOAuthProvider } from '@shinefold/config/constants';
import { getDb } from '@shinefold/db/client';
import {
  ROW_LOCK,
  type TUnlinkProviderOutcome,
  UNLINK_PROVIDER_OUTCOME,
} from '@shinefold/db/constants';
import { accounts, users } from '@shinefold/db/schema/auth';
import { hasLength } from '@shinefold/utils/primitives';
import { toOutcome } from '@shinefold/utils/to-outcome';
import { and, eq, sql } from 'drizzle-orm';

// Magic link has no `accounts` row to delete; dropping it means clearing `users.emailVerified` instead.
export type TLinkableProvider = TOAuthProvider;

export type TUnlinkProviderResult = TOutcome<TUnlinkProviderOutcome>;

// Guard and delete share one statement because `neon-http` has no transactions, and the CTE's `FOR UPDATE` lock stops two concurrent unlinks leaving zero methods; no authorization check is made.
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
    .returning({ provider: accounts.provider });

  if (hasLength(deletedRows)) {
    return toOutcome(UNLINK_PROVIDER_OUTCOME.UNLINKED);
  }

  const [stillLinked] = await db
    .select({ provider: accounts.provider })
    .from(accounts)
    .where(and(eq(accounts.userId, userId), eq(accounts.provider, provider)));

  return stillLinked
    ? toOutcome(UNLINK_PROVIDER_OUTCOME.LAST_METHOD)
    : toOutcome(UNLINK_PROVIDER_OUTCOME.UNLINKED);
}
