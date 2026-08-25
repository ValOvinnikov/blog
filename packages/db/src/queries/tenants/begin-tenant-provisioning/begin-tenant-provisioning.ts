import { ERROR_CODE, type TErrorCode } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import {
  TENANT_PROVISIONING_STATUS,
  type TTenantProvisioningStatus,
} from '@blog/db/constants';
import { tenants, type TTenant } from '@blog/db/schema/tenants';
import type { TResult } from '@blog/utils';
import { and, eq, isNull, ne, or } from 'drizzle-orm';

export type TBeginTenantProvisioningResult = {
  tenant: TTenant;
  previousProvisioningStatus: TTenantProvisioningStatus | null;
};

// Marks the sole persisted signal that a provisioning workflow has been
// dispatched but hasn't reported its first step yet — the operator UI has
// nothing else to show for that window otherwise. The `WHERE` guard (not a
// read-then-write) is what makes this safe against a second concurrent
// "Start" click: only one call can ever see its own row in the UPDATE's
// result, so only one can ever get `ok: true`. `ne` never matches a NULL
// column in SQL, so the NULL case (never provisioned) is guarded explicitly
// via `isNull`.
export async function beginTenantProvisioning(
  tenantId: string,
): Promise<TResult<TBeginTenantProvisioningResult, TErrorCode>> {
  const db = getDb();

  const [existing] = await db
    .select({ provisioningStatus: tenants.provisioningStatus })
    .from(tenants)
    .where(eq(tenants.id, tenantId));

  if (!existing) {
    return { ok: false, error: ERROR_CODE.DB_NOT_FOUND };
  }

  const [tenant] = await db
    .update(tenants)
    .set({ provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING })
    .where(
      and(
        eq(tenants.id, tenantId),
        or(
          isNull(tenants.provisioningStatus),
          ne(
            tenants.provisioningStatus,
            TENANT_PROVISIONING_STATUS.PROVISIONING,
          ),
        ),
      ),
    )
    .returning();

  if (!tenant) {
    return { ok: false, error: ERROR_CODE.DB_ALREADY_PROVISIONING };
  }

  return {
    ok: true,
    data: { tenant, previousProvisioningStatus: existing.provisioningStatus },
  };
}
