import { ERROR_CODE, type TErrorCode } from '@shinefold/config/constants';
import { getDb } from '@shinefold/db/client';
import { TENANT_STATUS } from '@shinefold/db/constants';
import { isNotDeprovisioned } from '@shinefold/db/queries/tenants/not-deprovisioned';
import { tenants, type TTenant } from '@shinefold/db/schema/tenants';
import { errorResult, okResult, type TResult } from '@shinefold/utils';
import { and, eq, ne, sql } from 'drizzle-orm';

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
        isNotDeprovisioned,
      ),
    )
    .returning();

  if (!tenant) {
    return errorResult(ERROR_CODE.DB_NOT_FOUND);
  }

  return okResult(tenant);
}
