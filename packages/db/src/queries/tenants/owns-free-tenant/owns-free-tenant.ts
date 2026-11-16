import {
  ERROR_CODE,
  type TErrorCode,
  TENANT_PLAN,
} from '@shinefold/config/constants';
import { getDb } from '@shinefold/db/client';
import { MEMBERSHIP_ROLE, TENANT_STATUS } from '@shinefold/db/constants';
import { users } from '@shinefold/db/schema/auth';
import { memberships } from '@shinefold/db/schema/memberships';
import { tenants } from '@shinefold/db/schema/tenants';
import { normalizeSignupEmail } from '@shinefold/db/utils/normalize-signup-identity/normalize-signup-identity';
import { requireEmailIndex } from '@shinefold/db/utils/personal-data/personal-data';
import { errorResult, okResult, type TResult } from '@shinefold/utils';
import {
  accountEmailIndex,
  personalDataIndex,
} from '@shinefold/utils/encryption';
import { isUndefined } from '@shinefold/utils/primitives';
import { and, eq, exists, ne, or } from 'drizzle-orm';

export async function ownsFreeTenant(
  email: string,
): Promise<TResult<boolean, TErrorCode>> {
  const normalized = normalizeSignupEmail(email);
  if (!normalized) return errorResult(ERROR_CODE.DB_INVALID_EMAIL);

  const { address } = normalized;
  const db = getDb();

  const ownedByAccount = db
    .select({ tenantId: memberships.tenantId })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .where(
      and(
        eq(memberships.tenantId, tenants.id),
        eq(memberships.role, MEMBERSHIP_ROLE.OWNER),
        eq(users.emailIndex, requireEmailIndex(address, accountEmailIndex)),
      ),
    );

  const [match] = await db
    .select({ tenantId: tenants.id })
    .from(tenants)
    .where(
      and(
        ne(tenants.status, TENANT_STATUS.ARCHIVED),
        or(
          eq(
            tenants.selfServeOwnerEmailIndex,
            requireEmailIndex(address, personalDataIndex),
          ),
          and(eq(tenants.plan, TENANT_PLAN.FREE), exists(ownedByAccount)),
        ),
      ),
    )
    .limit(1);

  return okResult(!isUndefined(match));
}
