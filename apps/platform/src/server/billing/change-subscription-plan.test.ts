import { TENANT_PLAN } from '@blog/config/constants';
import { STRIPE_PRICE_LOOKUP_KEY } from '@blog/db/constants';
import { BILLING_INTERVAL, BILLING_LOG } from '@platform/constants/billing';
import {
  PLAN_CHANGE_REFUSAL,
  PLAN_CHANGE_TIMING,
  type TPlanChoice,
} from '@platform/constants/plan-change';
import { MOCK_STRIPE_SUBSCRIPTION_ID } from '@platform/testing/billing/fixtures';
import {
  MOCK_BAND_ITEM_ID,
  MOCK_BAND_QUANTITY,
  MOCK_PERIOD_END,
  MOCK_PERIOD_START,
  MOCK_PLAN_ITEM_ID,
  MOCK_SCHEDULE_ID,
  mockPlanSchedule,
  mockPlanSubscription,
  priceIdFor,
  type TMockPlanSubscription,
} from '@platform/testing/billing/plan-subscription';
import { mockStripePlanChangeClient } from '@platform/testing/billing/stripe-plan-change-client';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';

import { changeSubscriptionPlan } from './change-subscription-plan';
import { loadSubscriptionPlan } from './load-subscription-plan';

const STARTER_MONTHLY = STRIPE_PRICE_LOOKUP_KEY.STARTER_MONTHLY;
const GROWTH_MONTHLY = STRIPE_PRICE_LOOKUP_KEY.GROWTH_MONTHLY;
const GROWTH_BAND = STRIPE_PRICE_LOOKUP_KEY.GROWTH_BAND_2500;
const TO_GROWTH: TPlanChoice = {
  plan: TENANT_PLAN.GROWTH,
  interval: BILLING_INTERVAL.MONTHLY,
};
const TO_STARTER: TPlanChoice = {
  plan: TENANT_PLAN.STARTER,
  interval: BILLING_INTERVAL.MONTHLY,
};
const IMMEDIATE_UPDATE = {
  proration_behavior: 'always_invoice',
  payment_behavior: 'error_if_incomplete',
};

type TPlanChangeClient = ReturnType<typeof mockStripePlanChangeClient>;

const change = async (
  from: TMockPlanSubscription,
  to: TPlanChoice,
  arrange?: (client: TPlanChangeClient) => void,
) => {
  const client = mockStripePlanChangeClient(mockPlanSubscription(from));
  arrange?.(client);
  const subscription = await loadSubscriptionPlan(
    client.stripe,
    MOCK_STRIPE_SUBSCRIPTION_ID,
  );
  if (!subscription) throw new Error('subscription not loaded');
  const result = await changeSubscriptionPlan(
    client.stripe,
    subscription,
    to,
    MOCK_TENANT_ID,
  );
  return { result, ...client };
};

