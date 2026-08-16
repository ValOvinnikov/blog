import { getDb } from '@blog/db/client';
import { tenants, type TTenant } from '@blog/db/schema/tenants';
import { eq } from 'drizzle-orm';

// Marks a tenant deprovisioned by stamping `deprovisionedAt` — the row is
// archived, never hard-deleted, so `slug`'s unique constraint keeps holding
// the name even after teardown.
export async function archiveTenant(tenantId: string): Promise<TTenant> {
  const db = getDb();

  const [tenant] = await db
    .update(tenants)
    .set({ deprovisionedAt: new Date() })
    .where(eq(tenants.id, tenantId))
    .returning();

  if (!tenant) {
    throw new Error(`archiveTenant: update for tenant "${tenantId}" returned no row.`);
  }

  return tenant;
}
