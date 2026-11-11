import type { TMaybeUndefined } from '@blog/config/types';
import { getDb } from '@blog/db/client';
import { PLAN_ENTITLEMENTS } from '@blog/db/constants';
import type { TTenantAnalytics } from '@blog/db/queries/tenant-analytics/save-tenant-analytics';
import { tenantAnalytics } from '@blog/db/schema/tenant-analytics';
import { tenants } from '@blog/db/schema/tenants';
import { eq } from 'drizzle-orm';

/** The analytics tool a site loads: nothing when the tenant's plan excludes it, whatever is stored. */
export async function getTenantAnalytics(
  tenantId: string,
): Promise<TMaybeUndefined<TTenantAnalytics>> {
  const [row] = await getDb()
    .select({
      plan: tenants.plan,
      provider: tenantAnalytics.provider,
      analyticsId: tenantAnalytics.analyticsId,
    })
    .from(tenantAnalytics)
    .innerJoin(tenants, eq(tenants.id, tenantAnalytics.tenantId))
    .where(eq(tenantAnalytics.tenantId, tenantId));

  if (!row || !PLAN_ENTITLEMENTS[row.plan].hasOwnAnalytics) return undefined;

  const { provider, analyticsId } = row;

  return { provider, analyticsId };
}
