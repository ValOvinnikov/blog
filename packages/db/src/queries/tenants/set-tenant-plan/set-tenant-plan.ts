import { ERROR_CODE, type TErrorCode } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import type { TTenantPlan, TTenantStatus } from '@blog/db/constants';
import { planChangeFields } from '@blog/db/queries/tenants/plan-change-fields';
import { tenants } from '@blog/db/schema/tenants';
import { errorResult, okResult, type TResult } from '@blog/utils';
import { eq } from 'drizzle-orm';

export type TTenantPlanAndStatus = {
  plan: TTenantPlan;
  status: TTenantStatus;
};

export async function setTenantPlan(
  tenantId: string,
  { plan, status }: TTenantPlanAndStatus,
): Promise<TResult<TTenantPlanAndStatus, TErrorCode>> {
  const [row] = await getDb()
    .update(tenants)
    .set({ ...planChangeFields(plan), status })
    .where(eq(tenants.id, tenantId))
    .returning({ plan: tenants.plan, status: tenants.status });

  return row ? okResult(row) : errorResult(ERROR_CODE.DB_NOT_FOUND);
}
