import type { TMaybeUndefined } from '@shinefold/config';
import { getDb } from '@shinefold/db/client';
import {
  tenantEntitlementGrants,
  type TTenantEntitlementGrant,
} from '@shinefold/db/schema/tenant-entitlement-grants';
import { and, eq, isNull } from 'drizzle-orm';

export async function revokeEntitlementGrant(
  tenantId: string,
  grantId: string,
  revokedBy: string,
): Promise<TMaybeUndefined<TTenantEntitlementGrant>> {
  const [grant] = await getDb()
    .update(tenantEntitlementGrants)
    .set({ revokedAt: new Date(), revokedBy })
    .where(
      and(
        eq(tenantEntitlementGrants.id, grantId),
        eq(tenantEntitlementGrants.tenantId, tenantId),
        isNull(tenantEntitlementGrants.revokedAt),
      ),
    )
    .returning();

  return grant;
}
