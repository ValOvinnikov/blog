import {
  BILLING_INVOICE_LIMIT,
  MILLISECONDS_PER_SECOND,
  STRIPE_ERROR_CODE,
  STRIPE_INVOICE_STATUS,
  STRIPE_SUBSCRIPTION_STATUS,
} from '@platform/constants/billing';
import {
  MOCK_HOSTED_INVOICE_URL,
  MOCK_INVOICE_PDF_URL,
  MOCK_STRIPE_CUSTOMER_ID,
  MOCK_STRIPE_INVOICE_ID,
  MOCK_STRIPE_SUBSCRIPTION_ID,
  mockStripeInvoice,
} from '@platform/testing/billing/fixtures';
import {
  MOCK_DRAFT_INVOICE_STATUS,
  MOCK_STRIPE_AMOUNT,
} from '@platform/testing/billing/overview';
import {
  MOCK_CANCEL_AT,
  MOCK_ENDS_AT,
  MOCK_RENEWS_AT,
} from '@platform/testing/billing/plan-subscription';
import { mockStripeSubscription } from '@platform/testing/billing/stripe-subscription';
import Stripe from 'stripe';

import { listBillingInvoices, previewRenewal } from './fetch-stripe-billing';

const {
  autoPagingToArrayMock,
  listMock,
  createPreviewMock,
  retrieveSubscriptionMock,
} = vi.hoisted(() => {
  const autoPagingToArray = vi.fn();
  return {
    autoPagingToArrayMock: autoPagingToArray,
    listMock: vi.fn(() => ({ autoPagingToArray })),
    createPreviewMock: vi.fn(),
    retrieveSubscriptionMock: vi.fn(),
  };
});
const MOCK_STRIPE = {
  invoices: { list: listMock, createPreview: createPreviewMock },
  subscriptions: { retrieve: retrieveSubscriptionMock },
} as unknown as Stripe;

const MOCK_NEXT_ATTEMPT_SECONDS = 1_800_000_000;
const MOCK_CREATED_SECONDS = 1_790_000_000;

const stripeError = (code: string) =>
  Stripe.errors.StripeError.generate({ type: 'invalid_request_error', code });

describe(listBillingInvoices, () => {
  it("lists the customer's invoices up to the limit", async () => {
    autoPagingToArrayMock.mockResolvedValue([]);

    await listBillingInvoices(MOCK_STRIPE, MOCK_STRIPE_CUSTOMER_ID);

    expect(listMock).toHaveBeenCalledWith({
      customer: MOCK_STRIPE_CUSTOMER_ID,
      limit: BILLING_INVOICE_LIMIT,
    });
    expect(autoPagingToArrayMock).toHaveBeenCalledWith({
      limit: BILLING_INVOICE_LIMIT,
    });
  });

  it('maps a finalised invoice to its date, total, status and PDF', async () => {
    const invoice = mockStripeInvoice({ created: MOCK_CREATED_SECONDS });
    autoPagingToArrayMock.mockResolvedValue([invoice]);

    const [listed] = await listBillingInvoices(
      MOCK_STRIPE,
      MOCK_STRIPE_CUSTOMER_ID,
    );

    expect(listed).toEqual({
      id: MOCK_STRIPE_INVOICE_ID,
      issuedAt: new Date(MOCK_CREATED_SECONDS * MILLISECONDS_PER_SECOND),
      amount: MOCK_STRIPE_AMOUNT,
      status: STRIPE_INVOICE_STATUS.PAID,
      url: MOCK_INVOICE_PDF_URL,
    });
  });

  it('links the hosted invoice page when the invoice has no PDF', async () => {
    autoPagingToArrayMock.mockResolvedValue([
      mockStripeInvoice({
        invoice_pdf: null,
        hosted_invoice_url: MOCK_HOSTED_INVOICE_URL,
      }),
    ]);

    const [listed] = await listBillingInvoices(
      MOCK_STRIPE,
      MOCK_STRIPE_CUSTOMER_ID,
    );

    expect(listed?.url).toBe(MOCK_HOSTED_INVOICE_URL);
  });

  it('leaves out draft invoices', async () => {
    autoPagingToArrayMock.mockResolvedValue([
      mockStripeInvoice({ status: MOCK_DRAFT_INVOICE_STATUS }),
      mockStripeInvoice({ status: STRIPE_INVOICE_STATUS.OPEN }),
    ]);

    const listed = await listBillingInvoices(
      MOCK_STRIPE,
      MOCK_STRIPE_CUSTOMER_ID,
    );

    expect(listed.map(({ status }) => status)).toEqual([
      STRIPE_INVOICE_STATUS.OPEN,
    ]);
  });
});

