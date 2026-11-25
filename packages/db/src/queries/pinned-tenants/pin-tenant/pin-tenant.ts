import { getDb } from '@shinefold/db/client';
import { pinnedTenants } from '@shinefold/db/schema/pinned-tenants';

export async function pinTenant(
  adminId: string,
  tenantId: string,
): Promise<void> {
  await getDb()
    .insert(pinnedTenants)
    .values({ adminId, tenantId })
    .onConflictDoNothing();
}
