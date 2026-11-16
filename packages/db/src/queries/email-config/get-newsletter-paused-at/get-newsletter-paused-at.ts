import type { TMaybeUndefined } from '@shinefold/config/types';
import { getDb } from '@shinefold/db/client';
import { emailConfig } from '@shinefold/db/schema/email-config';
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
