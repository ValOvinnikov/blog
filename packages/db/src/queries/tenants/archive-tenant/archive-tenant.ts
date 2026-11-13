import { ERROR_CODE, type TErrorCode } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import { TENANT_STATUS } from '@blog/db/constants';
import { heldStatusFields } from '@blog/db/queries/tenants/held-status-fields';
import { tenants, type TTenant } from '@blog/db/schema/tenants';
import { errorResult, okResult, type TResult } from '@blog/utils';
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
