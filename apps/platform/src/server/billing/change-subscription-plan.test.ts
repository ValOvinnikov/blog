import { STRIPE_PRICE_LOOKUP_KEY } from '@blog/db/constants';
import {
  BILLING_INTERVAL,
  BILLING_LOG,
  STRIPE_PRORATION_BEHAVIOR,
  STRIPE_RECURRING_INTERVAL,
} from '@platform/constants/billing';
import {
  PLAN_CHANGE_REFUSAL,
  PLAN_CHANGE_TIMING,
  type TPlanChoice,
} from '@platform/constants/plan-change';
import { MOCK_STRIPE_SUBSCRIPTION_ID } from '@platform/testing/billing/fixtures';
import {
  MOCK_GROWTH_MONTHLY_CHOICE,
  MOCK_STARTER_MONTHLY_CHOICE,
} from '@platform/testing/billing/plan-choices';
import {
  MOCK_BAND_ITEM_ID,
  MOCK_BAND_QUANTITY,
  MOCK_PERIOD_END,
  MOCK_PERIOD_START,
  MOCK_PLAN_ITEM_ID,
  MOCK_SCHEDULE_ID,
  mockPlanSchedule,
  priceIdFor,
} from '@platform/testing/billing/plan-subscription';
import { mockStripePlanChangeClient } from '@platform/testing/billing/stripe-plan-change-client';
import {
  mockStripeSubscription,
  type TMockStripeSubscription,
} from '@platform/testing/billing/stripe-subscription';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';
import Stripe from 'stripe';

import { changeSubscriptionPlan } from './change-subscription-plan';
import { loadSubscriptionPlan } from './load-subscription-plan';

const STARTER_MONTHLY = STRIPE_PRICE_LOOKUP_KEY.STARTER_MONTHLY;
const GROWTH_MONTHLY = STRIPE_PRICE_LOOKUP_KEY.GROWTH_MONTHLY;
const GROWTH_BAND = STRIPE_PRICE_LOOKUP_KEY.GROWTH_BAND_2500;
const MOCK_CARD_ERROR = new Stripe.errors.StripeCardError({
  message: 'declined',
});
const MOCK_INVALID_REQUEST = new Stripe.errors.StripeInvalidRequestError({
  message: 'invalid',
});
const IMMEDIATE_UPDATE = {
  proration_behavior: STRIPE_PRORATION_BEHAVIOR.ALWAYS_INVOICE,
  payment_behavior: 'error_if_incomplete',
};

type TPlanChangeClient = ReturnType<typeof mockStripePlanChangeClient>;

