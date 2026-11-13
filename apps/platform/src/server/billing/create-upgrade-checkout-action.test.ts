import { ACTION_OUTCOME } from '@blog/config';
import { TENANT_PLAN } from '@blog/config/constants';
import { STRIPE_PRICE_LOOKUP_KEY, TENANT_STATUS } from '@blog/db/constants';
import { okResult } from '@blog/utils';
import {
  BILLING_INTERVAL,
  BILLING_LOG,
  STRIPE_CHECKOUT_SESSION_ID_TEMPLATE,
  STRIPE_SUBSCRIPTION_STATUS,
  UPGRADE_PAYMENT,
  UPGRADE_STATE,
  UPGRADE_SEARCH_PARAM,
} from '@platform/constants/billing';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import {
  MOCK_CHECKOUT_CLIENT_SECRET,
  MOCK_CHECKOUT_SESSION_ID,
  MOCK_STRIPE_SUBSCRIPTION_ID,
} from '@platform/testing/billing/fixtures';
import { mockStripeCheckoutClient } from '@platform/testing/billing/stripe-checkout-client';
import { mockedEnv } from '@platform/testing/env/mocked-env';
import { mockMembership } from '@platform/testing/memberships/fixtures';
import { MOCK_PLATFORM_APP_BASE_URL } from '@platform/testing/owner-email/fixtures';
import {
  MOCK_TENANT_ID,
  mockReadyTenant,
} from '@platform/testing/tenants/fixtures';
import { MOCK_TRIAL_ENDS_AT } from '@platform/testing/tenants/mock-tenant';
import { logger } from '@platform/utils/logger/logger';
import { adminRoutes } from '@platform/utils/routes/routes';

import { createUpgradeCheckoutAction } from './create-upgrade-checkout-action';
import { getStripeClient } from './stripe-client';
import type { TUpgradeCheckoutInput } from './upgrade-checkout-input';

vi.mock('@platform/server/auth/require-tenant-membership');

vi.mock('@platform/server/auth/auth');

vi.mock('@platform/utils/env/env');

vi.mock('@blog/db', () => ({
  queries: {
    tenants: { setTenantBilling: vi.fn(async () => okResult({})) },
  },
}));

vi.mock('./stripe-client');

const {
  stripe,
  listPrices,
  createSession,
  listSubscriptions,
  expireSession,
  listSessions,
} = mockStripeCheckoutClient();

const MOCK_MONTHLY: TUpgradeCheckoutInput = {
  plan: TENANT_PLAN.GROWTH,
  interval: BILLING_INTERVAL.MONTHLY,
};
const MOCK_FREE_SITE = {};
const MOCK_TRIAL_SITE = {
  plan: TENANT_PLAN.GROWTH,
  status: TENANT_STATUS.TRIAL,
  trialEndsAt: MOCK_TRIAL_ENDS_AT,
};

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

  it.each([
    [
      'Free',
      MOCK_FREE_SITE,
      TENANT_PLAN.STARTER,
      BILLING_INTERVAL.MONTHLY,
      STRIPE_PRICE_LOOKUP_KEY.STARTER_MONTHLY,
    ],
    [
      'Free',
      MOCK_FREE_SITE,
      TENANT_PLAN.STARTER,
      BILLING_INTERVAL.YEARLY,
      STRIPE_PRICE_LOOKUP_KEY.STARTER_YEARLY,
    ],
    [
      'Free',
      MOCK_FREE_SITE,
      TENANT_PLAN.GROWTH,
      BILLING_INTERVAL.MONTHLY,
      STRIPE_PRICE_LOOKUP_KEY.GROWTH_MONTHLY,
    ],
    [
      'Free',
      MOCK_FREE_SITE,
      TENANT_PLAN.GROWTH,
      BILLING_INTERVAL.YEARLY,
      STRIPE_PRICE_LOOKUP_KEY.GROWTH_YEARLY,
    ],
    [
      'trial',
      MOCK_TRIAL_SITE,
      TENANT_PLAN.STARTER,
      BILLING_INTERVAL.MONTHLY,
      STRIPE_PRICE_LOOKUP_KEY.STARTER_MONTHLY,
    ],
    [
      'trial',
      MOCK_TRIAL_SITE,
      TENANT_PLAN.STARTER,
      BILLING_INTERVAL.YEARLY,
      STRIPE_PRICE_LOOKUP_KEY.STARTER_YEARLY,
    ],
    [
      'trial',
      MOCK_TRIAL_SITE,
      TENANT_PLAN.GROWTH,
      BILLING_INTERVAL.MONTHLY,
      STRIPE_PRICE_LOOKUP_KEY.GROWTH_MONTHLY,
    ],
    [
      'trial',
      MOCK_TRIAL_SITE,
      TENANT_PLAN.GROWTH,
      BILLING_INTERVAL.YEARLY,
      STRIPE_PRICE_LOOKUP_KEY.GROWTH_YEARLY,
    ],
  ])(
    'lets a %s owner buy %s %s',
    async (_, site, plan, interval, lookupKey) => {
      asSite(site);

      const result = await checkout({ plan, interval });

      const [{ lookup_keys }] = listPrices.mock.calls[0] as [
        { lookup_keys: string[] },
      ];
      expect(result.outcome).toBe(ACTION_OUTCOME.SUCCESS);
      expect(lookup_keys).toEqual([lookupKey]);
    },
  );

  it('refuses a site with a live subscription and opens no checkout', async () => {
    asSite({
      plan: TENANT_PLAN.STARTER,
      stripeSubscriptionId: MOCK_STRIPE_SUBSCRIPTION_ID,
    });

    const result = await checkout();

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: UPGRADE_STATE.SUBSCRIBED,
    });
    expect(createSession).not.toHaveBeenCalled();
  });

  it('refuses a second checkout while Stripe already has a live subscription', async () => {
    listSubscriptions.mockResolvedValueOnce({
      data: [{ status: STRIPE_SUBSCRIPTION_STATUS.ACTIVE }],
    });

    const result = await checkout();

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: UPGRADE_PAYMENT.PAYMENT_PENDING,
    });
    expect(createSession).not.toHaveBeenCalled();
  });

  it('rejects the Free plan, which is not for sale', async () => {
    const result = await checkout({
      ...MOCK_MONTHLY,
      // @ts-expect-error -- Free is deliberately not a sellable plan
      plan: TENANT_PLAN.FREE,
    });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {},
    });
  });

  it('rejects an unknown billing period', async () => {
    const result = await checkout({
      ...MOCK_MONTHLY,
      interval: 'WEEKLY' as never,
    });

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

  it('fails and logs when Stripe refuses the session', async () => {
    createSession.mockRejectedValueOnce(new Error());

    const result = await checkout();

    const [event] = vi.mocked(logger).error.mock.calls[0]!;
    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(event).toBe(BILLING_LOG.CHECKOUT_FAILED);
  });
});
