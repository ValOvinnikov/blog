import {
  STRIPE_SUBSCRIPTION_STATUS,
  STRIPE_TENANT_METADATA_KEY,
} from '@platform/constants/billing';
import { STRIPE_EVENT_TYPE } from '@platform/constants/stripe-event';
import { STRIPE_PAUSE_BEHAVIOR } from '@platform/constants/subscription-lifecycle';
import {
  MOCK_STRIPE_CURRENCY,
  MOCK_STRIPE_CUSTOMER_ID,
  MOCK_STRIPE_SUBSCRIPTION_ID,
} from '@platform/testing/billing/fixtures';
import {
  MOCK_BAND_ITEM_ID,
  MOCK_BAND_QUANTITY,
  MOCK_PERIOD_END,
  MOCK_PLAN_ITEM_ID,
  MOCK_SCHEDULE_ID,
  mockPrice,
} from '@platform/testing/billing/plan-subscription';
import { STRIPE_PRICE_LOOKUP_KEY } from '@shinefold/db/constants';
import { MOCK_STRIPE_EVENT_ID } from '@shinefold/db/testing/tenants/billing';
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
  cancelAt?: number;
  schedule?: Stripe.SubscriptionSchedule | string | null;
  currency?: string;
  isCollectionPaused?: boolean;
};

export const mockStripeSubscription = ({
  status = STRIPE_SUBSCRIPTION_STATUS.ACTIVE,
  lookupKeys = [STRIPE_PRICE_LOOKUP_KEY.GROWTH_MONTHLY],
  tenantId,
  promotionCode,
  cancelAtPeriodEnd = false,
  cancelAt,
  schedule = null,
  currency = MOCK_STRIPE_CURRENCY,
  isCollectionPaused = false,
}: TMockStripeSubscription = {}): Stripe.Subscription =>
  ({
    id: MOCK_STRIPE_SUBSCRIPTION_ID,
    currency,
    customer: MOCK_STRIPE_CUSTOMER_ID,
    status,
    cancel_at_period_end: cancelAtPeriodEnd,
    cancel_at: cancelAt ?? null,
    schedule,
    pause_collection: isCollectionPaused
      ? { behavior: STRIPE_PAUSE_BEHAVIOR.VOID }
      : null,
    metadata: tenantId ? { [STRIPE_TENANT_METADATA_KEY]: tenantId } : {},
    discounts: promotionCode
      ? [{ promotion_code: { code: promotionCode } }]
      : [],
    items: { data: lookupKeys.map(mockSubscriptionItem) },
  }) as unknown as Stripe.Subscription;

export const mockStripeEvent = (
  type: string = STRIPE_EVENT_TYPE.SUBSCRIPTION_UPDATED,
  object: object = mockStripeSubscription(),
  previousAttributes?: object,
): Stripe.Event =>
  ({
    id: MOCK_STRIPE_EVENT_ID,
    type,
    data: { object, previous_attributes: previousAttributes },
  }) as unknown as Stripe.Event;

export const mockPendingUpdateClearedEvent = (
  { schedule = MOCK_SCHEDULE_ID }: Pick<TMockStripeSubscription, 'schedule'>,
  { isApplied }: { isApplied: boolean },
): Stripe.Event =>
  mockStripeEvent(
    STRIPE_EVENT_TYPE.SUBSCRIPTION_UPDATED,
    mockStripeSubscription({ schedule }),
    {
      pending_update: { expires_at: MOCK_PERIOD_END },
      ...(isApplied && { items: { data: [] } }),
    },
  );
