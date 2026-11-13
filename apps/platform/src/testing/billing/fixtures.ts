import { TENANT_PLAN } from '@blog/config/constants';
import { type TPaidSubscriberBandCeiling } from '@blog/db/constants';
import { mockStripeIds } from '@blog/db/testing/tenants/billing';
import { STRIPE_INVOICE_STATUS } from '@platform/constants/billing';
import { toStripeTime } from '@platform/testing/billing/stripe-time';
import { createMockFaker } from '@platform/testing/mock-faker';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import type Stripe from 'stripe';

const billingFaker = createMockFaker(6876);

export const {
  stripeCustomerId: MOCK_STRIPE_CUSTOMER_ID,
  stripeSubscriptionId: MOCK_STRIPE_SUBSCRIPTION_ID,
} = mockStripeIds();
export const {
  stripeCustomerId: MOCK_REPLACEMENT_STRIPE_CUSTOMER_ID,
  stripeSubscriptionId: MOCK_OTHER_STRIPE_SUBSCRIPTION_ID,
} = mockStripeIds();
export const MOCK_STRIPE_INVOICE_ID = `in_${billingFaker.string.alphanumeric(24)}`;
export const MOCK_STRIPE_PROMOTION_CODE = billingFaker.string
  .alphanumeric(8)
  .toUpperCase();
export const MOCK_STORED_PROMOTION_CODE = billingFaker.string
  .alphanumeric(8)
  .toUpperCase();
export const MOCK_STRIPE_WEBHOOK_SECRET = `whsec_${billingFaker.string.alphanumeric(32)}`;
export const MOCK_STRIPE_SECRET_KEY = `sk_test_${billingFaker.string.alphanumeric(24)}`;
export const MOCK_STRIPE_PUBLISHABLE_KEY = `pk_test_${billingFaker.string.alphanumeric(24)}`;
export const MOCK_STRIPE_PRICE_ID = `price_${billingFaker.string.alphanumeric(24)}`;
export const MOCK_STRIPE_PROMOTION_CODE_ID = `promo_${billingFaker.string.alphanumeric(24)}`;
export const MOCK_CHECKOUT_CLIENT_SECRET = `cs_test_${billingFaker.string.alphanumeric(32)}`;
export const MOCK_CHECKOUT_SESSION_ID = `cs_test_${billingFaker.string.alphanumeric(24)}`;
export const MOCK_CHECKOUT_RETURN_URL = billingFaker.internet.url();
export const MOCK_INVOICE_PDF_URL = billingFaker.internet.url();
export const MOCK_HOSTED_INVOICE_URL = billingFaker.internet.url();
export const MOCK_BILLING_PORTAL_URL = billingFaker.internet.url();
export const PLAN_CHANGE_SECTION_TEST_ID = 'plan-change-section';
export const MOCK_UNHANDLED_EVENT_TYPE = 'customer.created';
export const MOCK_INCOMPLETE_SUBSCRIPTION_STATUS = 'incomplete';
export const MOCK_BAND_CEILING: TPaidSubscriberBandCeiling = 2_500;
export const MOCK_STRIPE_CLIENT = {} as Stripe;
export const MOCK_GROWTH_UPGRADE = {
  tenantId: MOCK_TENANT_ID,
  fromPlan: TENANT_PLAN.FREE,
  toPlan: TENANT_PLAN.GROWTH,
};

export const MOCK_AMOUNT_PAID = 2900;
export const MOCK_STRIPE_CURRENCY = 'usd';

export const mockStripeInvoice = (
  overrides: Partial<Stripe.Invoice> = {},
): Stripe.Invoice =>
  ({
    id: MOCK_STRIPE_INVOICE_ID,
    amount_paid: MOCK_AMOUNT_PAID,
    amount_due: MOCK_AMOUNT_PAID,
    total: MOCK_AMOUNT_PAID,
    status: STRIPE_INVOICE_STATUS.PAID,
    next_payment_attempt: null,
    currency: MOCK_STRIPE_CURRENCY,
    invoice_pdf: MOCK_INVOICE_PDF_URL,
    hosted_invoice_url: null,
    created: toStripeTime(billingFaker.date.recent()),
    status_transitions: { paid_at: null },
    parent: {
      subscription_details: { subscription: MOCK_STRIPE_SUBSCRIPTION_ID },
    },
    ...overrides,
  }) as unknown as Stripe.Invoice;
