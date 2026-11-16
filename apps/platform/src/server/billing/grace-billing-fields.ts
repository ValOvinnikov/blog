import { BILLING_GRACE, type TBillingGrace } from '@platform/constants/billing';
import type { TSetTenantBillingInput } from '@shinefold/db/queries/tenants/set-tenant-billing/set-tenant-billing';
import type { TTenantBilling } from '@shinefold/db/queries/tenants/tenant-billing';

type TGraceBillingFields = Pick<
  TSetTenantBillingInput,
  | 'downgradeGraceStartedAt'
  | 'graceStartedEmailSentAt'
  | 'graceHalfwayEmailSentAt'
  | 'graceEndingEmailSentAt'
>;

export const graceBillingFields = (
  grace: TBillingGrace,
  { downgradeGraceStartedAt }: Pick<TTenantBilling, 'downgradeGraceStartedAt'>,
  now: Date,
): TGraceBillingFields => {
  switch (grace) {
    case BILLING_GRACE.START:
      return { downgradeGraceStartedAt: downgradeGraceStartedAt ?? now };
    case BILLING_GRACE.END:
      return {
        downgradeGraceStartedAt: null,
        graceStartedEmailSentAt: null,
        graceHalfwayEmailSentAt: null,
        graceEndingEmailSentAt: null,
      };
    case BILLING_GRACE.KEEP:
      return {};
  }
};
