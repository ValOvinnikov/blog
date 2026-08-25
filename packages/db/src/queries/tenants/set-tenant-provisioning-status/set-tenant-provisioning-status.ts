import { ERROR_CODE, type TErrorCode } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import type { TTenantProvisioningStatus } from '@blog/db/constants';
import { tenants, type TTenant } from '@blog/db/schema/tenants';
import type { TResult } from '@blog/utils';
import { eq } from 'drizzle-orm';

// Unconditional overwrite — no guard, unlike `beginTenantProvisioning`.
// Used to revert a tenant that `beginTenantProvisioning` just moved to
// PROVISIONING back to its prior status (e.g.
// `previousProvisioningStatus` from that call) when the workflow dispatch
// that was supposed to follow never actually happened, so the row never
// gets stuck showing "provisioning" for a workflow that isn't running.
export async function setTenantProvisioningStatus(
  tenantId: string,
  status: TTenantProvisioningStatus | null,
): Promise<TResult<TTenant, TErrorCode>> {
  const db = getDb();

  const [tenant] = await db
    .update(tenants)
    .set({ provisioningStatus: status })
    .where(eq(tenants.id, tenantId))
    .returning();

  if (!tenant) {
    return { ok: false, error: ERROR_CODE.DB_NOT_FOUND };
  }

  return { ok: true, data: tenant };
}
