import {
  ADMIN_ROLE,
  MEMBERSHIP_ROLE,
  TENANT_PROVISIONING_STATUS,
} from '@blog/db/constants';
import { buildVirtualAdminMembership } from '@platform/server/auth/build-virtual-admin-membership';
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
    const setup = siteSetupFor(
      mockTenant({ provisioningStatus: TENANT_PROVISIONING_STATUS.FAILED }),
      owner,
      undefined,
    );

    expect(setup).toMatchObject({
      tenant: {
        id: owner.tenantId,
        provisioningStatus: TENANT_PROVISIONING_STATUS.FAILED,
      },
      canRetry: true,
    });
  });

  it('shows nothing once provisioning is ready', () => {
    expect(siteSetupFor(mockReadyTenant(), owner, undefined)).toBeUndefined();
  });

  it('shows nothing for a tenant with no recorded provisioning', () => {
    expect(
      siteSetupFor(mockTenant({ provisioningStatus: null }), owner, undefined),
    ).toBeUndefined();
  });

  it('shows nothing to an editor', () => {
    expect(
      siteSetupFor(
        mockTenant(),
        mockMembership({ role: MEMBERSHIP_ROLE.EDITOR }),
        undefined,
      ),
    ).toBeUndefined();
  });

  it('lets a super-admin viewing the tenant retry', () => {
    expect(
      siteSetupFor(
        mockTenant(),
        virtualAdmin,
        mockAdmin({ role: ADMIN_ROLE.SUPERADMIN }),
      )?.canRetry,
    ).toBe(true);
  });

  it('shows a lesser admin the progress without retry', () => {
    expect(
      siteSetupFor(
        mockTenant(),
        virtualAdmin,
        mockAdmin({ role: ADMIN_ROLE.MODERATOR }),
      )?.canRetry,
    ).toBe(false);
  });
});
