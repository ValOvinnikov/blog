import { getStripeClient } from '@platform/server/billing/stripe-client';
import {
  MOCK_PAYMENT_CLIENT_SECRET,
  MOCK_INVOICE_PAYMENTS,
  MOCK_STRIPE_INVOICE_ID,
  mockStripeInvoice,
} from '@platform/testing/billing/fixtures';
import {
  MOCK_PERIOD_END,
  mockCreatedSchedule,
  mockPrice,
} from '@platform/testing/billing/plan-subscription';
import { type TStripeCall } from '@platform/testing/billing/stripe-call';
import {
  mockStripeSubscription,
  type TMockStripeSubscription,
} from '@platform/testing/billing/stripe-subscription';
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
    retrievePaymentIntent: vi.fn<TStripeCall>(async () => ({})),
    createInvoicePreview: vi.fn<TStripeCall>(async () => mockStripeInvoice()),
  };
  const stripe = {
    subscriptions: {
      retrieve: calls.retrieveSubscription,
      update: calls.updateSubscription,
    },
    prices: { list: calls.listPrices },
    paymentIntents: { retrieve: calls.retrievePaymentIntent },
    invoices: { createPreview: calls.createInvoicePreview },
    subscriptionSchedules: {
      create: calls.createSchedule,
      update: calls.updateSchedule,
      release: calls.releaseSchedule,
      retrieve: calls.retrieveSchedule,
    },
  } as unknown as Stripe;

  const holdForPayment = (
    status: Stripe.PaymentIntent.Status,
    { hasConfirmationSecret = true } = {},
  ) => {
    calls.updateSubscription.mockResolvedValue({
      ...subscription,
      pending_update: { expires_at: MOCK_PERIOD_END },
      latest_invoice: {
        id: MOCK_STRIPE_INVOICE_ID,
        confirmation_secret: hasConfirmationSecret
          ? { client_secret: MOCK_PAYMENT_CLIENT_SECRET }
          : null,
        payments: MOCK_INVOICE_PAYMENTS,
      },
    });
    calls.retrievePaymentIntent.mockResolvedValue({ status });
  };

  return { stripe, holdForPayment, ...calls };
};

export const mockStripeClientWithSubscription = (
  overrides: TMockStripeSubscription = {},
) => {
  const client = mockStripePlanChangeClient(mockStripeSubscription(overrides));
  vi.mocked(getStripeClient).mockReturnValue(client.stripe);
  return client;
};
