import { ACTION_OUTCOME } from '@blog/config';
import { TENANT_PLAN, TENANT_STATUS } from '@blog/db/constants';
import { okResult } from '@blog/utils';
import {
  BILLING_INTERVAL,
  BILLING_LOG,
  STRIPE_CHECKOUT_SESSION_ID_TEMPLATE,
  STRIPE_SUBSCRIPTION_STATUS,
  UPGRADE_REFUSAL,
  UPGRADE_SEARCH_PARAM,
} from '@platform/constants/billing';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import {
  MOCK_CHECKOUT_CLIENT_SECRET,
  MOCK_CHECKOUT_SESSION_ID,
  MOCK_STRIPE_CUSTOMER_ID,
} from '@platform/testing/billing/fixtures';
import { mockStripeCheckoutClient } from '@platform/testing/billing/stripe-checkout-client';
import { mockedEnv } from '@platform/testing/env/mocked-env';
import { mockMembership } from '@platform/testing/memberships/fixtures';
import { MOCK_PLATFORM_APP_BASE_URL } from '@platform/testing/owner-email/fixtures';
import {
  MOCK_TENANT_ID,
  mockReadyTenant,
} from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';
import { adminRoutes } from '@platform/utils/routes/routes';

import { createUpgradeCheckoutAction } from './create-upgrade-checkout-action';
import { getStripeClient } from './stripe-client';

vi.mock('@platform/server/auth/require-tenant-membership');

vi.mock('@platform/server/auth/auth');

vi.mock('@platform/utils/env/env');

vi.mock('@blog/db', () => ({
  queries: {
    tenants: { setTenantBilling: vi.fn(async () => okResult({})) },
  },
}));

vi.mock('./stripe-client', () => ({ getStripeClient: vi.fn() }));

const {
  stripe,
  createSession,
  listSubscriptions,
  retrieveCustomer,
  expireSession,
  listSessions,
} = mockStripeCheckoutClient();

const MOCK_MONTHLY = { interval: BILLING_INTERVAL.MONTHLY };

const checkout = (input = MOCK_MONTHLY) =>
  createUpgradeCheckoutAction(MOCK_TENANT_ID, input);

const asSite = (tenant: Parameters<typeof mockReadyTenant>[0]) =>
  vi.mocked(requireTenantMembership).mockResolvedValueOnce({
    tenant: mockReadyTenant({ id: MOCK_TENANT_ID, ...tenant }),
    membership: mockMembership(),
  });

describe(createUpgradeCheckoutAction, () => {
  beforeEach(() => {
    mockedEnv.PLATFORM_APP_BASE_URL = MOCK_PLATFORM_APP_BASE_URL;
    vi.mocked(getStripeClient).mockReturnValue(stripe);
  });

  it("hands back the checkout's client secret for an owner on Free", async () => {
    const result = await checkout();

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.SUCCESS,
      clientSecret: MOCK_CHECKOUT_CLIENT_SECRET,
    });
  });

  it('returns the owner to the Upgrade page with the session id', async () => {
    await checkout();

    const [{ return_url }] = createSession.mock.calls[0] as [
      { return_url: string },
    ];
    expect(return_url).toBe(
      `${MOCK_PLATFORM_APP_BASE_URL}${adminRoutes.dashboardUpgrade()}?${UPGRADE_SEARCH_PARAM.SESSION_ID}=${STRIPE_CHECKOUT_SESSION_ID_TEMPLATE}`,
    );
  });

  it("expires the customer's earlier open checkouts first", async () => {
    listSessions.mockResolvedValueOnce({
      data: [{ id: MOCK_CHECKOUT_SESSION_ID }],
    });

    await checkout();

    expect(expireSession).toHaveBeenCalledWith(MOCK_CHECKOUT_SESSION_ID);
    expect(expireSession.mock.invocationCallOrder[0]).toBeLessThan(
      createSession.mock.invocationCallOrder[0]!,
    );
  });

  it('refuses a site the plan state rules out and opens no checkout', async () => {
    asSite({ plan: TENANT_PLAN.STARTER, status: TENANT_STATUS.ACTIVE });

    const result = await checkout();

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: UPGRADE_REFUSAL.PAID_PLAN,
    });
    expect(createSession).not.toHaveBeenCalled();
  });

  it('refuses a second checkout while a subscription is live', async () => {
    listSubscriptions.mockResolvedValueOnce({
      data: [{ status: STRIPE_SUBSCRIPTION_STATUS.ACTIVE }],
    });

    const result = await checkout();

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: UPGRADE_REFUSAL.SUBSCRIBED,
    });
    expect(createSession).not.toHaveBeenCalled();
  });

  it('rejects an unknown billing period', async () => {
    const result = await checkout({ interval: 'WEEKLY' as never });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {},
    });
  });

  it('fails and logs when Stripe is not configured', async () => {
    vi.mocked(getStripeClient).mockReturnValueOnce(undefined);

    const result = await checkout();

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(vi.mocked(logger).error).toHaveBeenCalledWith(
      BILLING_LOG.CHECKOUT_UNCONFIGURED,
      { tenantId: MOCK_TENANT_ID, hasStripeKey: false, hasBaseUrl: true },
    );
  });

  it("fails and logs when the site's stored customer is gone from Stripe", async () => {
    asSite({ stripeCustomerId: MOCK_STRIPE_CUSTOMER_ID });
    retrieveCustomer.mockResolvedValueOnce({ deleted: true });

    const result = await checkout();

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(vi.mocked(logger).error).toHaveBeenCalledWith(
      BILLING_LOG.CHECKOUT_CUSTOMER_MISSING,
      { tenantId: MOCK_TENANT_ID },
    );
  });

  it('fails and logs when Stripe refuses the session', async () => {
    createSession.mockRejectedValueOnce(new Error());

    const result = await checkout();

    const [event] = vi.mocked(logger).error.mock.calls[0]!;
    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(event).toBe(BILLING_LOG.CHECKOUT_FAILED);
  });
});
