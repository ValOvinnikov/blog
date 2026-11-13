import {
  STRIPE_PRICE_LOOKUP_KEY,
  TENANT_PLAN,
  type TPaidSubscriberBandCeiling,
  type TStripePriceLookupKey,
} from '@blog/db/constants';
import {
  MOCK_STRIPE_EVENT_ID,
  mockStripeIds,
} from '@blog/db/testing/tenants/billing';
import {
  MILLISECONDS_PER_SECOND,
  STRIPE_EVENT_TYPE,
  STRIPE_SUBSCRIPTION_STATUS,
  STRIPE_TENANT_METADATA_KEY,
} from '@platform/constants/billing';
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
export const MOCK_UNHANDLED_EVENT_TYPE = 'customer.created';
export const MOCK_INCOMPLETE_SUBSCRIPTION_STATUS = 'incomplete';
export const MOCK_BAND_CEILING: TPaidSubscriberBandCeiling = 2_500;
export const MOCK_STRIPE_CLIENT = {} as Stripe;
export const MOCK_GROWTH_UPGRADE = {
  tenantId: MOCK_TENANT_ID,
  fromPlan: TENANT_PLAN.FREE,
  toPlan: TENANT_PLAN.GROWTH,
};

const MOCK_AMOUNT_PAID = 2900;

const mockSubscriptionItem = (
  lookupKey: TStripePriceLookupKey,
): Stripe.SubscriptionItem =>
  ({ price: { lookup_key: lookupKey } }) as Stripe.SubscriptionItem;

export const mockStripeSubscription = ({
  status = STRIPE_SUBSCRIPTION_STATUS.ACTIVE,
  lookupKeys = [STRIPE_PRICE_LOOKUP_KEY.GROWTH_MONTHLY],
  tenantId,
  promotionCode,
}: {
  status?: string;
  lookupKeys?: TStripePriceLookupKey[];
  tenantId?: string;
  promotionCode?: string;
} = {}): Stripe.Subscription =>
  ({
    id: MOCK_STRIPE_SUBSCRIPTION_ID,
    customer: MOCK_STRIPE_CUSTOMER_ID,
    status,
    metadata: tenantId ? { [STRIPE_TENANT_METADATA_KEY]: tenantId } : {},
    discounts: promotionCode
      ? [{ promotion_code: { code: promotionCode } }]
      : [],
    items: { data: lookupKeys.map(mockSubscriptionItem) },
  }) as unknown as Stripe.Subscription;

export const mockStripeInvoice = (
  overrides: Partial<Stripe.Invoice> = {},
): Stripe.Invoice =>
  ({
    id: MOCK_STRIPE_INVOICE_ID,
    amount_paid: MOCK_AMOUNT_PAID,
    currency: 'usd',
    invoice_pdf: MOCK_INVOICE_PDF_URL,
    hosted_invoice_url: null,
    created: Math.floor(
      billingFaker.date.recent().getTime() / MILLISECONDS_PER_SECOND,
    ),
    status_transitions: { paid_at: null },
    parent: {
      subscription_details: { subscription: MOCK_STRIPE_SUBSCRIPTION_ID },
    },
    ...overrides,
  }) as unknown as Stripe.Invoice;

export const mockStripeEvent = (
  type: string = STRIPE_EVENT_TYPE.SUBSCRIPTION_UPDATED,
  object: object = mockStripeSubscription(),
): Stripe.Event =>
  ({
    id: MOCK_STRIPE_EVENT_ID,
    type,
    data: { object },
  }) as unknown as Stripe.Event;
