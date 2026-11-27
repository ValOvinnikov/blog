import {
  STRIPE_INVOICE_PAYMENTS_EXPAND,
  STRIPE_PAYMENT_INTENT_STATUS,
} from '@platform/constants/stripe-payment';
import {
  MOCK_INVOICE_PAYMENTS,
  MOCK_PAYMENT_INTENT_ID,
  MOCK_STRIPE_INVOICE_ID,
  mockStripeInvoice,
} from '@platform/testing/billing/fixtures';
import type Stripe from 'stripe';

import { invoiceWasDeclined } from './invoice-was-declined';

const { retrieveInvoiceMock, retrievePaymentIntentMock } = vi.hoisted(() => ({
  retrieveInvoiceMock: vi.fn(),
  retrievePaymentIntentMock: vi.fn(),
}));
const MOCK_STRIPE = {
  invoices: { retrieve: retrieveInvoiceMock },
  paymentIntents: { retrieve: retrievePaymentIntentMock },
} as unknown as Stripe;

const MOCK_NO_PAYMENTS = { data: [] };

const invoiceWithPayments = (payments: { data: unknown[] }) =>
  mockStripeInvoice({ payments } as unknown as Partial<Stripe.Invoice>);

const wasDeclined = () =>
  invoiceWasDeclined(MOCK_STRIPE, MOCK_STRIPE_INVOICE_ID);

describe(invoiceWasDeclined, () => {
  beforeEach(() => {
    retrieveInvoiceMock.mockResolvedValue(
      invoiceWithPayments(MOCK_INVOICE_PAYMENTS),
    );
  });

  it("is true when the invoice's payment needs another payment method", async () => {
    retrievePaymentIntentMock.mockResolvedValue({
      status: STRIPE_PAYMENT_INTENT_STATUS.REQUIRES_PAYMENT_METHOD,
    });

    await expect(wasDeclined()).resolves.toBe(true);
    expect(retrieveInvoiceMock).toHaveBeenCalledWith(MOCK_STRIPE_INVOICE_ID, {
      expand: STRIPE_INVOICE_PAYMENTS_EXPAND,
    });
    expect(retrievePaymentIntentMock).toHaveBeenCalledWith(
      MOCK_PAYMENT_INTENT_ID,
    );
  });

  it.each([
    STRIPE_PAYMENT_INTENT_STATUS.REQUIRES_ACTION,
    STRIPE_PAYMENT_INTENT_STATUS.SUCCEEDED,
  ])('is false for a payment that is %s', async (status) => {
    retrievePaymentIntentMock.mockResolvedValue({ status });

    await expect(wasDeclined()).resolves.toBe(false);
  });

  it('is false for an invoice with no payment', async () => {
    retrieveInvoiceMock.mockResolvedValue(
      invoiceWithPayments(MOCK_NO_PAYMENTS),
    );

    await expect(wasDeclined()).resolves.toBe(false);
    expect(retrievePaymentIntentMock).not.toHaveBeenCalled();
  });
});
