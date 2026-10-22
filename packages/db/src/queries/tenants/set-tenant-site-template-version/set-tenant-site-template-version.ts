import { getDb } from '@blog/db/client';
import { tenants } from '@blog/db/schema/tenants';
import { eq } from 'drizzle-orm';

export async function setTenantSiteTemplateVersion(
  tenantId: string,
  siteTemplateVersion: number,
): Promise<void> {
  await getDb()
    .update(tenants)
    .set({ siteTemplateVersion })
    .where(eq(tenants.id, tenantId));
}
