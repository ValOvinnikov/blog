import { ERROR_CODE, type TErrorCode } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import { TENANT_STATUS } from '@blog/db/constants';
import { isFreeOwnerViolation } from '@blog/db/queries/tenants/is-free-owner-violation';
import { resumedTenantFields } from '@blog/db/queries/tenants/resumed-tenant-fields';
import { tenants, type TTenant } from '@blog/db/schema/tenants';
import { errorResult, okResult, type TResult } from '@blog/utils';
import { eq, type SQL, sql } from 'drizzle-orm';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';

const isArchived = sql`${tenants.status} = ${TENANT_STATUS.ARCHIVED}`;

function whenArchived(column: AnyPgColumn, value: SQL = sql`null`): SQL {
  return sql`case when ${isArchived} then ${value} else ${column} end`;
}

function reactivatedFields(now: Date) {
  return {
    deprovisionedAt: whenArchived(tenants.deprovisionedAt),
    deprovisioningSteps: whenArchived(tenants.deprovisioningSteps),
    lastActivityAt: whenArchived(
      tenants.lastActivityAt,
      sql`${sql.param(now, tenants.lastActivityAt)}::timestamp`,
    ),
    inactivityWarnedAt: whenArchived(tenants.inactivityWarnedAt),
    deletionNotifiedAt: whenArchived(tenants.deletionNotifiedAt),
    suspendedAt: whenArchived(tenants.suspendedAt),
    suspensionReason: whenArchived(tenants.suspensionReason),
    ...resumedTenantFields({ isResuming: isArchived, now }),
  };
}

export async function reactivateTenant(
  tenantId: string,
): Promise<TResult<TTenant, TErrorCode>> {
  const db = getDb();

  try {
    const [tenant] = await db
      .update(tenants)
      .set(reactivatedFields(new Date()))
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
