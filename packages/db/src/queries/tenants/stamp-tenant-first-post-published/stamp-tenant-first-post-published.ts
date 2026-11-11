import { getDb } from '@blog/db/client';
import { tenants } from '@blog/db/schema/tenants';
import { and, eq, isNull } from 'drizzle-orm';

export async function stampTenantFirstPostPublished(
  tenantId: string,
): Promise<void> {
  const db = getDb();

  await db
    .update(tenants)
    .set({ firstPostPublishedAt: new Date() })
    .where(and(eq(tenants.id, tenantId), isNull(tenants.firstPostPublishedAt)));
}
