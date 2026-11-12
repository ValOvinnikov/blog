import type { TSetTenantBillingInput } from '@blog/db/queries/tenants/set-tenant-billing/set-tenant-billing';
import type { TTenantBilling } from '@blog/db/queries/tenants/tenant-billing';
import { BILLING_GRACE, type TBillingGrace } from '@platform/constants/billing';

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
