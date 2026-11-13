import {
  mockCreatedSchedule,
  mockPrice,
} from '@platform/testing/billing/plan-subscription';
import { type TStripeCall } from '@platform/testing/billing/stripe-call';
import type Stripe from 'stripe';

export const mockStripePlanChangeClient = (
  subscription: Stripe.Subscription,
) => {
  const calls = {
    retrieveSubscription: vi.fn<TStripeCall>(async () => subscription),
    updateSubscription: vi.fn<TStripeCall>(async () => subscription),
    listPrices: vi.fn<TStripeCall>(async (params) => ({
      data: (params as Stripe.PriceListParams).lookup_keys?.map(mockPrice),
    })),
    createSchedule: vi.fn<TStripeCall>(async () =>
      mockCreatedSchedule(
        subscription.items.data.map(({ price, quantity }) => ({
          price: price.id,
          quantity: quantity ?? 1,
        })),
      ),
    ),
    updateSchedule: vi.fn<TStripeCall>(async () => ({})),
    releaseSchedule: vi.fn<TStripeCall>(async () => ({})),
    retrieveSchedule: vi.fn<TStripeCall>(async () => ({})),
  };
  const stripe = {
    subscriptions: {
      retrieve: calls.retrieveSubscription,
      update: calls.updateSubscription,
    },
    prices: { list: calls.listPrices },
    subscriptionSchedules: {
      create: calls.createSchedule,
      update: calls.updateSchedule,
      release: calls.releaseSchedule,
      retrieve: calls.retrieveSchedule,
    },
  } as unknown as Stripe;

  return { stripe, ...calls };
};
