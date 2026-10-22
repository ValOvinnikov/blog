import { ERROR_CODE, type TErrorCode } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import { BLOCKED_IDENTITY_KIND } from '@blog/db/constants';
import { blockedSignupIdentities } from '@blog/db/schema/blocked-signup-identities';
import { normalizeSignupEmail } from '@blog/db/utils/normalize-signup-identity/normalize-signup-identity';
import { requirePersonalEmailIndex } from '@blog/db/utils/personal-data/personal-data';
import type { TResult } from '@blog/utils';
import { and, eq, or } from 'drizzle-orm';

export async function isSignupBlocked(
  email: string,
): Promise<TResult<boolean, TErrorCode>> {
  const normalized = normalizeSignupEmail(email);

  if (!normalized) return { ok: false, error: ERROR_CODE.DB_INVALID_EMAIL };

  const db = getDb();
  const addressIndex = requirePersonalEmailIndex(normalized.address);

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

  return { ok: true, data: match !== undefined };
}
