import { getDb } from '@blog/db/client';
import { tenantAnalytics } from '@blog/db/schema/tenant-analytics';
import { hasLength } from '@blog/utils/primitives';
import { eq } from 'drizzle-orm';

export async function clearTenantAnalytics(tenantId: string): Promise<boolean> {
  const rows = await getDb()
    .delete(tenantAnalytics)
    .where(eq(tenantAnalytics.tenantId, tenantId))
    .returning({ tenantId: tenantAnalytics.tenantId });

  return hasLength(rows);
}
