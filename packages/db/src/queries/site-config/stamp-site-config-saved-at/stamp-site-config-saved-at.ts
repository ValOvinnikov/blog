import { getDb } from '@blog/db/client';
import type { TSiteConfigSavedAt } from '@blog/db/constants';
import { siteConfig } from '@blog/db/schema/site-config';
import { eq } from 'drizzle-orm';

export async function stampSiteConfigSavedAt(
  tenantId: string,
  column: TSiteConfigSavedAt,
): Promise<void> {
  const db = getDb();

  await db
    .update(siteConfig)
    .set({ [column]: new Date() })
    .where(eq(siteConfig.tenantId, tenantId));
}
