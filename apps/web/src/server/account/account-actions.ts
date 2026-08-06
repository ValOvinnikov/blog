'use server';

import { queries } from '@blog/db';
import { auth } from '@web/server/auth/auth';
import { sanitizeLogMessage } from '@web/utils/sanitize-log-message';

export type TDeleteAccountResult = { ok: true } | { ok: false };

/**
 * deleteAccountAction — the `/account` "delete account" row's server write
 * (#1151/#1154, D15 §4.6/6a), called only after `DeleteAccountControl`'s
 * typed-confirm field already armed the danger button client-side. Reads
 * the session itself rather than trusting a caller-supplied `userId` — the
 * same defensive stance `bookmark-actions.ts` takes — so this can never be
 * called to delete a different account than the one making the request.
 * `queries.account.deleteAccount` cascades to `accounts`/`sessions`/
 * `bookmarks` via existing FKs; no further per-table cleanup needed for
 * what exists today (comments/ratings/newsletter each add their own
 * pre-delete step once they land — see that query's own docs).
 */
export async function deleteAccountAction(): Promise<TDeleteAccountResult> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { ok: false };

  try {
    await queries.account.deleteAccount(userId);
    return { ok: true };
  } catch (error) {
    console.error('Failed to delete account:', sanitizeLogMessage(error));
    return { ok: false };
  }
}
