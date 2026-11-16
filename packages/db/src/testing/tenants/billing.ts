import { PAID_SUBSCRIBER_BAND_CEILINGS } from '@shinefold/db/constants';
import type { TStripeIds } from '@shinefold/db/queries/tenants/get-tenant-id-by-stripe-ids';
import type { TTenantBilling } from '@shinefold/db/queries/tenants/tenant-billing';
import type { TTenant } from '@shinefold/db/schema/tenants';
import { MOCK_NOW } from '@shinefold/db/testing/frozen-clock';
import { createMockFaker } from '@shinefold/db/testing/mock-faker';

const billingFaker = createMockFaker(6873);

export const MOCK_NO_BILLING = {
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  stripePromotionCode: null,
  subscriberBandCeiling: null,
  trialEndsAt: null,
  downgradeGraceStartedAt: null,
  graceStartedEmailSentAt: null,
  graceHalfwayEmailSentAt: null,
  graceEndingEmailSentAt: null,
  downgradedFromPlan: null,
} as const satisfies Partial<TTenant>;

export const MOCK_EMPTY_TENANT_BILLING: TTenantBilling = {
  stripeCustomerId: undefined,
  stripeSubscriptionId: undefined,
  stripePromotionCode: undefined,
  subscriberBandCeiling: undefined,
  trialEndsAt: undefined,
  downgradeGraceStartedAt: undefined,
  graceStartedEmailSentAt: undefined,
  graceHalfwayEmailSentAt: undefined,
  graceEndingEmailSentAt: undefined,
};

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
    subscriberBandCeiling: billingFaker.helpers.arrayElement(
      PAID_SUBSCRIBER_BAND_CEILINGS,
    ),
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
