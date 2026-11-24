import { faker } from '@faker-js/faker';
import {
  BILLING_LOG,
  STRIPE_INVOICE_STATUS,
} from '@platform/constants/billing';
import { requireTenantOwnerOrAdmin } from '@platform/server/auth/require-tenant-owner-or-admin';
import { getStripeClient } from '@platform/server/billing/stripe-client';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import {
  MOCK_HOSTED_INVOICE_URL,
  MOCK_STRIPE_SUBSCRIPTION_ID,
  mockStripeInvoice,
} from '@platform/testing/billing/fixtures';
import { MOCK_PAYING_TENANT_BILLING } from '@platform/testing/billing/overview';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';
import { adminRoutes } from '@platform/utils/routes/routes';
import { ACTION_OUTCOME, NEXT_NAVIGATION_ERROR } from '@shinefold/config';
import { queries } from '@shinefold/db';
import { ADMIN_ROLE } from '@shinefold/db/constants';
import { MOCK_EMPTY_TENANT_BILLING } from '@shinefold/db/testing/tenants/billing';
import { redirect } from 'next/navigation';
import type Stripe from 'stripe';

import { payOpenInvoiceAction } from './pay-open-invoice-action';

vi.mock('@platform/server/auth/require-tenant-owner-or-admin');
vi.mock('@platform/server/billing/stripe-client');
vi.mock('@shinefold/db', () => ({
  queries: {
    tenants: { getTenantBilling: vi.fn() },
  },
}));

faker.seed(7935);

const { listInvoicesMock } = vi.hoisted(() => ({
  listInvoicesMock: vi.fn(),
}));
const MOCK_STRIPE = {
  invoices: { list: listInvoicesMock },
} as unknown as Stripe;
const MOCK_LIST_FAILURE = new Error(faker.lorem.sentence());
const SERVER_ERROR = { outcome: ACTION_OUTCOME.SERVER_ERROR };

const getTenantBillingMock = vi.mocked(queries.tenants.getTenantBilling);
const requireTenantOwnerOrAdminMock = vi.mocked(requireTenantOwnerOrAdmin);
const getStripeClientMock = vi.mocked(getStripeClient);

const listOpenInvoices = (invoices: Stripe.Invoice[]) =>
  listInvoicesMock.mockResolvedValue({ data: invoices });

const pay = () => payOpenInvoiceAction(MOCK_TENANT_ID);

describe(payOpenInvoiceAction, () => {
  beforeEach(() => {
    getTenantBillingMock.mockResolvedValue(MOCK_PAYING_TENANT_BILLING);
    getStripeClientMock.mockReturnValue(MOCK_STRIPE);
    listOpenInvoices([
      mockStripeInvoice({
        status: STRIPE_INVOICE_STATUS.OPEN,
        hosted_invoice_url: MOCK_HOSTED_INVOICE_URL,
      }),
    ]);
  });

  it("sends the owner to the open invoice's payment page", async () => {
    await expect(pay()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(listInvoicesMock).toHaveBeenCalledWith({
      subscription: MOCK_STRIPE_SUBSCRIPTION_ID,
      status: STRIPE_INVOICE_STATUS.OPEN,
      limit: 1,
    });
    expect(redirect).toHaveBeenCalledWith(MOCK_HOSTED_INVOICE_URL);
  });

  it.each([ADMIN_ROLE.SUPERADMIN, ADMIN_ROLE.MODERATOR])(
    'lets the gate admit only the owner, never a %s',
    async (role) => {
      await pay().catch(() => undefined);

      const [tenantId, isAdminPermitted] =
        requireTenantOwnerOrAdminMock.mock.calls[0] ?? [];

      expect(tenantId).toBe(MOCK_TENANT_ID);
      expect(isAdminPermitted?.(mockAdmin({ role }))).toBe(false);
    },
  );

  it('opens nothing for a viewer the gate turns away', async () => {
    requireTenantOwnerOrAdminMock.mockRejectedValueOnce(
      new Error(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND),
    );

    await expect(pay()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(listInvoicesMock).not.toHaveBeenCalled();
  });

  it('fails an id that is not a site without reaching the gate', async () => {
    const result = await payOpenInvoiceAction(faker.lorem.word());

    expect(result).toEqual(SERVER_ERROR);
    expect(getTenantBillingMock).not.toHaveBeenCalled();
  });

  it.each([
    [
      'no subscription',
      () => getTenantBillingMock.mockResolvedValue(MOCK_EMPTY_TENANT_BILLING),
    ],
    ['no open invoice', () => listOpenInvoices([])],
    [
      'an open invoice with no payment page',
      () =>
        listOpenInvoices([
          mockStripeInvoice({ status: STRIPE_INVOICE_STATUS.OPEN }),
        ]),
    ],
  ])('sends the owner to the Billing page for %s', async (_label, arrange) => {
    arrange();

    await expect(pay()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(redirect).toHaveBeenCalledWith(adminRoutes.dashboardBilling());
  });

  it('fails and logs when the billing key is unset', async () => {
    getStripeClientMock.mockReturnValue(undefined);

    const result = await pay();

    expect(result).toEqual(SERVER_ERROR);
    expect(logger.error).toHaveBeenCalledWith(BILLING_LOG.STRIPE_UNCONFIGURED, {
      tenantId: MOCK_TENANT_ID,
    });
  });

  it('fails and logs when the open invoice cannot be read', async () => {
    listInvoicesMock.mockRejectedValue(MOCK_LIST_FAILURE);

    const result = await pay();

    expect(result).toEqual(SERVER_ERROR);
    expect(redirect).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      BILLING_LOG.OPEN_INVOICE_FAILED,
      expect.objectContaining({ tenantId: MOCK_TENANT_ID }),
    );
  });
});
