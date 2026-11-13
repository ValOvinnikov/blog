import { ACTION_OUTCOME, type TMaybeNull } from '@blog/config';
import {
  MEMBERSHIP_ROLE,
  TENANT_PLAN,
  TENANT_STATUS,
} from '@blog/db/constants';
import {
  BILLING_INTERVAL,
  BILLING_LOG,
  STRIPE_CHECKOUT_SESSION_ID_TEMPLATE,
  UPGRADE_SEARCH_PARAM,
  UPGRADE_STATE,
} from '@platform/constants/billing';
import { auth } from '@platform/server/auth/auth';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { MOCK_SIGN_IN_USER_ID } from '@platform/testing/auth/fixtures';
import {
  MOCK_CHECKOUT_CLIENT_SECRET,
  MOCK_STRIPE_PRICE_ID,
} from '@platform/testing/billing/fixtures';
import { mockedEnv } from '@platform/testing/env/mocked-env';
import { mockMembership } from '@platform/testing/memberships/fixtures';
import { MOCK_PLATFORM_APP_BASE_URL } from '@platform/testing/owner-email/fixtures';
import {
  MOCK_OWNER_EMAIL,
  MOCK_TENANT_ID,
  mockReadyTenant,
} from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';
import { adminRoutes } from '@platform/utils/routes/routes';
import type { Session } from 'next-auth';
import type Stripe from 'stripe';

import { createUpgradeCheckoutAction } from './create-upgrade-checkout-action';
import { getStripeClient } from './stripe-client';

vi.mock('@platform/server/auth/require-tenant-membership');

vi.mock('@platform/server/auth/auth');

vi.mock('@platform/utils/env/env');

vi.mock('./stripe-client', () => ({ getStripeClient: vi.fn() }));

const { createSessionMock } = vi.hoisted(() => ({
  createSessionMock: vi.fn(),
}));

const MOCK_STRIPE = {
  prices: {
    list: vi.fn(async () => ({ data: [{ id: MOCK_STRIPE_PRICE_ID }] })),
  },
  promotionCodes: { list: vi.fn(async () => ({ data: [] })) },
  checkout: { sessions: { create: createSessionMock } },
} as unknown as Stripe;

const authMock = vi.mocked<() => Promise<TMaybeNull<Partial<Session>>>>(auth);
const MONTHLY = { interval: BILLING_INTERVAL.MONTHLY };

const checkout = (input = MONTHLY) =>
  createUpgradeCheckoutAction(MOCK_TENANT_ID, input);

const asSite = (
  tenant: Parameters<typeof mockReadyTenant>[0],
  membership = mockMembership(),
) =>
  vi.mocked(requireTenantMembership).mockResolvedValueOnce({
    tenant: mockReadyTenant({ id: MOCK_TENANT_ID, ...tenant }),
    membership,
  });

describe(createUpgradeCheckoutAction, () => {
  beforeEach(() => {
    mockedEnv.PLATFORM_APP_BASE_URL = MOCK_PLATFORM_APP_BASE_URL;
    vi.mocked(getStripeClient).mockReturnValue(MOCK_STRIPE);
    authMock.mockResolvedValue({
      user: { id: MOCK_SIGN_IN_USER_ID, email: MOCK_OWNER_EMAIL },
      expires: '2099-01-01T00:00:00.000Z',
    });
    createSessionMock.mockResolvedValue({
      client_secret: MOCK_CHECKOUT_CLIENT_SECRET,
    });
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

    const [{ return_url, customer_email }] = createSessionMock.mock.calls[0]!;
    expect(return_url).toBe(
      `${MOCK_PLATFORM_APP_BASE_URL}${adminRoutes.dashboardUpgrade()}?${UPGRADE_SEARCH_PARAM.SESSION_ID}=${STRIPE_CHECKOUT_SESSION_ID_TEMPLATE}`,
    );
    expect(customer_email).toBe(MOCK_OWNER_EMAIL);
  });

  it('opens checkout for an owner on a trial', async () => {
    asSite({ plan: TENANT_PLAN.GROWTH, status: TENANT_STATUS.TRIAL });

    const result = await checkout();

    expect(result.outcome).toBe(ACTION_OUTCOME.SUCCESS);
  });

  it.each([
    [UPGRADE_STATE.ON_GROWTH, { plan: TENANT_PLAN.GROWTH }, undefined],
    [UPGRADE_STATE.PAID_PLAN, { plan: TENANT_PLAN.STARTER }, undefined],
    [UPGRADE_STATE.UNAVAILABLE, { status: TENANT_STATUS.SUSPENDED }, undefined],
    [
      UPGRADE_STATE.NOT_OWNER,
      {},
      mockMembership({ role: MEMBERSHIP_ROLE.EDITOR }),
    ],
  ])(
    'refuses with %s and opens no checkout',
    async (reason, tenant, member) => {
      asSite(tenant, member);

      const result = await checkout();

      expect(result).toEqual({ outcome: ACTION_OUTCOME.REFUSED, reason });
      expect(createSessionMock).not.toHaveBeenCalled();
    },
  );

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

  it('fails and logs when Stripe refuses the session', async () => {
    createSessionMock.mockRejectedValueOnce(new Error());

    const result = await checkout();

    const [event] = vi.mocked(logger).error.mock.calls[0]!;
    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(event).toBe(BILLING_LOG.CHECKOUT_FAILED);
  });
});