describe(previewRenewal, () => {
  beforeEach(() => {
    retrieveSubscriptionMock.mockResolvedValue(mockStripeSubscription());
  });

  const preview = () =>
    previewRenewal(
      MOCK_STRIPE,
      MOCK_STRIPE_CUSTOMER_ID,
      MOCK_STRIPE_SUBSCRIPTION_ID,
    );

  it("previews the subscription's next invoice", async () => {
    createPreviewMock.mockResolvedValue(
      mockStripeInvoice({ next_payment_attempt: MOCK_NEXT_ATTEMPT_SECONDS }),
    );

    const renewal = await preview();

    expect(createPreviewMock).toHaveBeenCalledWith({
      customer: MOCK_STRIPE_CUSTOMER_ID,
      subscription: MOCK_STRIPE_SUBSCRIPTION_ID,
    });
    expect(renewal).toEqual({
      nextPayment: {
        dueAt: new Date(MOCK_NEXT_ATTEMPT_SECONDS * MILLISECONDS_PER_SECOND),
        amount: MOCK_STRIPE_AMOUNT,
      },
      endsAt: undefined,
    });
  });

  it('dates the payment by the invoice when no attempt is scheduled', async () => {
    createPreviewMock.mockResolvedValue(
      mockStripeInvoice({ created: MOCK_CREATED_SECONDS }),
    );

    const { nextPayment } = await preview();

    expect(nextPayment?.dueAt).toEqual(
      new Date(MOCK_CREATED_SECONDS * MILLISECONDS_PER_SECOND),
    );
  });

  it('finds no next payment when the subscription has no upcoming invoice', async () => {
    createPreviewMock.mockRejectedValue(
      stripeError(STRIPE_ERROR_CODE.INVOICE_UPCOMING_NONE),
    );

    await expect(preview()).resolves.toEqual({
      nextPayment: undefined,
      endsAt: undefined,
    });
  });

  it.each([
    ['has ended', {}],
    ['ended after a Portal cancel', { cancelAt: MOCK_CANCEL_AT }],
    ['ended at its period end', { cancelAtPeriodEnd: true }],
  ])(
    'reads no next payment and no end date when the subscription %s',
    async (_label, overrides) => {
      retrieveSubscriptionMock.mockResolvedValue(
        mockStripeSubscription({
          status: STRIPE_SUBSCRIPTION_STATUS.CANCELED,
          ...overrides,
        }),
      );

      await expect(preview()).resolves.toEqual({
        nextPayment: undefined,
        endsAt: undefined,
      });
      expect(createPreviewMock).not.toHaveBeenCalled();
    },
  );

  it.each([
    ['the Portal cancelled', { cancelAt: MOCK_CANCEL_AT }, MOCK_ENDS_AT],
    ['cancels at period end', { cancelAtPeriodEnd: true }, MOCK_RENEWS_AT],
  ])(
    'reads when a subscription %s ends, with no next payment',
    async (_label, overrides, endsAt) => {
      retrieveSubscriptionMock.mockResolvedValue(
        mockStripeSubscription(overrides),
      );

      await expect(preview()).resolves.toEqual({
        nextPayment: undefined,
        endsAt,
      });
      expect(createPreviewMock).not.toHaveBeenCalled();
    },
  );

  it('rethrows any other failure', async () => {
    const failure = stripeError('rate_limit');
    createPreviewMock.mockRejectedValue(failure);

    await expect(preview()).rejects.toBe(failure);
  });
});
