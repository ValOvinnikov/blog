import { TENANT_PLAN } from '@blog/db/constants';
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
  MOCK_PAYING_TENANT_BILLING,
  MOCK_STRIPE_CLIENT,
  MOCK_STRIPE_CUSTOMER_ID,
  MOCK_STRIPE_SUBSCRIPTION_ID,
} from '@platform/testing/billing/fixtures';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';

import { loadBillingOverview } from './load-billing-overview';

vi.mock('@platform/server/billing/stripe-client', () => ({
  getStripeClient: vi.fn(),
}));
vi.mock('@platform/server/billing/fetch-stripe-billing', () => ({
  listBillingInvoices: vi.fn(),
  previewNextPayment: vi.fn(),
}));

faker.seed(6878);

const MOCK_INVOICES: TBillingInvoice[] = [];
const MOCK_NEXT_PAYMENT = {
  dueAt: faker.date.soon(),
  amount: {
    minorUnits: faker.number.int(),
    currency: faker.finance.currencyCode(),
  },
};
const MOCK_STRIPE_FAILURE = new Error(faker.lorem.sentence());

const getStripeClientMock = vi.mocked(getStripeClient);
const listBillingInvoicesMock = vi.mocked(listBillingInvoices);
const previewNextPaymentMock = vi.mocked(previewNextPayment);

describe(loadBillingOverview, () => {
  beforeEach(() => {
    getStripeClientMock.mockReturnValue(MOCK_STRIPE_CLIENT);
    listBillingInvoicesMock.mockResolvedValue(MOCK_INVOICES);
    previewNextPaymentMock.mockResolvedValue(MOCK_NEXT_PAYMENT);
  });

  it('reads nothing from billing for a site with no billing account', async () => {
    const overview = await loadBillingOverview(
      MOCK_TENANT_ID,
      TENANT_PLAN.FREE,
      MOCK_EMPTY_TENANT_BILLING,
    );

    expect(overview).toEqual({ state: BILLING_OVERVIEW_STATE.NO_CUSTOMER });
    expect(listBillingInvoicesMock).not.toHaveBeenCalled();
  });

  it("loads a paying site's invoices and next payment", async () => {
    const overview = await loadBillingOverview(
      MOCK_TENANT_ID,
      TENANT_PLAN.GROWTH,
      MOCK_PAYING_TENANT_BILLING,
    );

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

  it.each([
    ['is back on Free', TENANT_PLAN.FREE, MOCK_PAYING_TENANT_BILLING],
    [
      'has no subscription',
      TENANT_PLAN.GROWTH,
      { ...MOCK_PAYING_TENANT_BILLING, stripeSubscriptionId: undefined },
    ],
  ])(
    'lists invoices with no next payment for a site that %s',
    async (_label, plan, billing) => {
      const overview = await loadBillingOverview(MOCK_TENANT_ID, plan, billing);

      expect(previewNextPaymentMock).not.toHaveBeenCalled();
      expect(overview).toEqual({
        state: BILLING_OVERVIEW_STATE.LOADED,
        nextPayment: undefined,
        invoices: MOCK_INVOICES,
      });
    },
  );

  it('reports billing unavailable and logs when the key is unset', async () => {
    getStripeClientMock.mockReturnValue(undefined);

    const overview = await loadBillingOverview(
      MOCK_TENANT_ID,
      TENANT_PLAN.GROWTH,
      MOCK_PAYING_TENANT_BILLING,
    );

    expect(overview).toEqual({ state: BILLING_OVERVIEW_STATE.UNAVAILABLE });
    expect(logger.error).toHaveBeenCalledWith(BILLING_LOG.STRIPE_UNCONFIGURED, {
      tenantId: MOCK_TENANT_ID,
    });
  });

  it('reports billing unavailable and logs when a read fails', async () => {
    listBillingInvoicesMock.mockRejectedValue(MOCK_STRIPE_FAILURE);

    const overview = await loadBillingOverview(
      MOCK_TENANT_ID,
      TENANT_PLAN.GROWTH,
      MOCK_PAYING_TENANT_BILLING,
    );

    expect(overview).toEqual({ state: BILLING_OVERVIEW_STATE.UNAVAILABLE });
    expect(logger.error).toHaveBeenCalledWith(
      BILLING_LOG.OVERVIEW_FAILED,
      expect.objectContaining({ tenantId: MOCK_TENANT_ID }),
    );
  });
});
