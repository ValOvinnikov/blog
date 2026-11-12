import type { TMaybeUndefined } from '@blog/config/types';
import { getDb } from '@blog/db/client';
import { emailConfig } from '@blog/db/schema/email-config';
import { and, eq, isNotNull } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

const before = alias(emailConfig, 'before');

// RETURNING reads the updated row, so the cleared time comes from a self-join.
export async function clearNewsletterPause(
  tenantId: string,
): Promise<TMaybeUndefined<Date>> {
  const [row] = await getDb()
    .update(emailConfig)
    .set({ newsletterPausedAt: null })
    .from(before)
    .where(
      and(
        eq(emailConfig.tenantId, tenantId),
        isNotNull(emailConfig.newsletterPausedAt),
        eq(before.id, emailConfig.id),
      ),
    )
    .returning({ clearedPausedAt: before.newsletterPausedAt });

  return row?.clearedPausedAt ?? undefined;
}
