import { getDb } from '@shinefold/db/client';
import { tenantAnalytics } from '@shinefold/db/schema/tenant-analytics';
import { hasLength } from '@shinefold/utils/primitives';
import { eq } from 'drizzle-orm';

export async function clearTenantAnalytics(tenantId: string): Promise<boolean> {
  const rows = await getDb()
    .delete(tenantAnalytics)
    .where(eq(tenantAnalytics.tenantId, tenantId))
    .returning({ tenantId: tenantAnalytics.tenantId });

  return hasLength(rows);
}
