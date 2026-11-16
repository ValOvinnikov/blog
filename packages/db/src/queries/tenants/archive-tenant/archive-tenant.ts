import { ERROR_CODE, type TErrorCode } from '@shinefold/config/constants';
import { getDb } from '@shinefold/db/client';
import { TENANT_STATUS } from '@shinefold/db/constants';
import { heldStatusFields } from '@shinefold/db/queries/tenants/held-status-fields';
import { tenants, type TTenant } from '@shinefold/db/schema/tenants';
import { errorResult, okResult, type TResult } from '@shinefold/utils';
import { eq } from 'drizzle-orm';

export async function archiveTenant(
  tenantId: string,
): Promise<TResult<TTenant, TErrorCode>> {
  const db = getDb();

  const [tenant] = await db
    .update(tenants)
    .set({
      ...heldStatusFields(),
      deprovisionedAt: new Date(),
      status: TENANT_STATUS.ARCHIVED,
    })
    .where(eq(tenants.id, tenantId))
    .returning();

  if (!tenant) {
    return errorResult(ERROR_CODE.DB_NOT_FOUND);
  }

  return okResult(tenant);
}
