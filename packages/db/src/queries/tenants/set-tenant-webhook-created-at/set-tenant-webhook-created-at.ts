import { getDb } from '@blog/db/client';
import { tenants } from '@blog/db/schema/tenants';
import { eq } from 'drizzle-orm';

export async function setTenantWebhookCreatedAt(
  tenantId: string,
  webhookCreatedAt: Date,
): Promise<void> {
  const db = getDb();

  await db
    .update(tenants)
    .set({ webhookCreatedAt })
    .where(eq(tenants.id, tenantId));
}
