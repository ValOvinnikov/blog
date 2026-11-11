import { getDb } from '@blog/db/client';
import { siteConfig } from '@blog/db/schema/site-config';
import { eq } from 'drizzle-orm';

export async function stampSiteConfigLookSaved(
  tenantId: string,
): Promise<void> {
  const db = getDb();

  await db
    .update(siteConfig)
    .set({ lookSavedAt: new Date() })
    .where(eq(siteConfig.tenantId, tenantId));
}
