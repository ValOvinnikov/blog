import { ERROR_CODE, type TErrorCode } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import { blockedSignupIdentities } from '@blog/db/schema/blocked-signup-identities';
import type { TResult } from '@blog/utils';
import { eq } from 'drizzle-orm';

export async function removeBlockedIdentity(
  id: string,
): Promise<TResult<void, TErrorCode>> {
  const db = getDb();

  const deleted = await db
    .delete(blockedSignupIdentities)
    .where(eq(blockedSignupIdentities.id, id))
    .returning({ id: blockedSignupIdentities.id });

  if (deleted.length === 0) {
    return { ok: false, error: ERROR_CODE.DB_NOT_FOUND };
  }

  return { ok: true, data: undefined };
}
