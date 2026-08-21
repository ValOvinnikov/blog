'use server';

import { queries } from '@blog/db';
import { auth } from '@web/server/auth/auth';
import { logger } from '@web/utils/logger/logger';

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
// entirely), so an attacker can pass an arbitrary string at runtime.
// Re-validating here, before `provider` is used anywhere, means every
// downstream use — logged or passed to the db call — operates on a value
// that's actually one of the two known literals.
const isLinkableProvider = (value: string): value is TLinkableProvider => {
  return (LINKABLE_PROVIDERS as readonly string[]).includes(value);
};

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
export const unlinkProviderAction = async (
  provider: TLinkableProvider,
): Promise<TUnlinkProviderResult> => {
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
    logger.error('account.provider_unlink_failed', { provider, error });
    return { ok: false, reason: 'unknown' };
  }
};

/**
 * `DisplayNameControl`'s server write. Reads the session itself rather than
 * trusting a caller-supplied `userId`. `queries.account.updateDisplayName`
 * performs no validation of its own, so this trims `name` and rejects an
 * empty result before ever reaching the database.
 */
export const updateDisplayNameAction = async (
  name: string,
): Promise<TUpdateDisplayNameResult> => {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { ok: false };

  const trimmedName = name.trim();
  if (trimmedName.length === 0) return { ok: false };

  try {
    await queries.account.updateDisplayName(userId, trimmedName);
    return { ok: true };
  } catch (error) {
    logger.error('account.display_name_update_failed', { error });
    return { ok: false };
  }
};
