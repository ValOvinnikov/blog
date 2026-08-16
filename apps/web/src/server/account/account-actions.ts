'use server';

import { queries } from '@blog/db';
import { sanitizeLogMessage } from '@blog/utils';
import { auth } from '@web/server/auth/auth';

export type TDeleteAccountResult = { ok: true } | { ok: false };

/**
 * `DeleteAccountControl`'s server write, called only after its typed-confirm
 * field already armed the danger button client-side. Reads the session
 * itself rather than trusting a caller-supplied `userId`, so this can never
 * be called to delete a different account than the one making the request.
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
