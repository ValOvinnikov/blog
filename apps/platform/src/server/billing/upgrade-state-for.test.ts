import { TENANT_PLAN } from '@blog/config/constants';
import { MEMBERSHIP_ROLE, TENANT_STATUS } from '@blog/db/constants';
import { UPGRADE_STATE } from '@platform/constants/billing';
import { buildVirtualAdminMembership } from '@platform/server/auth/build-virtual-admin-membership';
import { MOCK_OPERATOR_ID } from '@platform/testing/admins/operator';
import { MOCK_STRIPE_SUBSCRIPTION_ID } from '@platform/testing/billing/fixtures';
import {
  mockMembership,
  mockViewer,
} from '@platform/testing/memberships/fixtures';
import {
  MOCK_TENANT_CREATED_AT,
  MOCK_TENANT_ID,
  mockTenant,
} from '@platform/testing/tenants/fixtures';
import { mockTrialTenant } from '@platform/testing/tenants/mock-tenant';

import { upgradeStateFor } from './upgrade-state-for';

const MOCK_OWNER = mockViewer();
const MOCK_EDITOR = mockViewer({
  membership: mockMembership({ role: MEMBERSHIP_ROLE.EDITOR }),
});

describe(upgradeStateFor, () => {
  it.each([
    ['a Free site', mockTenant()],
    ['a trial', mockTrialTenant()],
    [
      'a site whose subscription was cancelled',
      mockTenant({ stripeSubscriptionId: MOCK_STRIPE_SUBSCRIPTION_ID }),
    ],
    [
      'a paid plan set without a subscription',
      mockTenant({ plan: TENANT_PLAN.GROWTH }),
    ],
  ])('opens Upgrade to the owner of %s', (_, tenant) => {
    expect(upgradeStateFor(tenant, MOCK_OWNER)).toBe(UPGRADE_STATE.AVAILABLE);
  });

  it.each([TENANT_PLAN.STARTER, TENANT_PLAN.GROWTH])(
    'treats a %s site with a subscription as subscribed, for any member',
    (plan) => {
      const tenant = mockTenant({
        plan,
        stripeSubscriptionId: MOCK_STRIPE_SUBSCRIPTION_ID,
      });

      expect(upgradeStateFor(tenant, MOCK_EDITOR)).toBe(
        UPGRADE_STATE.SUBSCRIBED,
      );
    },
  );

  it.each([
    ['suspended', mockTenant({ status: TENANT_STATUS.SUSPENDED })],
    ['deprovisioned', mockTenant({ deprovisionedAt: MOCK_TENANT_CREATED_AT })],
  ])('makes a %s site unavailable', (_, tenant) => {
    expect(upgradeStateFor(tenant, MOCK_OWNER)).toBe(UPGRADE_STATE.UNAVAILABLE);
  });

  it.each([
    ['a member who is not the owner', MOCK_EDITOR],
    [
      'an operator viewing the site as its owner',
      mockViewer({
        membership: buildVirtualAdminMembership(
          MOCK_OPERATOR_ID,
          MOCK_TENANT_ID,
        ),
      }),
    ],
  ])('refuses %s', (_, membership) => {
    expect(upgradeStateFor(mockTenant(), membership)).toBe(
      UPGRADE_STATE.NOT_OWNER,
    );
  });
});
