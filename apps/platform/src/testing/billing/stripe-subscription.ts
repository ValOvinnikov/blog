import { STRIPE_PRICE_LOOKUP_KEY } from '@blog/db/constants';
import { MOCK_STRIPE_EVENT_ID } from '@blog/db/testing/tenants/billing';
import {
  STRIPE_SUBSCRIPTION_STATUS,
  STRIPE_TENANT_METADATA_KEY,
} from '@platform/constants/billing';
import { STRIPE_EVENT_TYPE } from '@platform/constants/stripe-event';
import {
  MOCK_STRIPE_CUSTOMER_ID,
  MOCK_STRIPE_SUBSCRIPTION_ID,
} from '@platform/testing/billing/fixtures';
import {
  MOCK_BAND_ITEM_ID,
  MOCK_BAND_QUANTITY,
  MOCK_PERIOD_END,
  MOCK_PLAN_ITEM_ID,
  mockPrice,
} from '@platform/testing/billing/plan-subscription';
import type Stripe from 'stripe';

const SUBSCRIPTION_ITEM_IDS = [MOCK_PLAN_ITEM_ID, MOCK_BAND_ITEM_ID];

const mockSubscriptionItem = (lookupKey: string, index: number) => ({
  id: SUBSCRIPTION_ITEM_IDS[index],
  price: mockPrice(lookupKey),
  quantity: MOCK_BAND_QUANTITY,
  current_period_end: MOCK_PERIOD_END,
});

export type TMockStripeSubscription = {
  status?: string;
  lookupKeys?: string[];
  tenantId?: string;
  promotionCode?: string;
  cancelAtPeriodEnd?: boolean;
  schedule?: Stripe.SubscriptionSchedule | string | null;
};

export const mockStripeSubscription = ({
  status = STRIPE_SUBSCRIPTION_STATUS.ACTIVE,
  lookupKeys = [STRIPE_PRICE_LOOKUP_KEY.GROWTH_MONTHLY],
  tenantId,
  promotionCode,
  cancelAtPeriodEnd = false,
  schedule = null,
}: TMockStripeSubscription = {}): Stripe.Subscription =>
  ({
    id: MOCK_STRIPE_SUBSCRIPTION_ID,
    customer: MOCK_STRIPE_CUSTOMER_ID,
    status,
    cancel_at_period_end: cancelAtPeriodEnd,
    schedule,
    metadata: tenantId ? { [STRIPE_TENANT_METADATA_KEY]: tenantId } : {},
    discounts: promotionCode
      ? [{ promotion_code: { code: promotionCode } }]
      : [],
    items: { data: lookupKeys.map(mockSubscriptionItem) },
  }) as unknown as Stripe.Subscription;

export const mockStripeEvent = (
  type: string = STRIPE_EVENT_TYPE.SUBSCRIPTION_UPDATED,
  object: object = mockStripeSubscription(),
): Stripe.Event =>
  ({
    id: MOCK_STRIPE_EVENT_ID,
    type,
    data: { object },
  }) as unknown as Stripe.Event;
