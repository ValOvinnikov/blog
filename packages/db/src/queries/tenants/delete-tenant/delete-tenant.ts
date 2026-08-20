import { getDb } from '@blog/db/client';
import { tenants } from '@blog/db/schema/tenants';
import { eq } from 'drizzle-orm';

// Hard-deletes a tenant row — unlike `archiveTenant`, this is irreversible.
// Relies on cascading FKs on every tenant-scoped table to sweep dependent
// rows, so a new one needs its own cascading FK. Callers own the
// "already archived" precondition — this function performs no such check.
export async function deleteTenant(tenantId: string): Promise<void> {
  const db = getDb();

  await db.delete(tenants).where(eq(tenants.id, tenantId));
}
