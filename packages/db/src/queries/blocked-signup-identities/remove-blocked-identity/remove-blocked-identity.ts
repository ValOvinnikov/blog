import { ERROR_CODE, type TErrorCode } from '@shinefold/config/constants';
import { getDb } from '@shinefold/db/client';
import { blockedSignupIdentities } from '@shinefold/db/schema/blocked-signup-identities';
import { errorResult, okResult, type TResult } from '@shinefold/utils';
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
    return errorResult(ERROR_CODE.DB_NOT_FOUND);
  }

  return okResult();
}
