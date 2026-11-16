import {
  ERROR_CODE,
  type TErrorCode,
  type TTenantPlan,
} from '@shinefold/config/constants';
import { getDb } from '@shinefold/db/client';
import { tenantDomains } from '@shinefold/db/schema/tenant-domains';
import { tenants, type TTenant } from '@shinefold/db/schema/tenants';
import { errorResult, okResult, type TResult } from '@shinefold/utils';
import { and, eq, exists } from 'drizzle-orm';

export async function setTenantPrimaryDomain(
  tenantId: string,
  domain: string,
  onlyWhilePlan?: TTenantPlan,
): Promise<TResult<TTenant, TErrorCode>> {
  const db = getDb();

  const [tenant] = await db
    .update(tenants)
    .set({ primaryDomain: domain })
    .where(
      and(
        eq(tenants.id, tenantId),
        onlyWhilePlan && eq(tenants.plan, onlyWhilePlan),
        exists(
          db
            .select({ domain: tenantDomains.domain })
            .from(tenantDomains)
            .where(
              and(
                eq(tenantDomains.tenantId, tenantId),
                eq(tenantDomains.domain, domain),
              ),
            ),
        ),
      ),
    )
    .returning();

  if (!tenant) {
    return errorResult(ERROR_CODE.DB_NOT_FOUND);
  }

  return okResult(tenant);
}
