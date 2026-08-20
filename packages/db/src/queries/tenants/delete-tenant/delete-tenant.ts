import { getDb } from '@blog/db/client';
import { tenants } from '@blog/db/schema/tenants';
import { eq } from 'drizzle-orm';

export type TDeleteTenantResult =
  | { outcome: 'deleted' }
  | { outcome: 'not-archived' }
  | { outcome: 'not-found' };

// Hard-deletes a tenant row — unlike `archiveTenant`, this is irreversible and
// relies on cascading FKs on every tenant-scoped table to sweep dependent
// rows, so a new tenant-scoped table needs its own cascade to stay swept.
// Refusal and not-found are typed outcomes rather than throws, since a stale
// id or an unarchived tenant are reachable, non-exceptional callers.
export async function deleteTenant(
  tenantId: string,
): Promise<TDeleteTenantResult> {
  const db = getDb();

  const [existing] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, tenantId));

  if (!existing) {
    return { outcome: 'not-found' };
  }

  if (!existing.deprovisionedAt) {
    return { outcome: 'not-archived' };
  }

  await db.delete(tenants).where(eq(tenants.id, tenantId));

  return { outcome: 'deleted' };
}
