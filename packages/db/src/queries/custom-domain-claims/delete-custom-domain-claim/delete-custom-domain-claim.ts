import { type TTenantPlan } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import { isTenantOnPlan } from '@blog/db/queries/tenants/tenant-on-plan';
import { customDomainClaims } from '@blog/db/schema/custom-domain-claims';
import { hasLength } from '@blog/utils/primitives';
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
