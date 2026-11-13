import {
  MOCK_CHECKOUT_CLIENT_SECRET,
  MOCK_STRIPE_CUSTOMER_ID,
  MOCK_STRIPE_PRICE_ID,
} from '@platform/testing/billing/fixtures';
import type Stripe from 'stripe';

type TStripeCall = (...args: unknown[]) => Promise<unknown>;

const stripeCall = (value: unknown) => vi.fn<TStripeCall>(async () => value);

export const mockStripeCheckoutClient = () => {
  const calls = {
    listPrices: stripeCall({ data: [{ id: MOCK_STRIPE_PRICE_ID }] }),
    listPromotionCodes: stripeCall({ data: [] }),
    createSession: stripeCall({ client_secret: MOCK_CHECKOUT_CLIENT_SECRET }),
    listSessions: stripeCall({ data: [] }),
    expireSession: stripeCall({}),
    listSubscriptions: stripeCall({ data: [] }),
    createCustomer: stripeCall({ id: MOCK_STRIPE_CUSTOMER_ID }),
    retrieveCustomer: stripeCall({ id: MOCK_STRIPE_CUSTOMER_ID }),
  };
  const stripe = {
    prices: { list: calls.listPrices },
    promotionCodes: { list: calls.listPromotionCodes },
    checkout: {
      sessions: {
        create: calls.createSession,
        list: calls.listSessions,
        expire: calls.expireSession,
      },
    },
    subscriptions: { list: calls.listSubscriptions },
    customers: {
      create: calls.createCustomer,
      retrieve: calls.retrieveCustomer,
    },
  } as unknown as Stripe;

  return { stripe, ...calls };
};
