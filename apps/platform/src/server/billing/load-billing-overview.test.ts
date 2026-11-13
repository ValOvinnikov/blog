import { MOCK_EMPTY_TENANT_BILLING } from '@blog/db/testing/tenants/billing';
import { faker } from '@faker-js/faker';
import {
  BILLING_LOG,
  BILLING_OVERVIEW_STATE,
} from '@platform/constants/billing';
import {
  listBillingInvoices,
  previewNextPayment,
  type TBillingInvoice,
} from '@platform/server/billing/fetch-stripe-billing';
import { getStripeClient } from '@platform/server/billing/stripe-client';
import {
  MOCK_STRIPE_CLIENT,
  MOCK_STRIPE_CUSTOMER_ID,
  MOCK_STRIPE_SUBSCRIPTION_ID,
} from '@platform/testing/billing/fixtures';
import {
  MOCK_NEXT_PAYMENT,
  MOCK_PAYING_TENANT_BILLING,
} from '@platform/testing/billing/overview';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';

import { loadBillingOverview } from './load-billing-overview';

vi.mock('@platform/server/billing/stripe-client');
vi.mock('@platform/server/billing/fetch-stripe-billing', () => ({
  listBillingInvoices: vi.fn(),
  previewNextPayment: vi.fn(),
}));

faker.seed(6878);

const MOCK_INVOICES: TBillingInvoice[] = [];
const MOCK_STRIPE_FAILURE = new Error(faker.lorem.sentence());

const getStripeClientMock = vi.mocked(getStripeClient);
const listBillingInvoicesMock = vi.mocked(listBillingInvoices);
const previewNextPaymentMock = vi.mocked(previewNextPayment);

const loadPaying = () =>
  loadBillingOverview(MOCK_TENANT_ID, MOCK_PAYING_TENANT_BILLING);

describe(loadBillingOverview, () => {
  beforeEach(() => {
    getStripeClientMock.mockReturnValue(MOCK_STRIPE_CLIENT);
    listBillingInvoicesMock.mockResolvedValue(MOCK_INVOICES);
    previewNextPaymentMock.mockResolvedValue(MOCK_NEXT_PAYMENT);
  });

  it('reads nothing from billing for a site with no billing account', async () => {
    const overview = await loadBillingOverview(
      MOCK_TENANT_ID,
      MOCK_EMPTY_TENANT_BILLING,
    );

    expect(overview).toEqual({ state: BILLING_OVERVIEW_STATE.NO_CUSTOMER });
    expect(listBillingInvoicesMock).not.toHaveBeenCalled();
  });

  it("loads a paying site's invoices and next payment", async () => {
    const overview = await loadPaying();

    expect(listBillingInvoicesMock).toHaveBeenCalledWith(
      MOCK_STRIPE_CLIENT,
      MOCK_STRIPE_CUSTOMER_ID,
    );
    expect(previewNextPaymentMock).toHaveBeenCalledWith(
      MOCK_STRIPE_CLIENT,
      MOCK_STRIPE_CUSTOMER_ID,
      MOCK_STRIPE_SUBSCRIPTION_ID,
    );
    expect(overview).toEqual({
      state: BILLING_OVERVIEW_STATE.LOADED,
      nextPayment: MOCK_NEXT_PAYMENT,
      invoices: MOCK_INVOICES,
    });
  });

  it('lists invoices with no next payment for a site with no subscription', async () => {
    const overview = await loadBillingOverview(MOCK_TENANT_ID, {
      ...MOCK_PAYING_TENANT_BILLING,
      stripeSubscriptionId: undefined,
    });

    expect(previewNextPaymentMock).not.toHaveBeenCalled();
    expect(overview).toEqual({
      state: BILLING_OVERVIEW_STATE.LOADED,
      nextPayment: undefined,
      invoices: MOCK_INVOICES,
    });
  });

  it('keeps the invoices and logs when the next payment cannot be read', async () => {
    previewNextPaymentMock.mockRejectedValue(MOCK_STRIPE_FAILURE);

    const overview = await loadPaying();

    expect(overview).toEqual({
      state: BILLING_OVERVIEW_STATE.LOADED,
      nextPayment: undefined,
      invoices: MOCK_INVOICES,
    });
    expect(logger.error).toHaveBeenCalledWith(
      BILLING_LOG.NEXT_PAYMENT_FAILED,
      expect.objectContaining({ tenantId: MOCK_TENANT_ID }),
    );
  });

  it('reports billing unavailable and logs when the key is unset', async () => {
    getStripeClientMock.mockReturnValue(undefined);

    const overview = await loadPaying();

    expect(overview).toEqual({ state: BILLING_OVERVIEW_STATE.UNAVAILABLE });
    expect(logger.error).toHaveBeenCalledWith(BILLING_LOG.STRIPE_UNCONFIGURED, {
      tenantId: MOCK_TENANT_ID,
    });
  });

  it('reports billing unavailable and logs when the invoices cannot be read', async () => {
    listBillingInvoicesMock.mockRejectedValue(MOCK_STRIPE_FAILURE);

    const overview = await loadPaying();

    expect(overview).toEqual({ state: BILLING_OVERVIEW_STATE.UNAVAILABLE });
    expect(logger.error).toHaveBeenCalledWith(
      BILLING_LOG.OVERVIEW_FAILED,
      expect.objectContaining({ tenantId: MOCK_TENANT_ID }),
    );
  });
});
