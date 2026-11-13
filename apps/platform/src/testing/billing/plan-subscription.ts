import { MILLISECONDS_PER_SECOND } from '@platform/constants/billing';
import { toStripeTime } from '@platform/testing/billing/stripe-time';
import { createMockFaker } from '@platform/testing/mock-faker';
import type Stripe from 'stripe';

const planChangeFaker = createMockFaker(7333);

export const MOCK_PLAN_ITEM_ID = `si_${planChangeFaker.string.alphanumeric(14)}`;
export const MOCK_BAND_ITEM_ID = `si_${planChangeFaker.string.alphanumeric(14)}`;
export const MOCK_SCHEDULE_ID = `sub_sched_${planChangeFaker.string.alphanumeric(14)}`;
export const MOCK_BAND_QUANTITY = 1;
export const MOCK_PERIOD_START = toStripeTime(planChangeFaker.date.recent());
export const MOCK_PERIOD_END = toStripeTime(planChangeFaker.date.soon());
export const MOCK_RENEWS_AT = new Date(
  MOCK_PERIOD_END * MILLISECONDS_PER_SECOND,
);

export const priceIdFor = (lookupKey: string) => `price_${lookupKey}`;

export const mockPrice = (lookupKey: string) => ({
  id: priceIdFor(lookupKey),
  lookup_key: lookupKey,
});

export const mockPlanSchedule = (
  nextKeys: string[],
): Stripe.SubscriptionSchedule =>
  ({
    id: MOCK_SCHEDULE_ID,
    current_phase: { start_date: MOCK_PERIOD_START, end_date: MOCK_PERIOD_END },
    phases: [
      { start_date: MOCK_PERIOD_START, end_date: MOCK_PERIOD_END, items: [] },
      {
        start_date: MOCK_PERIOD_END,
        items: nextKeys.map((key) => ({ price: mockPrice(key) })),
      },
    ],
  }) as unknown as Stripe.SubscriptionSchedule;

export const mockCreatedSchedule = (
  items: { price: string; quantity: number }[],
): Stripe.SubscriptionSchedule =>
  ({
    id: MOCK_SCHEDULE_ID,
    phases: [
      {
        start_date: MOCK_PERIOD_START,
        end_date: MOCK_PERIOD_END,
        items,
        discounts: [],
        automatic_tax: { enabled: true },
      },
    ],
  }) as unknown as Stripe.SubscriptionSchedule;
