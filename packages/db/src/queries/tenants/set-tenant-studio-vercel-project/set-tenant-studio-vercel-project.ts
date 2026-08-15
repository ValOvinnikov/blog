import { getDb } from '@blog/db/client';
import { tenants } from '@blog/db/schema/tenants';
import { eq } from 'drizzle-orm';

export async function setTenantStudioVercelProject(
  tenantId: string,
  studioVercelProjectId: string,
): Promise<void> {
  const db = getDb();

  await db
    .update(tenants)
    .set({ studioVercelProjectId })
    .where(eq(tenants.id, tenantId));
}
