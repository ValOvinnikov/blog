import { ERROR_CODE, type TErrorCode } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import {
  SUSPENSION_REASON,
  TENANT_STATUS,
  WRITABLE_TENANT_STATUSES,
  type TSuspensionStatus,
} from '@blog/db/constants';
import { heldStatusFields } from '@blog/db/queries/tenants/held-status-fields';
import { resumedTenantFields } from '@blog/db/queries/tenants/resumed-tenant-fields';
import { tenants, type TTenant } from '@blog/db/schema/tenants';
import { errorResult, okResult, type TResult } from '@blog/utils';
import { and, eq, inArray, isNull } from 'drizzle-orm';

const isSuspended = eq(tenants.status, TENANT_STATUS.SUSPENDED);

const SUSPENSION_WRITE = {
  [TENANT_STATUS.SUSPENDED]: {
    fields: () => ({
      ...heldStatusFields(),
      status: TENANT_STATUS.SUSPENDED,
      suspensionReason: SUSPENSION_REASON.OPERATOR,
    }),
    from: inArray(tenants.status, [
      ...WRITABLE_TENANT_STATUSES,
      TENANT_STATUS.SUSPENDED,
    ]),
  },
  [TENANT_STATUS.ACTIVE]: {
    fields: () => ({
      ...resumedTenantFields({ isResuming: isSuspended }),
      suspendedAt: null,
      suspensionReason: null,
    }),
    from: isSuspended,
  },
} satisfies Record<TSuspensionStatus, unknown>;

export async function setTenantSuspension(
  tenantId: string,
  status: TSuspensionStatus,
): Promise<TResult<TTenant, TErrorCode>> {
  const { fields, from } = SUSPENSION_WRITE[status];
  const [tenant] = await getDb()
    .update(tenants)
    .set(fields())
    .where(and(eq(tenants.id, tenantId), from, isNull(tenants.deprovisionedAt)))
    .returning();

  if (!tenant) {
    return errorResult(ERROR_CODE.DB_NOT_FOUND);
  }

  return okResult(tenant);
}
