import { getDb } from '@blog/db/client';
import { accounts, users } from '@blog/db/schema/auth';
import { and, eq, sql } from 'drizzle-orm';

// The two sign-in methods this function can actually remove. GitHub and
// Google each own a real `accounts` row keyed by `provider` (schema/auth.ts);
// the email magic-link method has no `accounts` row to delete, so it is
// deliberately not a valid target here — "unlinking" it would mean clearing
// `users.emailVerified`, a different operation this function doesn't
// attempt. If a future ticket needs to let a user drop the magic-link
// method, that belongs in its own function against `users`, not this one.
export type TLinkableProvider = 'github' | 'google';

export type TUnlinkProviderResult =
  { outcome: 'unlinked' } | { outcome: 'last-method' };

// Deletes the `accounts` row for (userId, provider) — the `/account` hub's
// 6c "connected accounts" disconnect action (Epic #1159). Rejects (without
// touching the row) if `provider` is currently linked AND is the user's last
// remaining sign-in method (counted across all three methods this repo
// supports: the other `accounts` rows plus `users.emailVerified`) — losing
// every sign-in method would permanently lock the user out of their account.
//
// The guard and the delete run as ONE statement (a `WITH ... FOR UPDATE` CTE
// feeding the `DELETE`'s `WHERE`), not a JS-level read-then-write: two
// concurrent calls for the same user targeting *different* providers (a
// double-click, or two open tabs) would otherwise both read "2 methods
// linked" before either delete lands, both pass the count check, and both
// proceed — leaving zero linked methods. `locked_accounts` selects every
// `accounts` row for this user `FOR UPDATE`, so a second concurrent call
// necessarily tries to lock the *same* rows (it always selects the full set,
// not just its own target) and blocks until the first call's transaction
// ends; Postgres's `FOR UPDATE` re-check (EvalPlanQual) then drops any row
// the first call already deleted before the second call's count is
// evaluated, so the second call correctly sees the post-delete state rather
// than a stale pre-delete snapshot. A plain (unlocked) read of
// `users.emailVerified` is safe here — nothing in this domain concurrently
// writes it.
//
// This can't be a `db.transaction()` (the runtime `neon-http` driver has no
// multi-statement transaction support — see src/client.ts) — a single
// atomic statement is the mechanism available here.
//
// A no-op (returns `unlinked`, matching this package's other delete-style
// mutations — see `removeBookmark`) if `provider` isn't currently linked for
// this user: the `WHERE provider = ...` clause simply matches no row, and a
// follow-up read distinguishes that from a guard rejection to pick the
// right outcome.
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
        .for('update'),
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

  if (deletedRows.length > 0) {
    return { outcome: 'unlinked' };
  }

  const [stillLinked] = await db
    .select({ provider: accounts.provider })
    .from(accounts)
    .where(and(eq(accounts.userId, userId), eq(accounts.provider, provider)));

  return stillLinked ? { outcome: 'last-method' } : { outcome: 'unlinked' };
}
