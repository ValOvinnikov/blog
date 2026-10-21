import {
  ADMIN_ROLE,
  MEMBERSHIP_ROLE,
  TENANT_PROVISIONING_STATUS,
} from '@blog/db/constants';
import { buildVirtualAdminMembership } from '@platform/server/auth/build-virtual-admin-membership';
import { makeAdmin } from '@platform/testing/admins/fixtures';
import { makeMembership } from '@platform/testing/memberships/fixtures';
import {
  makeReadyTenant,
  makeTenant,
} from '@platform/testing/tenants/fixtures';

import { siteSetupFor } from './site-setup-for';

const owner = makeMembership();

const virtualAdmin = buildVirtualAdminMembership(
  makeAdmin().userId,
  owner.tenantId,
);

describe(siteSetupFor, () => {
  it("shows the owner their tenant's setup, with retry, while it is not ready", () => {
    const setup = siteSetupFor(
      makeTenant({ provisioningStatus: TENANT_PROVISIONING_STATUS.FAILED }),
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
    expect(siteSetupFor(makeReadyTenant(), owner, undefined)).toBeUndefined();
  });

  it('shows nothing for a tenant with no recorded provisioning', () => {
    expect(
      siteSetupFor(makeTenant({ provisioningStatus: null }), owner, undefined),
    ).toBeUndefined();
  });

  it('shows nothing to an editor', () => {
    expect(
      siteSetupFor(
        makeTenant(),
        makeMembership({ role: MEMBERSHIP_ROLE.EDITOR }),
        undefined,
      ),
    ).toBeUndefined();
  });

  it('lets a super-admin viewing the tenant retry', () => {
    expect(
      siteSetupFor(
        makeTenant(),
        virtualAdmin,
        makeAdmin({ role: ADMIN_ROLE.SUPERADMIN }),
      )?.canRetry,
    ).toBe(true);
  });

  it('shows a lesser admin the progress without retry', () => {
    expect(
      siteSetupFor(
        makeTenant(),
        virtualAdmin,
        makeAdmin({ role: ADMIN_ROLE.MODERATOR }),
      )?.canRetry,
    ).toBe(false);
  });
});
