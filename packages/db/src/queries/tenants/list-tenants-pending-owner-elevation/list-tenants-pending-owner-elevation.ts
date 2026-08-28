import { getDb } from '@blog/db/client';
import { TENANT_PROVISIONING_STATUS, TENANT_STATUS } from '@blog/db/constants';
import { tenants, type TTenant } from '@blog/db/schema/tenants';
import { and, eq } from 'drizzle-orm';

/**
 * Coarse pre-filter for the owner-elevation sweep: tenants whose core
 * provisioning has finished (so `sanityProjectId` is set) and which are
 * still active. Does not check owner-role state itself — that only exists
 * as live Sanity ACL data, which the caller resolves per candidate via
 * `elevateTenantOwner`.
 */
export async function listTenantsPendingOwnerElevation(): Promise<TTenant[]> {
  const db = getDb();

  return db
    .select()
    .from(tenants)
    .where(
      and(
        eq(tenants.status, TENANT_STATUS.ACTIVE),
        eq(tenants.provisioningStatus, TENANT_PROVISIONING_STATUS.READY),
      ),
    );
}
