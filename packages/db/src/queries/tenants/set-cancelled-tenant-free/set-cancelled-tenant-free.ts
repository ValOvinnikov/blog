import {
  ERROR_CODE,
  type TErrorCode,
  TENANT_PLAN,
} from '@shinefold/config/constants';
import { getDb } from '@shinefold/db/client';
import { tenants } from '@shinefold/db/schema/tenants';
import { errorResult, okResult, type TResult } from '@shinefold/utils';
import { and, eq } from 'drizzle-orm';

// Ignores the status and starts no downgrade grace, unlike setTenantPlan: an archive drops a suspended site to Free too.
export async function setCancelledTenantFree(
  tenantId: string,
  stripeSubscriptionId: string,
): Promise<TResult<undefined, TErrorCode>> {
  const [row] = await getDb()
    .update(tenants)
    .set({
      plan: TENANT_PLAN.FREE,
      subscriberBandCeiling: null,
      downgradeGraceStartedAt: null,
      graceStartedEmailSentAt: null,
      graceHalfwayEmailSentAt: null,
      graceEndingEmailSentAt: null,
      downgradedFromPlan: null,
    })
    .where(
      and(
        eq(tenants.id, tenantId),
        eq(tenants.stripeSubscriptionId, stripeSubscriptionId),
      ),
    )
    .returning({ id: tenants.id });

  return row ? okResult() : errorResult(ERROR_CODE.DB_NOT_FOUND);
}
