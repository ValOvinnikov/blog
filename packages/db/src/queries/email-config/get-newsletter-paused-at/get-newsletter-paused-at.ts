import type { TMaybeUndefined } from '@blog/config/types';
import { getDb } from '@blog/db/client';
import { emailConfig } from '@blog/db/schema/email-config';
import { eq } from 'drizzle-orm';

export async function getNewsletterPausedAt(
  tenantId: string,
): Promise<TMaybeUndefined<Date>> {
  const [row] = await getDb()
    .select({ newsletterPausedAt: emailConfig.newsletterPausedAt })
    .from(emailConfig)
    .where(eq(emailConfig.tenantId, tenantId));

  return row?.newsletterPausedAt ?? undefined;
}
