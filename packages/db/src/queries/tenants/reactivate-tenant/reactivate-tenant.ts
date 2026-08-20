import { ERROR_CODE, type TErrorCode } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import { TENANT_STATUS } from '@blog/db/constants';
import { tenants, type TTenant } from '@blog/db/schema/tenants';
import type { TResult } from '@blog/utils';
import { eq, sql } from 'drizzle-orm';

// Reverses `archiveTenant`, but `status` only moves out of ARCHIVED — a
// SUSPENDED tenant must stay SUSPENDED, so the reset is confined to a CASE
// inside the same UPDATE. `deprovisionedAt` is unconditional: it is only
// ever non-null on an archived row, so clearing it is a no-op elsewhere.
export async function reactivateTenant(
  tenantId: string,
): Promise<TResult<TTenant, TErrorCode>> {
  const db = getDb();

  const [tenant] = await db
    .update(tenants)
    .set({
      deprovisionedAt: null,
      status: sql`case when ${tenants.status} = ${TENANT_STATUS.ARCHIVED} then ${TENANT_STATUS.ACTIVE} else ${tenants.status} end`,
    })
    .where(eq(tenants.id, tenantId))
    .returning();

  if (!tenant) {
    return { ok: false, error: ERROR_CODE.DB_NOT_FOUND };
  }

  return { ok: true, data: tenant };
}
