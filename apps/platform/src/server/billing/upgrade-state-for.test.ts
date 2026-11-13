import { TENANT_PLAN } from '@blog/config/constants';
import { MEMBERSHIP_ROLE, TENANT_STATUS } from '@blog/db/constants';
import { UPGRADE_STATE } from '@platform/constants/billing';
import { PLAN_CHANGE_REFUSAL } from '@platform/constants/plan-change';
import { buildVirtualAdminMembership } from '@platform/server/auth/build-virtual-admin-membership';
import { MOCK_OPERATOR_ID } from '@platform/testing/admins/operator';
import { MOCK_STRIPE_SUBSCRIPTION_ID } from '@platform/testing/billing/fixtures';
import { mockMembership } from '@platform/testing/memberships/fixtures';
import {
  MOCK_TENANT_CREATED_AT,
  MOCK_TENANT_ID,
  mockTenant,
} from '@platform/testing/tenants/fixtures';
import { mockTrialTenant } from '@platform/testing/tenants/mock-tenant';

import { planChangeRefusalFor, upgradeStateFor } from './upgrade-state-for';

const MOCK_OWNER = mockMembership();
const MOCK_EDITOR = mockMembership({ role: MEMBERSHIP_ROLE.EDITOR });

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
      buildVirtualAdminMembership(MOCK_OPERATOR_ID, MOCK_TENANT_ID),
    ],
  ])('refuses %s', (_, membership) => {
    expect(upgradeStateFor(mockTenant(), membership)).toBe(
      UPGRADE_STATE.NOT_OWNER,
    );
  });
});

describe(planChangeRefusalFor, () => {
  const MOCK_PAYING_SITE = mockTenant({
    plan: TENANT_PLAN.STARTER,
    stripeSubscriptionId: MOCK_STRIPE_SUBSCRIPTION_ID,
  });

  it('lets the owner of a paying site change plan', () => {
    expect(planChangeRefusalFor(MOCK_PAYING_SITE, MOCK_OWNER)).toBeUndefined();
  });

  it.each([
    ['Free', mockTenant()],
    ['trial', mockTrialTenant()],
  ])('sends a %s site to checkout instead', (_, tenant) => {
    expect(planChangeRefusalFor(tenant, MOCK_OWNER)).toBe(
      PLAN_CHANGE_REFUSAL.NOT_SUBSCRIBED,
    );
  });

  it('refuses a member who is not the owner', () => {
    expect(planChangeRefusalFor(MOCK_PAYING_SITE, MOCK_EDITOR)).toBe(
      UPGRADE_STATE.NOT_OWNER,
    );
  });

  it('refuses a suspended paying site', () => {
    const tenant = { ...MOCK_PAYING_SITE, status: TENANT_STATUS.SUSPENDED };

    expect(planChangeRefusalFor(tenant, MOCK_OWNER)).toBe(
      UPGRADE_STATE.UNAVAILABLE,
    );
  });
});
