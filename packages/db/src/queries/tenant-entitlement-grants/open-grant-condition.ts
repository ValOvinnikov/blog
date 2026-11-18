import type { TMaybeUndefined } from '@shinefold/config/types';
import { tenantEntitlementGrants } from '@shinefold/db/schema/tenant-entitlement-grants';
import { and, eq, gt, isNull, or, type SQL } from 'drizzle-orm';

export function isOpenGrantOf(tenantId: string): TMaybeUndefined<SQL> {
  return and(
    eq(tenantEntitlementGrants.tenantId, tenantId),
    isNull(tenantEntitlementGrants.revokedAt),
    or(
      isNull(tenantEntitlementGrants.expiresAt),
      gt(tenantEntitlementGrants.expiresAt, new Date()),
    ),
  );
}
