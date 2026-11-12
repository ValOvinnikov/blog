import type { TStripeIds } from '@blog/db/queries/tenants/get-tenant-id-by-stripe-ids';
import type { TTenantBilling } from '@blog/db/queries/tenants/tenant-billing';
import type { TTenant } from '@blog/db/schema/tenants';
import { MOCK_NOW } from '@blog/db/testing/frozen-clock';
import { createMockFaker } from '@blog/db/testing/mock-faker';

const billingFaker = createMockFaker(6873);

export const MOCK_NO_BILLING = {
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  stripePromotionCode: null,
  trialEndsAt: null,
  downgradeGraceStartedAt: null,
  graceStartedEmailSentAt: null,
  graceHalfwayEmailSentAt: null,
  graceEndingEmailSentAt: null,
} as const satisfies Partial<TTenant>;

export const MOCK_STRIPE_EVENT_ID = `evt_${billingFaker.string.alphanumeric(24)}`;
export const MOCK_OTHER_STRIPE_EVENT_ID = `evt_${billingFaker.string.alphanumeric(24)}`;

export function mockStripeIds(): Required<TStripeIds> {
  return {
    stripeCustomerId: `cus_${billingFaker.string.alphanumeric(14)}`,
    stripeSubscriptionId: `sub_${billingFaker.string.alphanumeric(24)}`,
  };
}

export function mockTenantBilling(
  overrides: Partial<TTenantBilling> = {},
): TTenantBilling {
  const graceStartedAt = billingFaker.date.recent({ refDate: MOCK_NOW });

  return {
    ...mockStripeIds(),
    stripePromotionCode: billingFaker.string.alphanumeric(8).toUpperCase(),
    trialEndsAt: billingFaker.date.past({ refDate: graceStartedAt }),
    downgradeGraceStartedAt: graceStartedAt,
    graceStartedEmailSentAt: graceStartedAt,
    graceHalfwayEmailSentAt: billingFaker.date.soon({
      refDate: graceStartedAt,
    }),
    graceEndingEmailSentAt: undefined,
    ...overrides,
  };
}
