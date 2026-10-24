import { ERROR_CODE, type TErrorCode } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import {
  MEMBERSHIP_ROLE,
  TENANT_PLAN,
  TENANT_STATUS,
} from '@blog/db/constants';
import { users } from '@blog/db/schema/auth';
import { memberships } from '@blog/db/schema/memberships';
import { tenants } from '@blog/db/schema/tenants';
import { normalizeSignupEmail } from '@blog/db/utils/normalize-signup-identity/normalize-signup-identity';
import { requireEmailIndex } from '@blog/db/utils/personal-data/personal-data';
import { errorResult, okResult, type TResult } from '@blog/utils';
import { accountEmailIndex, personalDataIndex } from '@blog/utils/encryption';
import { and, eq, exists, ne, or } from 'drizzle-orm';

// An archived tenant frees the slot; suspended and failed ones keep it.
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
        eq(tenants.plan, TENANT_PLAN.FREE),
        ne(tenants.status, TENANT_STATUS.ARCHIVED),
        or(
          eq(
            tenants.selfServeOwnerEmailIndex,
            requireEmailIndex(address, personalDataIndex),
          ),
          exists(ownedByAccount),
        ),
      ),
    )
    .limit(1);

  return okResult(match !== undefined);
}
