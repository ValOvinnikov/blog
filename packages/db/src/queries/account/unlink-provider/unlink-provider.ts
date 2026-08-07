import { getDb } from '@blog/db/client';
import { accounts } from '@blog/db/schema/auth';
import { and, eq } from 'drizzle-orm';

import { getLinkedProviders } from '../get-linked-providers';

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
// touching the row) if `provider` is currently linked AND is the user's
// last remaining sign-in method, counted across all three methods this repo
// supports via `getLinkedProviders` — losing every sign-in method would
// permanently lock the user out of their account.
//
// A no-op (returns `unlinked`, matching this package's other delete-style
// mutations — see `removeBookmark`) if `provider` isn't currently linked
// for this user: there's no row to delete, and no risk of locking the user
// out since nothing changes.
export async function unlinkProvider(
  userId: string,
  provider: TLinkableProvider,
): Promise<TUnlinkProviderResult> {
  const db = getDb();

  const linked = await getLinkedProviders(userId);
  const linkedCount = [linked.github, linked.google, linked.emailLink].filter(
    Boolean,
  ).length;

  if (linked[provider] && linkedCount <= 1) {
    return { outcome: 'last-method' };
  }

  await db
    .delete(accounts)
    .where(and(eq(accounts.userId, userId), eq(accounts.provider, provider)));

  return { outcome: 'unlinked' };
}
