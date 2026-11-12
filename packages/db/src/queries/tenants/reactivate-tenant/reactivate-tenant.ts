import { ERROR_CODE, type TErrorCode } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import { TENANT_STATUS } from '@blog/db/constants';
import { isFreeOwnerViolation } from '@blog/db/queries/tenants/is-free-owner-violation';
import { resumedTenantFields } from '@blog/db/queries/tenants/resumed-tenant-fields';
import { tenants, type TTenant } from '@blog/db/schema/tenants';
import { errorResult, okResult, type TResult } from '@blog/utils';
import { eq, sql } from 'drizzle-orm';

// `deprovisionedAt` is only ever set on an archived row, so clearing it unconditionally leaves a suspended tenant as it was.
const isArchived = sql`${tenants.status} = ${TENANT_STATUS.ARCHIVED}`;

export async function reactivateTenant(
  tenantId: string,
): Promise<TResult<TTenant, TErrorCode>> {
  const db = getDb();

  try {
    const [tenant] = await db
      .update(tenants)
      .set({
        deprovisionedAt: null,
        deprovisioningSteps: sql`case when ${isArchived} then null else ${tenants.deprovisioningSteps} end`,
        ...resumedTenantFields(isArchived),
      })
      .where(eq(tenants.id, tenantId))
      .returning();

    if (!tenant) {
      return errorResult(ERROR_CODE.DB_NOT_FOUND);
    }

    return okResult(tenant);
  } catch (error) {
    if (isFreeOwnerViolation(error)) {
      return errorResult(ERROR_CODE.DB_ALREADY_OWNS_FREE_TENANT);
    }
    throw error;
  }
}
