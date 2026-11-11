import { getDb } from '@blog/db/client';
import type { TSiteConfigSavedAt } from '@blog/db/constants';
import { siteConfig, type TSiteConfig } from '@blog/db/schema/site-config';
import { eq } from 'drizzle-orm';

const SAVED_AT_COLUMN = {
  LOOK: 'lookSavedAt',
  VOICE: 'voiceSavedAt',
} as const satisfies Record<TSiteConfigSavedAt, keyof TSiteConfig>;

export async function stampSiteConfigSavedAt(
  tenantId: string,
  savedAt: TSiteConfigSavedAt,
): Promise<void> {
  const db = getDb();

  await db
    .update(siteConfig)
    .set({ [SAVED_AT_COLUMN[savedAt]]: new Date() })
    .where(eq(siteConfig.tenantId, tenantId));
}
