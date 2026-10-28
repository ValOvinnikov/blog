import { ERROR_CODE, type TErrorCode } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import { tenantDomains } from '@blog/db/schema/tenant-domains';
import { tenants, type TTenant } from '@blog/db/schema/tenants';
import { errorResult, okResult, type TResult } from '@blog/utils';
import { and, eq, exists } from 'drizzle-orm';

export async function setTenantPrimaryDomain(
  tenantId: string,
  domain: string,
): Promise<TResult<TTenant, TErrorCode>> {
  const db = getDb();

  const [tenant] = await db
    .update(tenants)
    .set({ primaryDomain: domain })
    .where(
      and(
        eq(tenants.id, tenantId),
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
