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

const LINKABLE_PROVIDERS: readonly TLinkableProvider[] = ['github', 'google'];

// `provider: TLinkableProvider` on `unlinkProviderAction` below is only a
// compile-time constraint — a `'use server'` action's underlying endpoint
// can be invoked directly (bypassing the client bundle and TypeScript
// entirely), so an attacker can pass an arbitrary string at runtime. Without
// this guard that string would flow straight into the `console.error` below
// (CodeQL flagged this as both a format-string and log-injection issue,
// since it's attacker-controlled) and into `queries.account.unlinkProvider`
// on the same unvalidated assumption. Re-validating here, before `provider`
// is used anywhere, means every downstream use — logged or passed to the db
// call — operates on a value that's actually one of the two known literals.
function isLinkableProvider(value: string): value is TLinkableProvider {
  return (LINKABLE_PROVIDERS as readonly string[]).includes(value);
}

export type TUnlinkProviderResult =
  { ok: true } | { ok: false; reason: 'last-method' | 'unknown' };

export type TUpdateDisplayNameResult = { ok: true } | { ok: false };

/**
 * `ProviderLinkControl`'s "unlink" server write. Reads the session itself
 * rather than trusting a caller-supplied `userId`.
 * `queries.account.unlinkProvider` atomically rejects with `'last-method'`
 * if `provider` is the reader's last remaining linked sign-in method; that
 * outcome is surfaced distinctly rather than folded into a generic failure,
 * so the client can show a specific error even if the UI's own last-method
 * guard raced a concurrent unlink from another tab.
 */
export async function unlinkProviderAction(
  provider: TLinkableProvider,
): Promise<TUnlinkProviderResult> {
  if (!isLinkableProvider(provider)) return { ok: false, reason: 'unknown' };

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
 * `DisplayNameControl`'s server write. Reads the session itself rather than
 * trusting a caller-supplied `userId`. `queries.account.updateDisplayName`
 * performs no validation of its own, so this trims `name` and rejects an
 * empty result before ever reaching the database.
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
