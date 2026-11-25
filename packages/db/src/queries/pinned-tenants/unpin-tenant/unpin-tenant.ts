import { getDb } from '@shinefold/db/client';
import { pinnedTenants } from '@shinefold/db/schema/pinned-tenants';
import { and, eq } from 'drizzle-orm';

export async function unpinTenant(
  adminId: string,
  tenantId: string,
): Promise<void> {
  await getDb()
    .delete(pinnedTenants)
    .where(
      and(
        eq(pinnedTenants.adminId, adminId),
        eq(pinnedTenants.tenantId, tenantId),
      ),
    );
}
