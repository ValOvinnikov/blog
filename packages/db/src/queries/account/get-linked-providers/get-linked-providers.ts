import { getDb } from '@blog/db/client';
import { accounts, users } from '@blog/db/schema/auth';
import { eq } from 'drizzle-orm';

// The `/account` hub's 6c "connected accounts" section (Epic #1159) needs
// the linked status of all three sign-in methods this repo ships (per
// schema/auth.ts's own comment: GitHub, Google, email magic link). GitHub
// and Google each show up as a row in `accounts` keyed by `provider`; the
// email magic-link method has no `accounts` row at all — its signal is
// `users.emailVerified` being non-null (Auth.js sets it once a magic-link
// sign-in verifies).
export type TLinkedProviders = {
  github: boolean;
  google: boolean;
  emailLink: boolean;
};

// Returns all-`false` (never `undefined`) if `userId` doesn't match a
// `users` row — "nothing is linked" is a real (if unusual) answer to "what's
// linked for this account", not an absent value the caller has to
// re-interpret, matching how `getSubscriptionStatus` treats a missing user
// as a real terminal state rather than a missing one.
export async function getLinkedProviders(
  userId: string,
): Promise<TLinkedProviders> {
  const db = getDb();

  const [user] = await db
    .select({ emailVerified: users.emailVerified })
    .from(users)
    .where(eq(users.id, userId));

  const linkedAccounts = await db
    .select({ provider: accounts.provider })
    .from(accounts)
    .where(eq(accounts.userId, userId));

  const linkedProviderNames = new Set(
    linkedAccounts.map((account) => account.provider),
  );

  return {
    github: linkedProviderNames.has('github'),
    google: linkedProviderNames.has('google'),
    emailLink: user?.emailVerified != null,
  };
}