const change = async (
  from: TMockStripeSubscription,
  to: TPlanChoice,
  arrange?: (client: TPlanChangeClient) => void,
) => {
  const client = mockStripePlanChangeClient(mockStripeSubscription(from));
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
      { lookupKeys: [STARTER_MONTHLY] },
      MOCK_GROWTH_MONTHLY_CHOICE,
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
      { lookupKeys: [STARTER_MONTHLY] },
      { ...MOCK_STARTER_MONTHLY_CHOICE, interval: BILLING_INTERVAL.YEARLY },
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
      { lookupKeys: [GROWTH_MONTHLY, GROWTH_BAND] },
      { ...MOCK_GROWTH_MONTHLY_CHOICE, interval: BILLING_INTERVAL.YEARLY },
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
        { lookupKeys: [GROWTH_MONTHLY, GROWTH_BAND] },
        MOCK_STARTER_MONTHLY_CHOICE,
      );

    expect(result).toBe(PLAN_CHANGE_TIMING.AT_RENEWAL);
    expect(updateSubscription).not.toHaveBeenCalled();
    expect(createSchedule).toHaveBeenCalledExactlyOnceWith({
      from_subscription: MOCK_STRIPE_SUBSCRIPTION_ID,
    });
    expect(updateSchedule).toHaveBeenCalledExactlyOnceWith(MOCK_SCHEDULE_ID, {
      end_behavior: 'release',
      proration_behavior: STRIPE_PRORATION_BEHAVIOR.NONE,
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
          duration: {
            interval: STRIPE_RECURRING_INTERVAL.MONTHLY,
            interval_count: 1,
          },
          proration_behavior: STRIPE_PRORATION_BEHAVIOR.NONE,
          discounts: [],
          automatic_tax: { enabled: true },
        },
      ],
    });
  });

  it('moves yearly to monthly at renewal', async () => {
    const { result, updateSubscription } = await change(
      { lookupKeys: [STRIPE_PRICE_LOOKUP_KEY.GROWTH_YEARLY] },
      MOCK_GROWTH_MONTHLY_CHOICE,
    );

    expect(result).toBe(PLAN_CHANGE_TIMING.AT_RENEWAL);
    expect(updateSubscription).not.toHaveBeenCalled();
  });

  describe('with a move down already planned', () => {
    const PLANNED = {
      lookupKeys: [STARTER_MONTHLY],
      schedule: mockPlanSchedule([STRIPE_PRICE_LOOKUP_KEY.STARTER_YEARLY]),
    };

    it('releases the planned move only after moving up succeeds', async () => {
      const { releaseSchedule, updateSubscription } = await change(
        PLANNED,
        MOCK_GROWTH_MONTHLY_CHOICE,
      );

      expect(releaseSchedule).toHaveBeenCalledExactlyOnceWith(MOCK_SCHEDULE_ID);
      expect(updateSubscription).toHaveBeenCalledBefore(releaseSchedule);
    });

    it('keeps the planned move when the card is declined', async () => {
      const client = mockStripePlanChangeClient(
        mockStripeSubscription(PLANNED),
      );
      client.updateSubscription.mockRejectedValue(MOCK_CARD_ERROR);
      const subscription = await loadSubscriptionPlan(
        client.stripe,
        MOCK_STRIPE_SUBSCRIPTION_ID,
      );

      const decline = changeSubscriptionPlan(
        client.stripe,
        subscription!,
        MOCK_GROWTH_MONTHLY_CHOICE,
        MOCK_TENANT_ID,
      );

      await expect(decline).rejects.toBe(MOCK_CARD_ERROR);
      expect(client.releaseSchedule).not.toHaveBeenCalled();
    });

    it('releases the planned move right before planning another', async () => {
      const { releaseSchedule, createSchedule } = await change(
        { ...PLANNED, lookupKeys: [STRIPE_PRICE_LOOKUP_KEY.GROWTH_YEARLY] },
        MOCK_GROWTH_MONTHLY_CHOICE,
      );

      expect(releaseSchedule).toHaveBeenCalledBefore(createSchedule);
    });

    it('treats a schedule another tab already released as released', async () => {
      const { result } = await change(
        { ...PLANNED, lookupKeys: [GROWTH_MONTHLY] },
        MOCK_GROWTH_MONTHLY_CHOICE,
        ({ releaseSchedule, retrieveSchedule }) => {
          releaseSchedule.mockRejectedValue(MOCK_INVALID_REQUEST);
          retrieveSchedule.mockResolvedValue({
            released_at: MOCK_PERIOD_START,
          });
        },
      );

      expect(result).toBe(PLAN_CHANGE_TIMING.CANCEL_PENDING);
    });

    it('still fails when a live schedule refuses to release', async () => {
      const release = change(
        { ...PLANNED, lookupKeys: [GROWTH_MONTHLY] },
        MOCK_GROWTH_MONTHLY_CHOICE,
        ({ releaseSchedule }) =>
          releaseSchedule.mockRejectedValue(MOCK_INVALID_REQUEST),
      );

      await expect(release).rejects.toBe(MOCK_INVALID_REQUEST);
    });
  });

  it('plans a move down once when another tab planned one first', async () => {
    const { result, createSchedule, releaseSchedule } = await change(
      { lookupKeys: [GROWTH_MONTHLY] },
      MOCK_STARTER_MONTHLY_CHOICE,
      ({ createSchedule, retrieveSubscription }) => {
        createSchedule.mockRejectedValueOnce(MOCK_INVALID_REQUEST);
        retrieveSubscription
          .mockResolvedValueOnce(
            mockStripeSubscription({ lookupKeys: [GROWTH_MONTHLY] }),
          )
          .mockResolvedValueOnce(
            mockStripeSubscription({
              lookupKeys: [GROWTH_MONTHLY],
              schedule: MOCK_SCHEDULE_ID,
            }),
          );
      },
    );

    expect(result).toBe(PLAN_CHANGE_TIMING.AT_RENEWAL);
    expect(releaseSchedule).toHaveBeenCalledExactlyOnceWith(MOCK_SCHEDULE_ID);
    expect(createSchedule).toHaveBeenCalledTimes(2);
  });

  it('cancels a pending change when the current plan is chosen again', async () => {
    const { result, releaseSchedule, updateSubscription } = await change(
      {
        lookupKeys: [GROWTH_MONTHLY],
        schedule: mockPlanSchedule([STARTER_MONTHLY]),
      },
      MOCK_GROWTH_MONTHLY_CHOICE,
    );

    expect(result).toBe(PLAN_CHANGE_TIMING.CANCEL_PENDING);
    expect(releaseSchedule).toHaveBeenCalledExactlyOnceWith(MOCK_SCHEDULE_ID);
    expect(updateSubscription).not.toHaveBeenCalled();
  });

  it('changes nothing for the plan the site is already on', async () => {
    const { result, updateSubscription, createSchedule } = await change(
      { lookupKeys: [GROWTH_MONTHLY] },
      MOCK_GROWTH_MONTHLY_CHOICE,
    );

    expect(result).toBe(PLAN_CHANGE_REFUSAL.UNCHANGED);
    expect(updateSubscription).not.toHaveBeenCalled();
    expect(createSchedule).not.toHaveBeenCalled();
  });

  it('logs and changes nothing when a target Price is missing', async () => {
    const { result, updateSubscription } = await change(
      { lookupKeys: [STARTER_MONTHLY] },
      MOCK_GROWTH_MONTHLY_CHOICE,
      ({ listPrices }) => listPrices.mockResolvedValue({ data: [] }),
    );

    expect(result).toBeUndefined();
    expect(updateSubscription).not.toHaveBeenCalled();
    expect(vi.mocked(logger).error).toHaveBeenCalledWith(
      BILLING_LOG.PLAN_CHANGE_PRICE_MISSING,
      { tenantId: MOCK_TENANT_ID, ...MOCK_GROWTH_MONTHLY_CHOICE },
    );
  });
});
