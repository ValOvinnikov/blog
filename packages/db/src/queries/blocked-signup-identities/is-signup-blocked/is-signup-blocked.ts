import { ERROR_CODE, type TErrorCode } from '@shinefold/config/constants';
import { getDb } from '@shinefold/db/client';
import { BLOCKED_IDENTITY_KIND } from '@shinefold/db/constants';
import { blockedSignupIdentities } from '@shinefold/db/schema/blocked-signup-identities';
import { normalizeSignupEmail } from '@shinefold/db/utils/normalize-signup-identity/normalize-signup-identity';
import { requireEmailIndex } from '@shinefold/db/utils/personal-data/personal-data';
import { errorResult, okResult, type TResult } from '@shinefold/utils';
import { personalDataIndex } from '@shinefold/utils/encryption';
import { isUndefined } from '@shinefold/utils/primitives';
import { and, eq, or } from 'drizzle-orm';

export async function isSignupBlocked(
  email: string,
): Promise<TResult<boolean, TErrorCode>> {
  const normalized = normalizeSignupEmail(email);

  if (!normalized) return errorResult(ERROR_CODE.DB_INVALID_EMAIL);

  const db = getDb();
  const addressIndex = requireEmailIndex(normalized.address, personalDataIndex);

  const [match] = await db
    .select({ id: blockedSignupIdentities.id })
    .from(blockedSignupIdentities)
    .where(
      or(
        and(
          eq(blockedSignupIdentities.kind, BLOCKED_IDENTITY_KIND.ADDRESS),
          eq(blockedSignupIdentities.value, addressIndex),
        ),
        and(
          eq(blockedSignupIdentities.kind, BLOCKED_IDENTITY_KIND.DOMAIN),
          eq(blockedSignupIdentities.value, normalized.domain),
        ),
      ),
    )
    .limit(1);

  return okResult(!isUndefined(match));
}
