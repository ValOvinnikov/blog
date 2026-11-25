import { getDb } from '@shinefold/db/client';
import { pinnedTenants } from '@shinefold/db/schema/pinned-tenants';
import { isUuid } from '@shinefold/db/utils/is-uuid/is-uuid';
import { and, eq } from 'drizzle-orm';

export async function unpinTenant(
  adminId: string,
  tenantId: string,
): Promise<void> {
  if (!isUuid(adminId) || !isUuid(tenantId)) return;

  await getDb()
    .delete(pinnedTenants)
    .where(
      and(
        eq(pinnedTenants.adminId, adminId),
        eq(pinnedTenants.tenantId, tenantId),
      ),
    );
}
