import {
  MEMBERSHIP_ROLE,
  TENANT_PLAN,
  TENANT_STATUS,
} from '@blog/db/constants';
import { UPGRADE_STATE } from '@platform/constants/billing';
import { buildVirtualAdminMembership } from '@platform/server/auth/build-virtual-admin-membership';
import { MOCK_OPERATOR_ID } from '@platform/testing/admins/operator';
import { mockMembership } from '@platform/testing/memberships/fixtures';
import {
  MOCK_TENANT_CREATED_AT,
  MOCK_TENANT_ID,
  mockTenant,
} from '@platform/testing/tenants/fixtures';

import { upgradeStateFor } from './upgrade-state-for';

const MOCK_OWNER = mockMembership();

describe(upgradeStateFor, () => {
  it.each([
    [TENANT_PLAN.FREE, TENANT_STATUS.ACTIVE, UPGRADE_STATE.AVAILABLE],
    [TENANT_PLAN.GROWTH, TENANT_STATUS.TRIAL, UPGRADE_STATE.AVAILABLE],
    [TENANT_PLAN.GROWTH, TENANT_STATUS.ACTIVE, UPGRADE_STATE.ON_GROWTH],
    [TENANT_PLAN.GROWTH, TENANT_STATUS.PAST_DUE, UPGRADE_STATE.ON_GROWTH],
    [TENANT_PLAN.STARTER, TENANT_STATUS.ACTIVE, UPGRADE_STATE.PAID_PLAN],
    [TENANT_PLAN.FREE, TENANT_STATUS.SUSPENDED, UPGRADE_STATE.UNAVAILABLE],
    [TENANT_PLAN.FREE, TENANT_STATUS.ARCHIVED, UPGRADE_STATE.UNAVAILABLE],
  ])('gives a %s site in %s the %s state', (plan, status, expected) => {
    const state = upgradeStateFor(mockTenant({ plan, status }), MOCK_OWNER);

    expect(state).toBe(expected);
  });

  it('makes a deprovisioned Free site unavailable', () => {
    const tenant = mockTenant({ deprovisionedAt: MOCK_TENANT_CREATED_AT });

    expect(upgradeStateFor(tenant, MOCK_OWNER)).toBe(UPGRADE_STATE.UNAVAILABLE);
  });

  it.each([MEMBERSHIP_ROLE.EDITOR, MEMBERSHIP_ROLE.READER])(
    'refuses a %s member who is not the owner',
    (role) => {
      const state = upgradeStateFor(mockTenant(), mockMembership({ role }));

      expect(state).toBe(UPGRADE_STATE.NOT_OWNER);
    },
  );

  it('refuses an operator viewing the site as its owner', () => {
    const operator = buildVirtualAdminMembership(
      MOCK_OPERATOR_ID,
      MOCK_TENANT_ID,
    );

    expect(upgradeStateFor(mockTenant(), operator)).toBe(
      UPGRADE_STATE.NOT_OWNER,
    );
  });

  it('tells any member that a site already on Growth is on Growth', () => {
    const tenant = mockTenant({ plan: TENANT_PLAN.GROWTH });
    const editor = mockMembership({ role: MEMBERSHIP_ROLE.EDITOR });

    expect(upgradeStateFor(tenant, editor)).toBe(UPGRADE_STATE.ON_GROWTH);
  });
});
