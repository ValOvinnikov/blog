import { getDb } from '@blog/db/client';
import {
  WRITABLE_TENANT_STATUSES,
  TENANT_PROVISIONING_STATUS,
} from '@blog/db/constants';
import { tenants, type TTenant } from '@blog/db/schema/tenants';
import { and, eq, inArray } from 'drizzle-orm';

// A coarse pre-filter: owner-role state lives only in Sanity's ACL, so the caller checks each candidate.
export async function listTenantsPendingOwnerElevation(): Promise<TTenant[]> {
  const db = getDb();

  return db
    .select()
    .from(tenants)
    .where(
      and(
        inArray(tenants.status, WRITABLE_TENANT_STATUSES),
        eq(tenants.provisioningStatus, TENANT_PROVISIONING_STATUS.READY),
      ),
    );
}
