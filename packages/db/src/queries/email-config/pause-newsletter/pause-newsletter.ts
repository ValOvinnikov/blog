import { getDb } from '@blog/db/client';
import { emailConfig } from '@blog/db/schema/email-config';
import { sql } from 'drizzle-orm';

export async function pauseNewsletter(tenantId: string): Promise<Date> {
  const [row] = await getDb()
    .insert(emailConfig)
    .values({ tenantId, newsletterPausedAt: new Date() })
    .onConflictDoUpdate({
      target: emailConfig.tenantId,
      set: {
        newsletterPausedAt: sql`coalesce(${emailConfig.newsletterPausedAt}, excluded.newsletter_paused_at)`,
      },
    })
    .returning({ newsletterPausedAt: emailConfig.newsletterPausedAt });

  if (!row?.newsletterPausedAt) {
    throw new Error(
      `pauseNewsletter: upsert for tenant "${tenantId}" returned no pause.`,
    );
  }

  return row.newsletterPausedAt;
}
