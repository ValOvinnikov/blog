import { getDb } from '@blog/db/client';
import { emailConfig } from '@blog/db/schema/email-config';
import { eq } from 'drizzle-orm';

export async function clearNewsletterPause(tenantId: string): Promise<void> {
  await getDb()
    .update(emailConfig)
    .set({ newsletterPausedAt: null })
    .where(eq(emailConfig.tenantId, tenantId));
}
