import { ACTION_OUTCOME, NEXT_NAVIGATION_ERROR } from '@blog/config';
import { queries } from '@blog/db';
import { ADMIN_ROLE, MEMBERSHIP_ROLE } from '@blog/db/constants';
import { MOCK_EMPTY_TENANT_BILLING } from '@blog/db/testing/tenants/billing';
import { faker } from '@faker-js/faker';
import { BILLING_LOG, BILLING_REFUSAL } from '@platform/constants/billing';
import { getStripeClient } from '@platform/server/billing/stripe-client';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import { MOCK_SIGN_IN_USER_ID } from '@platform/testing/auth/fixtures';
import {
  MOCK_BILLING_PORTAL_URL,
  MOCK_STRIPE_CUSTOMER_ID,
} from '@platform/testing/billing/fixtures';
import { MOCK_PAYING_TENANT_BILLING } from '@platform/testing/billing/overview';
import { mockedEnv } from '@platform/testing/env/mocked-env';
import { mockMembership } from '@platform/testing/memberships/fixtures';
import { MOCK_PLATFORM_APP_BASE_URL } from '@platform/testing/owner-email/fixtures';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';
import { adminRoutes } from '@platform/utils/routes/routes';
import { redirect } from 'next/navigation';
import type Stripe from 'stripe';

import { openBillingPortalAction } from './open-billing-portal-action';

vi.mock('@platform/utils/env/env');
vi.mock('@platform/server/auth/require-session-user-id', () => ({
  requireSessionUserId: vi.fn(async () => MOCK_SIGN_IN_USER_ID),
}));
vi.mock('@platform/server/billing/stripe-client');
vi.mock('@blog/db', () => ({
  queries: {
    tenants: { getTenantBilling: vi.fn() },
    admins: { getAdminByUserId: vi.fn() },
    memberships: { getMembership: vi.fn() },
  },
}));

faker.seed(6879);

const { createPortalSessionMock } = vi.hoisted(() => ({
  createPortalSessionMock: vi.fn(),
}));
const MOCK_STRIPE = {
  billingPortal: { sessions: { create: createPortalSessionMock } },
} as unknown as Stripe;
const MOCK_PORTAL_FAILURE = new Error(faker.lorem.sentence());
const NO_CUSTOMER = {
  outcome: ACTION_OUTCOME.REFUSED,
  reason: BILLING_REFUSAL.NO_CUSTOMER,
};

const getTenantBillingMock = vi.mocked(queries.tenants.getTenantBilling);
const getAdminByUserIdMock = vi.mocked(queries.admins.getAdminByUserId);
const getMembershipMock = vi.mocked(queries.memberships.getMembership);
const getStripeClientMock = vi.mocked(getStripeClient);

const openPortal = () => openBillingPortalAction(MOCK_TENANT_ID);

describe(openBillingPortalAction, () => {
  beforeEach(() => {
    mockedEnv.PLATFORM_APP_BASE_URL = MOCK_PLATFORM_APP_BASE_URL;
    getAdminByUserIdMock.mockResolvedValue(undefined);
    getMembershipMock.mockResolvedValue(mockMembership());
    getTenantBillingMock.mockResolvedValue(MOCK_PAYING_TENANT_BILLING);
    getStripeClientMock.mockReturnValue(MOCK_STRIPE);
    createPortalSessionMock.mockResolvedValue({ url: MOCK_BILLING_PORTAL_URL });
  });

  it('sends the owner to the portal, returning to the Billing page', async () => {
    await expect(openPortal()).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
    );

    expect(createPortalSessionMock).toHaveBeenCalledWith({
      customer: MOCK_STRIPE_CUSTOMER_ID,
      return_url: new URL(
        adminRoutes.dashboardBilling(),
        MOCK_PLATFORM_APP_BASE_URL,
      ).toString(),
    });
    expect(redirect).toHaveBeenCalledWith(MOCK_BILLING_PORTAL_URL);
  });

  it('sends a super admin to the portal', async () => {
    getAdminByUserIdMock.mockResolvedValue(
      mockAdmin({ role: ADMIN_ROLE.SUPERADMIN }),
    );
    getMembershipMock.mockResolvedValue(undefined);

    await expect(openPortal()).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
    );

    expect(redirect).toHaveBeenCalledWith(MOCK_BILLING_PORTAL_URL);
  });

  it.each([
    ['a moderator', mockAdmin({ role: ADMIN_ROLE.MODERATOR }), undefined],
    ['an editor', undefined, mockMembership({ role: MEMBERSHIP_ROLE.EDITOR })],
  ])('opens nothing for %s', async (_label, admin, membership) => {
    getAdminByUserIdMock.mockResolvedValue(admin);
    getMembershipMock.mockResolvedValue(membership);

    await expect(openPortal()).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );

    expect(createPortalSessionMock).not.toHaveBeenCalled();
  });

  it('refuses an id that is not a site without reaching the gate', async () => {
    const result = await openBillingPortalAction(faker.lorem.word());

    expect(result).toEqual(NO_CUSTOMER);
    expect(getTenantBillingMock).not.toHaveBeenCalled();
  });

  it('refuses a site with no billing account', async () => {
    getTenantBillingMock.mockResolvedValue(MOCK_EMPTY_TENANT_BILLING);

    const result = await openPortal();

    expect(result).toEqual(NO_CUSTOMER);
    expect(createPortalSessionMock).not.toHaveBeenCalled();
  });

  it('fails and logs when the billing key is unset', async () => {
    getStripeClientMock.mockReturnValue(undefined);

    const result = await openPortal();

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(logger.error).toHaveBeenCalledWith(BILLING_LOG.STRIPE_UNCONFIGURED, {
      tenantId: MOCK_TENANT_ID,
    });
  });

  it('fails and logs when the portal session cannot be created', async () => {
    createPortalSessionMock.mockRejectedValue(MOCK_PORTAL_FAILURE);

    const result = await openPortal();

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(redirect).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      BILLING_LOG.PORTAL_FAILED,
      expect.objectContaining({ tenantId: MOCK_TENANT_ID }),
    );
  });
});
