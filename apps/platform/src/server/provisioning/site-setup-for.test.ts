import {
  ADMIN_ROLE,
  MEMBERSHIP_ROLE,
  TENANT_PROVISIONING_STATUS,
} from '@blog/db/constants';
import { buildVirtualAdminMembership } from '@platform/server/auth/build-virtual-admin-membership';
import { toClientTenant } from '@platform/server/tenants/to-client-tenant';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import {
  mockMembership,
  mockViewer,
} from '@platform/testing/memberships/fixtures';
import {
  MOCK_TENANT_ID,
  mockReadyTenant,
  mockTenant,
} from '@platform/testing/tenants/fixtures';

import { siteSetupFor } from './site-setup-for';

const owner = mockViewer();

const virtualAdmin = buildVirtualAdminMembership(
  mockAdmin().userId,
  MOCK_TENANT_ID,
);

describe(siteSetupFor, () => {
  it("shows the owner their tenant's setup, with retry, while it is not ready", () => {
    const tenant = mockTenant({
      provisioningStatus: TENANT_PROVISIONING_STATUS.FAILED,
    });

    const setup = siteSetupFor(tenant, owner);

    expect(setup).toEqual({ tenant: toClientTenant(tenant), canRetry: true });
  });

  it('shows nothing once provisioning is ready', () => {
    const setup = siteSetupFor(mockReadyTenant(), owner);

    expect(setup).toBeUndefined();
  });

  it('shows nothing for a tenant with no recorded provisioning', () => {
    const tenant = mockTenant({ provisioningStatus: null });

    const setup = siteSetupFor(tenant, owner);

    expect(setup).toBeUndefined();
  });

  it('shows nothing to an editor', () => {
    const editor = mockViewer({
      membership: mockMembership({ role: MEMBERSHIP_ROLE.EDITOR }),
    });

    const setup = siteSetupFor(mockTenant(), editor);

    expect(setup).toBeUndefined();
  });

  it.each([
    { role: ADMIN_ROLE.SUPERADMIN, canRetry: true },
    { role: ADMIN_ROLE.MODERATOR, canRetry: false },
  ])('sets retry to $canRetry for a viewing $role', ({ role, canRetry }) => {
    const setup = siteSetupFor(
      mockTenant(),
      mockViewer({ membership: virtualAdmin, admin: mockAdmin({ role }) }),
    );

    expect(setup?.canRetry).toBe(canRetry);
  });
});
