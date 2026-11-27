import { STRIPE_PAYMENT_INTENT_STATUS } from '@platform/constants/stripe-payment';
import {
  MOCK_INVOICE_PAYMENTS,
  MOCK_PAYMENT_INTENT_ID,
  MOCK_STRIPE_INVOICE_ID,
  mockStripeInvoice,
} from '@platform/testing/billing/fixtures';
import type Stripe from 'stripe';

import { invoiceAwaitsAuthentication } from './invoice-awaits-authentication';

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

const awaits = () =>
  invoiceAwaitsAuthentication(MOCK_STRIPE, MOCK_STRIPE_INVOICE_ID);

describe(invoiceAwaitsAuthentication, () => {
  beforeEach(() => {
    retrieveInvoiceMock.mockResolvedValue(
      invoiceWithPayments(MOCK_INVOICE_PAYMENTS),
    );
  });

  it("is true while the invoice's payment waits on the bank's check", async () => {
    retrievePaymentIntentMock.mockResolvedValue({
      status: STRIPE_PAYMENT_INTENT_STATUS.REQUIRES_ACTION,
    });

    await expect(awaits()).resolves.toBe(true);
    expect(retrieveInvoiceMock).toHaveBeenCalledWith(MOCK_STRIPE_INVOICE_ID, {
      expand: ['payments'],
    });
    expect(retrievePaymentIntentMock).toHaveBeenCalledWith(
      MOCK_PAYMENT_INTENT_ID,
    );
  });

  it('is false for a declined payment', async () => {
    retrievePaymentIntentMock.mockResolvedValue({
      status: STRIPE_PAYMENT_INTENT_STATUS.REQUIRES_PAYMENT_METHOD,
    });

    await expect(awaits()).resolves.toBe(false);
  });

  it('is false for an invoice with no payment', async () => {
    retrieveInvoiceMock.mockResolvedValue(
      invoiceWithPayments(MOCK_NO_PAYMENTS),
    );

    await expect(awaits()).resolves.toBe(false);
    expect(retrievePaymentIntentMock).not.toHaveBeenCalled();
  });
});
