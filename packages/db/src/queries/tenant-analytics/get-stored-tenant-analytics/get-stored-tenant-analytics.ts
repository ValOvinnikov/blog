import type { TMaybeUndefined } from '@shinefold/config/types';
import { getDb } from '@shinefold/db/client';
import type { TTenantAnalytics } from '@shinefold/db/queries/tenant-analytics/save-tenant-analytics';
import { tenantAnalytics } from '@shinefold/db/schema/tenant-analytics';
import { eq } from 'drizzle-orm';

/** What the tenant saved, whatever its plan; the site reads `getTenantAnalytics` instead. */
export async function getStoredTenantAnalytics(
  tenantId: string,
): Promise<TMaybeUndefined<TTenantAnalytics>> {
  const [row] = await getDb()
    .select({
      provider: tenantAnalytics.provider,
      analyticsId: tenantAnalytics.analyticsId,
    })
    .from(tenantAnalytics)
    .where(eq(tenantAnalytics.tenantId, tenantId));

  return row;
}
