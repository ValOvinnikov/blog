'use server';

import { queries } from '@blog/db';
import { auth } from '@web/server/auth/auth';
import { sanitizeLogMessage } from '@web/utils/sanitize-log-message';

// The two sign-in methods `ProviderLinkControl` can unlink — mirrors
// `@blog/db`'s own `TLinkableProvider` (email link has no `accounts` row to
// delete, so it's deliberately excluded here too). Kept as a local literal
// union rather than importing the db package's type through the `queries`
// namespace, matching this file tree's other action modules.
export type TLinkableProvider = 'github' | 'google';

export type TUnlinkProviderResult =
  { ok: true } | { ok: false; reason: 'last-method' | 'unknown' };

export type TUpdateDisplayNameResult = { ok: true } | { ok: false };

/**
 * unlinkProviderAction — the `/account` 6c "unlink" control's server write
 * (#1159/#1162), called from `ProviderLinkControl`. Reads the session itself
 * rather than trusting a caller-supplied `userId` — same defensive stance as
 * every other action in this file tree. `queries.account.unlinkProvider`
 * atomically rejects with `'last-method'` if `provider` is the reader's last
 * remaining linked sign-in method; that outcome is surfaced distinctly
 * (`reason: 'last-method'`) rather than folded into a generic failure, so
 * the client can show a specific error even in the unlikely event the UI's
 * own last-method guard (`IdentitySection`) raced a concurrent unlink from
 * another tab.
 */
export async function unlinkProviderAction(
  provider: TLinkableProvider,
): Promise<TUnlinkProviderResult> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { ok: false, reason: 'unknown' };

  try {
    const result = await queries.account.unlinkProvider(userId, provider);
    if (result.outcome === 'last-method') {
      return { ok: false, reason: 'last-method' };
    }
    return { ok: true };
  } catch (error) {
    console.error(`Failed to unlink ${provider}:`, sanitizeLogMessage(error));
    return { ok: false, reason: 'unknown' };
  }
}

/**
 * updateDisplayNameAction — the `/account` 6c "display name" row's server
 * write (#1159/#1162), called from `DisplayNameControl`. Reads the session
 * itself rather than trusting a caller-supplied `userId`.
 * `queries.account.updateDisplayName` performs no validation of its own (see
 * that query's own docs), so this trims `name` and rejects an empty result
 * before ever reaching the database.
 */
export async function updateDisplayNameAction(
  name: string,
): Promise<TUpdateDisplayNameResult> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { ok: false };

  const trimmedName = name.trim();
  if (trimmedName.length === 0) return { ok: false };

  try {
    await queries.account.updateDisplayName(userId, trimmedName);
    return { ok: true };
  } catch (error) {
    console.error('Failed to update display name:', sanitizeLogMessage(error));
    return { ok: false };
  }
}
