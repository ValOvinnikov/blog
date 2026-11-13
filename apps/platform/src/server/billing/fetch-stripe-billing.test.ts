import {
  BILLING_INVOICE_LIMIT,
  MILLISECONDS_PER_SECOND,
  STRIPE_ERROR_CODE,
  STRIPE_INVOICE_STATUS,
} from '@platform/constants/billing';
import {
  MOCK_AMOUNT_PAID,
  MOCK_HOSTED_INVOICE_URL,
  MOCK_INVOICE_PDF_URL,
  MOCK_STRIPE_CURRENCY,
  MOCK_STRIPE_CUSTOMER_ID,
  MOCK_STRIPE_INVOICE_ID,
  MOCK_STRIPE_SUBSCRIPTION_ID,
  mockStripeInvoice,
} from '@platform/testing/billing/fixtures';
import Stripe from 'stripe';

import {
  listBillingInvoices,
  previewNextPayment,
} from './fetch-stripe-billing';

const { autoPagingToArrayMock, listMock, createPreviewMock } = vi.hoisted(
  () => {
    const autoPagingToArray = vi.fn();
    return {
      autoPagingToArrayMock: autoPagingToArray,
      listMock: vi.fn(() => ({ autoPagingToArray })),
      createPreviewMock: vi.fn(),
    };
  },
);
const MOCK_STRIPE = {
  invoices: { list: listMock, createPreview: createPreviewMock },
} as unknown as Stripe;

const MOCK_NEXT_ATTEMPT_SECONDS = 1_800_000_000;
const MOCK_CREATED_SECONDS = 1_790_000_000;
const MOCK_AMOUNT = {
  minorUnits: MOCK_AMOUNT_PAID,
  currency: MOCK_STRIPE_CURRENCY,
};

const stripeError = (code: string) =>
  Stripe.errors.StripeError.generate({ type: 'invalid_request_error', code });

describe(listBillingInvoices, () => {
  it("lists the customer's invoices up to the limit", async () => {
    autoPagingToArrayMock.mockResolvedValue([]);

    await listBillingInvoices(MOCK_STRIPE, MOCK_STRIPE_CUSTOMER_ID);

    expect(listMock).toHaveBeenCalledWith({
      customer: MOCK_STRIPE_CUSTOMER_ID,
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
      amount: MOCK_AMOUNT,
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
      mockStripeInvoice({ status: STRIPE_INVOICE_STATUS.DRAFT }),
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

describe(previewNextPayment, () => {
  const preview = () =>
    previewNextPayment(
      MOCK_STRIPE,
      MOCK_STRIPE_CUSTOMER_ID,
      MOCK_STRIPE_SUBSCRIPTION_ID,
    );

  it("previews the subscription's next invoice", async () => {
    createPreviewMock.mockResolvedValue(
      mockStripeInvoice({ next_payment_attempt: MOCK_NEXT_ATTEMPT_SECONDS }),
    );

    const nextPayment = await preview();

    expect(createPreviewMock).toHaveBeenCalledWith({
      customer: MOCK_STRIPE_CUSTOMER_ID,
      subscription: MOCK_STRIPE_SUBSCRIPTION_ID,
    });
    expect(nextPayment).toEqual({
      dueAt: new Date(MOCK_NEXT_ATTEMPT_SECONDS * MILLISECONDS_PER_SECOND),
      amount: MOCK_AMOUNT,
    });
  });

  it('dates the payment by the invoice when no attempt is scheduled', async () => {
    createPreviewMock.mockResolvedValue(
      mockStripeInvoice({ created: MOCK_CREATED_SECONDS }),
    );

    const nextPayment = await preview();

    expect(nextPayment?.dueAt).toEqual(
      new Date(MOCK_CREATED_SECONDS * MILLISECONDS_PER_SECOND),
    );
  });

  it('finds no next payment when the subscription has no upcoming invoice', async () => {
    createPreviewMock.mockRejectedValue(
      stripeError(STRIPE_ERROR_CODE.INVOICE_UPCOMING_NONE),
    );

    await expect(preview()).resolves.toBeUndefined();
  });

  it('rethrows any other failure', async () => {
    const failure = stripeError('rate_limit');
    createPreviewMock.mockRejectedValue(failure);

    await expect(preview()).rejects.toBe(failure);
  });
});
