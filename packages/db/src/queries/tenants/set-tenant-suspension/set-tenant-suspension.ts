import { ERROR_CODE, type TErrorCode } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import {
  SUSPENSION_REASON,
  TENANT_STATUS,
  type TSuspensionStatus,
} from '@blog/db/constants';
import { tenants, type TTenant } from '@blog/db/schema/tenants';
import { errorResult, okResult, type TResult } from '@blog/utils';
import { and, eq, inArray, isNull } from 'drizzle-orm';

const suspensionStamp: Record<TSuspensionStatus, Partial<TTenant>> = {
  [TENANT_STATUS.SUSPENDED]: {
    status: TENANT_STATUS.SUSPENDED,
    suspensionReason: SUSPENSION_REASON.OPERATOR,
  },
  [TENANT_STATUS.ACTIVE]: {
    status: TENANT_STATUS.ACTIVE,
    suspendedAt: null,
    suspensionReason: null,
  },
};

export async function setTenantSuspension(
  tenantId: string,
  status: TSuspensionStatus,
): Promise<TResult<TTenant, TErrorCode>> {
  const db = getDb();

  const [tenant] = await db
    .update(tenants)
    .set(suspensionStamp[status])
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
    return errorResult(ERROR_CODE.DB_NOT_FOUND);
  }

  return okResult(tenant);
}
