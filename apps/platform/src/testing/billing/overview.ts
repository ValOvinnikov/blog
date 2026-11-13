import type { TTenantBilling } from '@blog/db/queries/tenants/tenant-billing';
import { MOCK_EMPTY_TENANT_BILLING } from '@blog/db/testing/tenants/billing';
import type { TBillingNextPayment } from '@platform/server/billing/fetch-stripe-billing';
import {
  MOCK_AMOUNT_PAID,
  MOCK_STRIPE_CURRENCY,
  MOCK_STRIPE_CUSTOMER_ID,
  MOCK_STRIPE_SUBSCRIPTION_ID,
} from '@platform/testing/billing/fixtures';
import type { TStripeAmount } from '@platform/utils/format-stripe-amount/format-stripe-amount';

export const MOCK_DRAFT_INVOICE_STATUS = 'draft';

export const MOCK_STRIPE_AMOUNT: TStripeAmount = {
  minorUnits: MOCK_AMOUNT_PAID,
  currency: MOCK_STRIPE_CURRENCY,
};

export const MOCK_NEXT_PAYMENT: TBillingNextPayment = {
  dueAt: new Date('2026-12-02T00:00:00.000Z'),
  amount: MOCK_STRIPE_AMOUNT,
};

export const MOCK_PAYING_TENANT_BILLING: TTenantBilling = {
  ...MOCK_EMPTY_TENANT_BILLING,
  stripeCustomerId: MOCK_STRIPE_CUSTOMER_ID,
  stripeSubscriptionId: MOCK_STRIPE_SUBSCRIPTION_ID,
};
