import { MEMBERSHIP_ROLE, TENANT_PLAN } from '@blog/db/constants';
import { makeReadyTenant, TENANT_ID } from '@platform/testing/tenants/fixtures';

import { resolveTenantPageAccess } from './resolve-tenant-page-access';

const { listLeadsMock } = vi.hoisted(() => ({ listLeadsMock: vi.fn() }));

vi.mock('@blog/db', () => ({
  queries: { leads: { listLeads: listLeadsMock } },
}));

const membershipOf = (role: string) =>
  ({
    id: 'm-1',
    userId: 'user-1',
    tenantId: TENANT_ID,
    role,
    createdAt: new Date(0),
  }) as Parameters<typeof resolveTenantPageAccess>[1];

describe(resolveTenantPageAccess, () => {
  beforeEach(() => {
    listLeadsMock.mockReset();
    listLeadsMock.mockResolvedValue({ leads: [], total: 0 });
  });

  it('opens Leads for an owner on a plan with the contact form, without reading leads', async () => {
    const access = await resolveTenantPageAccess(
      makeReadyTenant({ plan: TENANT_PLAN.GROWTH }),
      membershipOf(MEMBERSHIP_ROLE.OWNER),
    );

    expect(access.leads).toBe(true);
    expect(listLeadsMock).not.toHaveBeenCalled();
  });

  it('keeps Leads closed for a downgraded owner with no stored leads', async () => {
    const access = await resolveTenantPageAccess(
      makeReadyTenant({ id: TENANT_ID, plan: TENANT_PLAN.FREE }),
      membershipOf(MEMBERSHIP_ROLE.OWNER),
    );

    expect(access.leads).toBe(false);
    expect(listLeadsMock).toHaveBeenCalledWith({
      tenantId: TENANT_ID,
      page: 1,
      pageSize: 1,
    });
  });

  it('keeps Leads open for a downgraded owner with stored leads', async () => {
    listLeadsMock.mockResolvedValue({ leads: [], total: 2 });

    const access = await resolveTenantPageAccess(
      makeReadyTenant({ plan: TENANT_PLAN.FREE }),
      membershipOf(MEMBERSHIP_ROLE.OWNER),
    );

    expect(access.leads).toBe(true);
  });

  it('closes Leads for an editor whatever the plan', async () => {
    const access = await resolveTenantPageAccess(
      makeReadyTenant({ plan: TENANT_PLAN.GROWTH }),
      membershipOf(MEMBERSHIP_ROLE.EDITOR),
    );

    expect(access.leads).toBe(false);
  });
});
