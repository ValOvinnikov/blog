import { TENANT_PLAN } from '@blog/config/constants';
import { STRIPE_PRICE_LOOKUP_KEY } from '@blog/db/constants';
import {
  STRIPE_SUBSCRIPTION_STATUS,
  BILLING_INTERVAL,
} from '@platform/constants/billing';
import {
  MOCK_BAND_CEILING,
  MOCK_STRIPE_SUBSCRIPTION_ID,
} from '@platform/testing/billing/fixtures';
import {
  MOCK_BAND_ITEM_ID,
  MOCK_BAND_QUANTITY,
  MOCK_PERIOD_END,
  MOCK_PLAN_ITEM_ID,
  MOCK_RENEWS_AT,
  MOCK_SCHEDULE_ID,
  mockPlanSchedule,
} from '@platform/testing/billing/plan-subscription';
import { mockStripePlanChangeClient } from '@platform/testing/billing/stripe-plan-change-client';
import {
  mockStripeSubscription,
  type TMockStripeSubscription,
} from '@platform/testing/billing/stripe-subscription';

import { loadSubscriptionPlan } from './load-subscription-plan';
import { fromStripeTime } from './stripe-time';

const load = (subscription: TMockStripeSubscription) => {
  const { stripe } = mockStripePlanChangeClient(
    mockStripeSubscription(subscription),
  );
  return loadSubscriptionPlan(stripe, MOCK_STRIPE_SUBSCRIPTION_ID);
};

describe(loadSubscriptionPlan, () => {
  it('reads the plan, period and renewal of a monthly Starter subscription', async () => {
    const plan = await load({
      lookupKeys: [STRIPE_PRICE_LOOKUP_KEY.STARTER_MONTHLY],
    });

    expect(plan).toEqual({
      id: MOCK_STRIPE_SUBSCRIPTION_ID,
      current: {
        plan: TENANT_PLAN.STARTER,
        interval: BILLING_INTERVAL.MONTHLY,
        ceiling: null,
      },
      isChangeable: true,
      renewsAt: MOCK_RENEWS_AT,
      scheduleId: undefined,
      pending: undefined,
      planItemId: MOCK_PLAN_ITEM_ID,
      bandItem: undefined,
    });
  });

  it('keeps the band item of a Growth subscription', async () => {
    const plan = await load({
      lookupKeys: [
        STRIPE_PRICE_LOOKUP_KEY.GROWTH_YEARLY,
        STRIPE_PRICE_LOOKUP_KEY.GROWTH_BAND_2500_YEARLY,
      ],
    });

    expect(plan?.current.ceiling).toBe(MOCK_BAND_CEILING);
    expect(plan?.bandItem).toEqual({
      id: MOCK_BAND_ITEM_ID,
      quantity: MOCK_BAND_QUANTITY,
    });
  });

  it('reads the plan a schedule moves the site to at renewal', async () => {
    const plan = await load({
      lookupKeys: [STRIPE_PRICE_LOOKUP_KEY.GROWTH_MONTHLY],
      schedule: mockPlanSchedule([STRIPE_PRICE_LOOKUP_KEY.STARTER_YEARLY]),
    });

    expect(plan?.scheduleId).toBe(MOCK_SCHEDULE_ID);
    expect(plan?.pending).toEqual({
      plan: TENANT_PLAN.STARTER,
      interval: BILLING_INTERVAL.YEARLY,
      startsAt: fromStripeTime(MOCK_PERIOD_END),
    });
  });

  it('reports no pending change when the next phase keeps the plan', async () => {
    const plan = await load({
      lookupKeys: [STRIPE_PRICE_LOOKUP_KEY.GROWTH_MONTHLY],
      schedule: mockPlanSchedule([STRIPE_PRICE_LOOKUP_KEY.GROWTH_MONTHLY]),
    });

    expect(plan?.pending).toBeUndefined();
  });

  it.each([
    ['past due', { status: STRIPE_SUBSCRIPTION_STATUS.PAST_DUE }],
    ['set to cancel', { cancelAtPeriodEnd: true }],
  ])('marks a subscription %s as not changeable', async (_case, overrides) => {
    const plan = await load({
      lookupKeys: [STRIPE_PRICE_LOOKUP_KEY.STARTER_MONTHLY],
      ...overrides,
    });

    expect(plan?.isChangeable).toBe(false);
  });

  it('reads nothing from a subscription on an unknown Price', async () => {
    const plan = await load({ lookupKeys: ['SOMETHING_ELSE'] });

    expect(plan).toBeUndefined();
  });
});
