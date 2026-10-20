import { ERROR_CODE, type TErrorCode } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import { TENANT_STATUS, type TSuspensionStatus } from '@blog/db/constants';
import { tenants, type TTenant } from '@blog/db/schema/tenants';
import type { TResult } from '@blog/utils';
import { and, eq, inArray, isNull } from 'drizzle-orm';

export async function setTenantSuspension(
  tenantId: string,
  status: TSuspensionStatus,
): Promise<TResult<TTenant, TErrorCode>> {
  const db = getDb();

  const [tenant] = await db
    .update(tenants)
    .set({ status })
    .where(
      and(
        eq(tenants.id, tenantId),
        inArray(tenants.status, [
          TENANT_STATUS.ACTIVE,
          TENANT_STATUS.SUSPENDED,
        ]),
        isNull(tenants.deprovisionedAt),
      ),
    )
    .returning();

  if (!tenant) {
    return { ok: false, error: ERROR_CODE.DB_NOT_FOUND };
  }

  return { ok: true, data: tenant };
}
