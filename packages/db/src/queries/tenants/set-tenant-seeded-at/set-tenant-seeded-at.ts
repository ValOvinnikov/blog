import { getDb } from '@blog/db/client';
import { tenants } from '@blog/db/schema/tenants';
import { eq } from 'drizzle-orm';

export async function setTenantSeededAt(
  tenantId: string,
  seededAt: Date,
): Promise<void> {
  const db = getDb();

  await db.update(tenants).set({ seededAt }).where(eq(tenants.id, tenantId));
}
