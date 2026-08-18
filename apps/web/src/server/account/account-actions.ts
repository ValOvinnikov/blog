'use server';

import { queries } from '@blog/db';
import { auth } from '@web/server/auth/auth';
import { logger } from '@web/utils/logger/logger';

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
    logger.error('account.delete_failed', { error });
    return { ok: false };
  }
}
