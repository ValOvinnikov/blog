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
import {
  STRIPE_PAYMENT_BEHAVIOR,
  STRIPE_PAYMENT_INTENT_STATUS,
  STRIPE_PENDING_PAYMENT_EXPAND,
} from '@platform/constants/stripe-payment';
import {
  STRIPE_BILLING_CYCLE_ANCHOR,
  STRIPE_SCHEDULE_END_BEHAVIOR,
} from '@platform/constants/stripe-schedule';
import {
  MOCK_PAYMENT_CLIENT_SECRET,
  MOCK_PAYMENT_INTENT_ID,
  MOCK_STRIPE_SUBSCRIPTION_ID,
} from '@platform/testing/billing/fixtures';
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
import { MOCK_NETWORK_ERROR } from '@platform/testing/http/network-error';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';
import type { TMaybeNull } from '@shinefold/config';
import { STRIPE_PRICE_LOOKUP_KEY } from '@shinefold/db/constants';
import Stripe from 'stripe';

import { changeSubscriptionPlan } from './change-subscription-plan';
import { loadSubscriptionPlan } from './load-subscription-plan';

const STARTER_MONTHLY = STRIPE_PRICE_LOOKUP_KEY.STARTER_MONTHLY;
const GROWTH_MONTHLY = STRIPE_PRICE_LOOKUP_KEY.GROWTH_MONTHLY;
const GROWTH_BAND = STRIPE_PRICE_LOOKUP_KEY.GROWTH_BAND_2500;
const MOCK_INVALID_REQUEST = new Stripe.errors.StripeInvalidRequestError({
  message: 'invalid',
});
const MOCK_OTHER_SCHEDULE_ID = `${MOCK_SCHEDULE_ID}_other`;
const IMMEDIATE_UPDATE = {
  proration_behavior: STRIPE_PRORATION_BEHAVIOR.ALWAYS_INVOICE,
  payment_behavior: STRIPE_PAYMENT_BEHAVIOR.PENDING_IF_INCOMPLETE,
  expand: STRIPE_PENDING_PAYMENT_EXPAND,
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
      end_behavior: STRIPE_SCHEDULE_END_BEHAVIOR.RELEASE,
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
          billing_cycle_anchor: STRIPE_BILLING_CYCLE_ANCHOR.PHASE_START,
          proration_behavior: STRIPE_PRORATION_BEHAVIOR.NONE,
          discounts: [],
          automatic_tax: { enabled: true },
        },
      ],
    });
  });

  it('bills a move down to a longer period from the day its phase starts', async () => {
    const { updateSchedule } = await change(
      { lookupKeys: [GROWTH_MONTHLY] },
      { ...MOCK_STARTER_MONTHLY_CHOICE, interval: BILLING_INTERVAL.YEARLY },
    );

    expect(updateSchedule).toHaveBeenCalledExactlyOnceWith(
      MOCK_SCHEDULE_ID,
      expect.objectContaining({
        phases: [
          expect.anything(),
          expect.objectContaining({
            items: [
              {
                price: priceIdFor(STRIPE_PRICE_LOOKUP_KEY.STARTER_YEARLY),
                quantity: 1,
              },
            ],
            duration: {
              interval: STRIPE_RECURRING_INTERVAL.YEARLY,
              interval_count: 1,
            },
            billing_cycle_anchor: STRIPE_BILLING_CYCLE_ANCHOR.PHASE_START,
          }),
        ],
      }),
    );
  });

  it('moves yearly to monthly at renewal', async () => {
    const { result, updateSubscription } = await change(
      { lookupKeys: [STRIPE_PRICE_LOOKUP_KEY.GROWTH_YEARLY] },
      MOCK_GROWTH_MONTHLY_CHOICE,
    );

    expect(result).toBe(PLAN_CHANGE_TIMING.AT_RENEWAL);
    expect(updateSubscription).not.toHaveBeenCalled();
  });

  describe('when the payment for a move up does not go through at once', () => {
    const moveUpHeldFor = (status: Stripe.PaymentIntent.Status) =>
      change(
        { lookupKeys: [STARTER_MONTHLY] },
        MOCK_GROWTH_MONTHLY_CHOICE,
        (client) => client.holdForPayment(status),
      );

    it("hands back the payment's client secret when the bank asks for a step", async () => {
      const { result, retrievePaymentIntent } = await moveUpHeldFor(
        STRIPE_PAYMENT_INTENT_STATUS.REQUIRES_ACTION,
      );

      expect(result).toEqual({ clientSecret: MOCK_PAYMENT_CLIENT_SECRET });
      expect(retrievePaymentIntent).toHaveBeenCalledExactlyOnceWith(
        MOCK_PAYMENT_INTENT_ID,
      );
    });

    it('says the card was declined when the payment needs another card', async () => {
      const { result } = await moveUpHeldFor(
        STRIPE_PAYMENT_INTENT_STATUS.REQUIRES_PAYMENT_METHOD,
      );

      expect(result).toBe(PLAN_CHANGE_REFUSAL.CARD_DECLINED);
    });

    it('reports the move up as made while the payment is processing', async () => {
      const { result } = await moveUpHeldFor(
        STRIPE_PAYMENT_INTENT_STATUS.PROCESSING,
      );

      expect(result).toBe(PLAN_CHANGE_TIMING.NOW);
    });

    it('logs a held change with no payment to read', async () => {
      const { result } = await change(
        { lookupKeys: [STARTER_MONTHLY] },
        MOCK_GROWTH_MONTHLY_CHOICE,
        ({ updateSubscription }) =>
          updateSubscription.mockResolvedValue({
            ...mockStripeSubscription({ lookupKeys: [STARTER_MONTHLY] }),
            pending_update: { expires_at: MOCK_PERIOD_END },
            latest_invoice: null,
          }),
      );

      expect(result).toBeUndefined();
      expect(vi.mocked(logger).error).toHaveBeenCalledExactlyOnceWith(
        BILLING_LOG.PLAN_CHANGE_PAYMENT_UNKNOWN,
        expect.objectContaining({ tenantId: MOCK_TENANT_ID }),
      );
    });
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

    it.each([
      STRIPE_PAYMENT_INTENT_STATUS.REQUIRES_ACTION,
      STRIPE_PAYMENT_INTENT_STATUS.REQUIRES_PAYMENT_METHOD,
    ])('keeps the planned move while the payment is %s', async (status) => {
      const { releaseSchedule } = await change(
        PLANNED,
        MOCK_GROWTH_MONTHLY_CHOICE,
        (client) => client.holdForPayment(status),
      );

      expect(releaseSchedule).not.toHaveBeenCalled();
    });

    it('retries a failed release once without logging', async () => {
      const { result, releaseSchedule } = await change(
        PLANNED,
        MOCK_GROWTH_MONTHLY_CHOICE,
        (client) =>
          client.releaseSchedule.mockRejectedValueOnce(MOCK_NETWORK_ERROR),
      );

      expect(result).toBe(PLAN_CHANGE_TIMING.NOW);
      expect(releaseSchedule).toHaveBeenCalledTimes(2);
      expect(vi.mocked(logger).error).not.toHaveBeenCalled();
    });

    it('reports the move up as made and logs a planned move that will not release', async () => {
      const { result } = await change(
        PLANNED,
        MOCK_GROWTH_MONTHLY_CHOICE,
        (client) =>
          client.releaseSchedule.mockRejectedValue(MOCK_NETWORK_ERROR),
      );

      expect(result).toBe(PLAN_CHANGE_TIMING.NOW);
      expect(vi.mocked(logger).error).toHaveBeenCalledExactlyOnceWith(
        BILLING_LOG.PLAN_CHANGE_RELEASE_FAILED,
        expect.objectContaining({
          tenantId: MOCK_TENANT_ID,
          scheduleId: MOCK_SCHEDULE_ID,
        }),
      );
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

  it('releases a move down another tab planned while moving up', async () => {
    const { releaseSchedule } = await change(
      { lookupKeys: [STARTER_MONTHLY] },
      MOCK_GROWTH_MONTHLY_CHOICE,
      ({ updateSubscription }) =>
        updateSubscription.mockResolvedValue(
          mockStripeSubscription({
            lookupKeys: [GROWTH_MONTHLY],
            schedule: MOCK_SCHEDULE_ID,
          }),
        ),
    );

    expect(releaseSchedule).toHaveBeenCalledExactlyOnceWith(MOCK_SCHEDULE_ID);
  });

  describe('when another tab replaced the schedule mid-change', () => {
    const replacedBy = (schedule: TMaybeNull<string>) =>
      change(
        { lookupKeys: [GROWTH_MONTHLY] },
        MOCK_STARTER_MONTHLY_CHOICE,
        ({ updateSchedule, retrieveSchedule, retrieveSubscription }) => {
          updateSchedule.mockRejectedValue(MOCK_INVALID_REQUEST);
          retrieveSchedule.mockResolvedValue({
            released_at: MOCK_PERIOD_START,
          });
          retrieveSubscription
            .mockResolvedValueOnce(
              mockStripeSubscription({ lookupKeys: [GROWTH_MONTHLY] }),
            )
            .mockResolvedValueOnce(
              mockStripeSubscription({
                lookupKeys: [GROWTH_MONTHLY],
                schedule,
              }),
            );
        },
      );

    it('plans the move down without an error', async () => {
      const { result } = await replacedBy(MOCK_OTHER_SCHEDULE_ID);

      expect(result).toBe(PLAN_CHANGE_TIMING.AT_RENEWAL);
    });

    it('still fails when no change is left in place', async () => {
      await expect(replacedBy(null)).rejects.toBe(MOCK_INVALID_REQUEST);
    });
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