describe(changeSubscriptionPlan, () => {
  it('moves a Starter site to Growth now, on the same subscription', async () => {
    const { result, updateSubscription, createSchedule } = await change(
      { planKey: STARTER_MONTHLY },
      TO_GROWTH,
    );

    expect(result).toBe(PLAN_CHANGE_TIMING.NOW);
    expect(updateSubscription).toHaveBeenCalledExactlyOnceWith(
      MOCK_STRIPE_SUBSCRIPTION_ID,
      {
        items: [{ id: MOCK_PLAN_ITEM_ID, price: priceIdFor(GROWTH_MONTHLY) }],
        ...IMMEDIATE_UPDATE,
      },
    );
    expect(createSchedule).not.toHaveBeenCalled();
  });

  it('moves monthly to yearly now', async () => {
    const { result, updateSubscription } = await change(
      { planKey: STARTER_MONTHLY },
      { ...TO_STARTER, interval: BILLING_INTERVAL.YEARLY },
    );

    expect(result).toBe(PLAN_CHANGE_TIMING.NOW);
    expect(updateSubscription).toHaveBeenCalledExactlyOnceWith(
      MOCK_STRIPE_SUBSCRIPTION_ID,
      {
        items: [
          {
            id: MOCK_PLAN_ITEM_ID,
            price: priceIdFor(STRIPE_PRICE_LOOKUP_KEY.STARTER_YEARLY),
          },
        ],
        ...IMMEDIATE_UPDATE,
      },
    );
  });

  it('swaps the band Price for the new period', async () => {
    const { updateSubscription } = await change(
      { planKey: GROWTH_MONTHLY, bandKey: GROWTH_BAND },
      { ...TO_GROWTH, interval: BILLING_INTERVAL.YEARLY },
    );

    expect(updateSubscription).toHaveBeenCalledWith(
      MOCK_STRIPE_SUBSCRIPTION_ID,
      expect.objectContaining({
        items: [
          {
            id: MOCK_PLAN_ITEM_ID,
            price: priceIdFor(STRIPE_PRICE_LOOKUP_KEY.GROWTH_YEARLY),
          },
          {
            id: MOCK_BAND_ITEM_ID,
            price: priceIdFor(STRIPE_PRICE_LOOKUP_KEY.GROWTH_BAND_2500_YEARLY),
          },
        ],
      }),
    );
  });

  it('moves a Growth site to Starter at renewal, on the same subscription', async () => {
    const { result, updateSubscription, createSchedule, updateSchedule } =
      await change(
        { planKey: GROWTH_MONTHLY, bandKey: GROWTH_BAND },
        TO_STARTER,
      );

    expect(result).toBe(PLAN_CHANGE_TIMING.AT_RENEWAL);
    expect(updateSubscription).not.toHaveBeenCalled();
    expect(createSchedule).toHaveBeenCalledExactlyOnceWith({
      from_subscription: MOCK_STRIPE_SUBSCRIPTION_ID,
    });
    expect(updateSchedule).toHaveBeenCalledExactlyOnceWith(MOCK_SCHEDULE_ID, {
      end_behavior: 'release',
      proration_behavior: 'none',
      phases: [
        {
          items: [
            { price: priceIdFor(GROWTH_MONTHLY), quantity: 1 },
            { price: priceIdFor(GROWTH_BAND), quantity: MOCK_BAND_QUANTITY },
          ],
          start_date: MOCK_PERIOD_START,
          end_date: MOCK_PERIOD_END,
          discounts: [],
          automatic_tax: { enabled: true },
        },
        {
          items: [{ price: priceIdFor(STARTER_MONTHLY), quantity: 1 }],
          duration: { interval: 'month', interval_count: 1 },
          proration_behavior: 'none',
          discounts: [],
          automatic_tax: { enabled: true },
        },
      ],
    });
  });

  it('moves yearly to monthly at renewal', async () => {
    const { result, updateSubscription } = await change(
      { planKey: STRIPE_PRICE_LOOKUP_KEY.GROWTH_YEARLY },
      TO_GROWTH,
    );

    expect(result).toBe(PLAN_CHANGE_TIMING.AT_RENEWAL);
    expect(updateSubscription).not.toHaveBeenCalled();
  });

  it('replaces a pending change before moving up now', async () => {
    const { releaseSchedule, updateSubscription } = await change(
      {
        planKey: STARTER_MONTHLY,
        schedule: mockPlanSchedule([STRIPE_PRICE_LOOKUP_KEY.STARTER_YEARLY]),
      },
      TO_GROWTH,
    );

    expect(releaseSchedule).toHaveBeenCalledExactlyOnceWith(MOCK_SCHEDULE_ID);
    expect(updateSubscription).toHaveBeenCalledOnce();
  });

  it('cancels a pending change when the current plan is chosen again', async () => {
    const { result, releaseSchedule, updateSubscription } = await change(
      {
        planKey: GROWTH_MONTHLY,
        schedule: mockPlanSchedule([STARTER_MONTHLY]),
      },
      TO_GROWTH,
    );

    expect(result).toBe(PLAN_CHANGE_TIMING.CANCEL_PENDING);
    expect(releaseSchedule).toHaveBeenCalledExactlyOnceWith(MOCK_SCHEDULE_ID);
    expect(updateSubscription).not.toHaveBeenCalled();
  });

  it('changes nothing for the plan the site is already on', async () => {
    const { result, updateSubscription, createSchedule } = await change(
      { planKey: GROWTH_MONTHLY },
      TO_GROWTH,
    );

    expect(result).toBe(PLAN_CHANGE_REFUSAL.UNCHANGED);
    expect(updateSubscription).not.toHaveBeenCalled();
    expect(createSchedule).not.toHaveBeenCalled();
  });

  it('logs and changes nothing when a target Price is missing', async () => {
    const { result, updateSubscription } = await change(
      { planKey: STARTER_MONTHLY },
      TO_GROWTH,
      ({ listPrices }) => listPrices.mockResolvedValue({ data: [] }),
    );

    expect(result).toBeUndefined();
    expect(updateSubscription).not.toHaveBeenCalled();
    expect(vi.mocked(logger).error).toHaveBeenCalledWith(
      BILLING_LOG.PLAN_CHANGE_PRICE_MISSING,
      { tenantId: MOCK_TENANT_ID, ...TO_GROWTH },
    );
  });
});
