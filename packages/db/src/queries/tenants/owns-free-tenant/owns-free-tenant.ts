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
import { requirePersonalEmailIndex } from '@blog/db/utils/personal-data/personal-data';
import type { TResult } from '@blog/utils';
import { and, eq, ne } from 'drizzle-orm';

// An archived tenant frees the slot; suspended and failed ones keep it.
export async function ownsFreeTenant(
  email: string,
): Promise<TResult<boolean, TErrorCode>> {
  const normalized = normalizeSignupEmail(email);
  if (!normalized) return { ok: false, error: ERROR_CODE.DB_INVALID_EMAIL };

  const [match] = await getDb()
    .select({ tenantId: tenants.id })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .innerJoin(tenants, eq(tenants.id, memberships.tenantId))
    .where(
      and(
        eq(users.emailIndex, requirePersonalEmailIndex(normalized.address)),
        eq(memberships.role, MEMBERSHIP_ROLE.OWNER),
        eq(tenants.plan, TENANT_PLAN.FREE),
        ne(tenants.status, TENANT_STATUS.ARCHIVED),
      ),
    )
    .limit(1);

  return { ok: true, data: match !== undefined };
}
