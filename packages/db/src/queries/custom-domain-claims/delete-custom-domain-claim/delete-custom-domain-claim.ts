import { type TTenantPlan } from '@shinefold/config/constants';
import { getDb } from '@shinefold/db/client';
import { isTenantOnPlan } from '@shinefold/db/queries/tenants/tenant-on-plan';
import { customDomainClaims } from '@shinefold/db/schema/custom-domain-claims';
import { hasLength } from '@shinefold/utils/primitives';
import { and, eq } from 'drizzle-orm';

export async function deleteCustomDomainClaim(
  tenantId: string,
  onlyWhilePlan?: TTenantPlan,
): Promise<boolean> {
  const deleted = await getDb()
    .delete(customDomainClaims)
    .where(
      and(
        eq(customDomainClaims.tenantId, tenantId),
        onlyWhilePlan && isTenantOnPlan(tenantId, onlyWhilePlan),
      ),
    )
    .returning({ id: customDomainClaims.id });

  return hasLength(deleted);
}
