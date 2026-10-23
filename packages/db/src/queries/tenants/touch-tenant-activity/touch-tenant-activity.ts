import { ERROR_CODE, type TErrorCode } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import { TENANT_STATUS } from '@blog/db/constants';
import { tenants, type TTenant } from '@blog/db/schema/tenants';
import { errorResult, okResult, type TResult } from '@blog/utils';
import { and, eq, isNull, ne, sql } from 'drizzle-orm';

export async function touchTenantActivity(
  tenantId: string,
  at: Date,
): Promise<TResult<TTenant, TErrorCode>> {
  const [tenant] = await getDb()
    .update(tenants)
    .set({
      lastActivityAt: sql`greatest(${tenants.lastActivityAt}, ${at.toISOString()}::timestamp)`,
      inactivityWarnedAt: null,
      deletionNotifiedAt: null,
    })
    .where(
      and(
        eq(tenants.id, tenantId),
        ne(tenants.status, TENANT_STATUS.ARCHIVED),
        isNull(tenants.deprovisionedAt),
      ),
    )
    .returning();

  if (!tenant) {
    return errorResult(ERROR_CODE.DB_NOT_FOUND);
  }

  return okResult(tenant);
}
