import { ERROR_CODE, type TErrorCode } from '@shinefold/config/constants';
import type { TNullablePatch } from '@shinefold/config/types';
import { getDb } from '@shinefold/db/client';
import { getTenantBilling } from '@shinefold/db/queries/tenants/get-tenant-billing';
import {
  tenantBillingColumns,
  toTenantBilling,
  type TTenantBilling,
} from '@shinefold/db/queries/tenants/tenant-billing';
import { tenants } from '@shinefold/db/schema/tenants';
import { errorResult, okResult, type TResult } from '@shinefold/utils';
import { isUndefined } from '@shinefold/utils/primitives';
import { eq } from 'drizzle-orm';

export type TSetTenantBillingInput = TNullablePatch<TTenantBilling>;

export async function setTenantBilling(
  tenantId: string,
  input: TSetTenantBillingInput,
): Promise<TResult<TTenantBilling, TErrorCode>> {
  if (Object.values(input).every(isUndefined)) {
    const billing = await getTenantBilling(tenantId);

    return billing ? okResult(billing) : errorResult(ERROR_CODE.DB_NOT_FOUND);
  }

  const [row] = await getDb()
    .update(tenants)
    .set({
      stripeCustomerId: input.stripeCustomerId,
      stripeSubscriptionId: input.stripeSubscriptionId,
      stripePromotionCode: input.stripePromotionCode,
      subscriberBandCeiling: input.subscriberBandCeiling,
      trialEndsAt: input.trialEndsAt,
      downgradeGraceStartedAt: input.downgradeGraceStartedAt,
      graceStartedEmailSentAt: input.graceStartedEmailSentAt,
      graceHalfwayEmailSentAt: input.graceHalfwayEmailSentAt,
      graceEndingEmailSentAt: input.graceEndingEmailSentAt,
    })
    .where(eq(tenants.id, tenantId))
    .returning(tenantBillingColumns);

  return row
    ? okResult(toTenantBilling(row))
    : errorResult(ERROR_CODE.DB_NOT_FOUND);
}
