import { queries } from '@blog/db';
import {
  ADMIN_ROLE,
  MEMBERSHIP_ROLE,
  TENANT_PLAN,
  type TMembershipRole,
  type TTenantPlan,
} from '@blog/db/constants';
import { buildVirtualAdminMembership } from '@platform/server/auth/build-virtual-admin-membership';
import { listSessionTenants } from '@platform/server/auth/list-session-tenants';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import { MOCK_SIGN_IN_USER_ID } from '@platform/testing/auth/fixtures';
import { mockMembership } from '@platform/testing/memberships/fixtures';
import {
  MOCK_TENANT_ID,
  mockReadyTenant,
} from '@platform/testing/tenants/fixtures';

import { resolveTenantPageAccess } from './resolve-tenant-page-access';

vi.mock('@blog/db', () => ({
  queries: { leads: { countLeadsForTenant: vi.fn() } },
}));

vi.mock('@platform/server/auth/list-session-tenants', () => ({
  listSessionTenants: vi.fn(),
}));

const MOCK_STORED_LEAD_COUNT = 2;
const MOCK_VIRTUAL_MEMBERSHIP = buildVirtualAdminMembership(
  MOCK_SIGN_IN_USER_ID,
  MOCK_TENANT_ID,
);
const MOCK_SESSION_TENANTS = {
  userId: MOCK_SIGN_IN_USER_ID,
  admin: undefined,
  memberships: [],
  tenants: [],
};

const listSessionTenantsMock = vi.mocked(listSessionTenants);

const countLeadsForTenant = vi.mocked(queries.leads.countLeadsForTenant);

const resolveFor = (plan: TTenantPlan, role: TMembershipRole) =>
  resolveTenantPageAccess(
    mockReadyTenant({ id: MOCK_TENANT_ID, plan }),
    mockMembership({ role }),
  );

describe(resolveTenantPageAccess, () => {
  beforeEach(() => {
    countLeadsForTenant.mockReset();
    countLeadsForTenant.mockResolvedValue(0);
    listSessionTenantsMock.mockResolvedValue(MOCK_SESSION_TENANTS);
  });

  it('opens Leads to an owner on a plan with the contact form', async () => {
    const { leads } = await resolveFor(
      TENANT_PLAN.GROWTH,
      MEMBERSHIP_ROLE.OWNER,
    );

    expect(leads).toBe(true);
    expect(countLeadsForTenant).not.toHaveBeenCalled();
  });

  it('keeps Leads closed for a downgraded owner with no stored leads', async () => {
    const { leads } = await resolveFor(TENANT_PLAN.FREE, MEMBERSHIP_ROLE.OWNER);

    expect(leads).toBe(false);
    expect(countLeadsForTenant).toHaveBeenCalledWith(MOCK_TENANT_ID);
  });

  it('keeps Leads open for a downgraded owner with stored leads', async () => {
    countLeadsForTenant.mockResolvedValue(MOCK_STORED_LEAD_COUNT);

    const { leads } = await resolveFor(TENANT_PLAN.FREE, MEMBERSHIP_ROLE.OWNER);

    expect(leads).toBe(true);
  });

  it('closes Leads to an editor whatever the plan', async () => {
    const { leads } = await resolveFor(
      TENANT_PLAN.GROWTH,
      MEMBERSHIP_ROLE.EDITOR,
    );

    expect(leads).toBe(false);
  });

  it.each([
    ['the real owner', mockMembership(), undefined, true],
    [
      'an editor',
      mockMembership({ role: MEMBERSHIP_ROLE.EDITOR }),
      undefined,
      false,
    ],
    [
      'a super admin',
      MOCK_VIRTUAL_MEMBERSHIP,
      mockAdmin({ role: ADMIN_ROLE.SUPERADMIN }),
      true,
    ],
    [
      'a moderator',
      MOCK_VIRTUAL_MEMBERSHIP,
      mockAdmin({ role: ADMIN_ROLE.MODERATOR }),
      false,
    ],
  ])('opens Billing to %s: %s', async (_label, membership, admin, isOpen) => {
    listSessionTenantsMock.mockResolvedValue({
      ...MOCK_SESSION_TENANTS,
      admin,
    });

    const { billing } = await resolveTenantPageAccess(
      mockReadyTenant({ id: MOCK_TENANT_ID }),
      membership,
    );

    expect(billing).toBe(isOpen);
  });
});
