import { getDb } from '@blog/db/client';
import { tenants } from '@blog/db/schema/tenants';
import { eq } from 'drizzle-orm';

// Hard-deletes a tenant row — unlike `archiveTenant`, this is irreversible
// and releases `slug` for reuse. Relies on existing FK `onDelete: 'cascade'`
// on `subscribers`, `bookmarks`, `memberships`, `tenant_domains`, and
// `site_config` (each references `tenants.id`) to sweep every dependent
// row; re-check this list if a new tenant-scoped table is ever added
// without a cascading FK.
//
// Callers must confirm the tenant is already archived
// (`deprovisionedAt` set) before calling — this function performs no such
// check and deletes whatever tenant id it is given. A no-op (not an error)
// if `tenantId` doesn't match a row, matching this package's other
// delete-style mutations (see `deleteAccount`).
export async function deleteTenant(tenantId: string): Promise<void> {
  const db = getDb();

  await db.delete(tenants).where(eq(tenants.id, tenantId));
}
