import {
  ADMIN_ROLE,
  MEMBERSHIP_ROLE,
  TENANT_PROVISIONING_STATUS,
} from '@blog/db/constants';
import { buildVirtualAdminMembership } from '@platform/server/auth/build-virtual-admin-membership';
import { toClientTenant } from '@platform/server/tenants/to-client-tenant';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import { mockMembership } from '@platform/testing/memberships/fixtures';
import {
  mockReadyTenant,
  mockTenant,
} from '@platform/testing/tenants/fixtures';

import { siteSetupFor } from './site-setup-for';

const owner = mockMembership();

const virtualAdmin = buildVirtualAdminMembership(
  mockAdmin().userId,
  owner.tenantId,
);

describe(siteSetupFor, () => {
  it("shows the owner their tenant's setup, with retry, while it is not ready", () => {
    const tenant = mockTenant({
      provisioningStatus: TENANT_PROVISIONING_STATUS.FAILED,
    });

    const setup = siteSetupFor(tenant, owner, undefined);

    expect(setup).toEqual({ tenant: toClientTenant(tenant), canRetry: true });
  });

  it('shows nothing once provisioning is ready', () => {
    const setup = siteSetupFor(mockReadyTenant(), owner, undefined);

    expect(setup).toBeUndefined();
  });

  it('shows nothing for a tenant with no recorded provisioning', () => {
    const tenant = mockTenant({ provisioningStatus: null });

    const setup = siteSetupFor(tenant, owner, undefined);

    expect(setup).toBeUndefined();
  });

  it('shows nothing to an editor', () => {
    const editor = mockMembership({ role: MEMBERSHIP_ROLE.EDITOR });

    const setup = siteSetupFor(mockTenant(), editor, undefined);

    expect(setup).toBeUndefined();
  });

  it.each([
    { role: ADMIN_ROLE.SUPERADMIN, canRetry: true },
    { role: ADMIN_ROLE.MODERATOR, canRetry: false },
  ])('sets retry to $canRetry for a viewing $role', ({ role, canRetry }) => {
    const setup = siteSetupFor(mockTenant(), virtualAdmin, mockAdmin({ role }));

    expect(setup?.canRetry).toBe(canRetry);
  });
});
