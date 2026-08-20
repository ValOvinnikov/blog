import { getDb } from '@blog/db/client';
import { tenants } from '@blog/db/schema/tenants';
import { eq } from 'drizzle-orm';

export type TDeleteTenantResult =
  | { outcome: 'deleted' }
  | { outcome: 'not-archived' }
  | { outcome: 'not-found' };

// Hard-deletes a tenant row — unlike `archiveTenant`, this is irreversible.
// Relies on cascading FKs on every tenant-scoped table (memberships,
// tenant_domains, subscribers, bookmarks, site_config) to sweep dependent
// rows, so a new tenant-scoped table needs its own cascading FK to stay
// swept. A non-archived tenant is refused here rather than left to whichever
// caller happens to check first, since this is the mutation's only
// irreversible step. A missing id is a typed outcome rather than a throw,
// same reasoning `archiveTenant` already applies to this table: a stale id
// or a second concurrent delete attempt is a reachable race, not a bug.
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
