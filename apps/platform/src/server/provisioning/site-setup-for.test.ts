import type { TMembership } from '@blog/db/schema/memberships';
import { buildVirtualAdminMembership } from '@platform/server/auth/build-virtual-admin-membership';
import { makeAdmin } from '@platform/testing/admins/fixtures';
import {
  makeReadyTenant,
  makeTenant,
} from '@platform/testing/tenants/fixtures';

import { siteSetupFor } from './site-setup-for';

const owner: TMembership = {
  id: '6a1b2c3d-0000-4000-8000-000000000001',
  userId: 'user-1',
  tenantId: 'tenant-1',
  role: 'OWNER',
  createdAt: new Date('2026-10-01T00:00:00.000Z'),
};

const virtualAdmin = buildVirtualAdminMembership('admin-user', 'tenant-1');

describe(siteSetupFor, () => {
  it("shows the owner their tenant's setup, with retry, while it is not ready", () => {
    const setup = siteSetupFor(
      makeTenant({ provisioningStatus: 'FAILED' }),
      owner,
      undefined,
    );

    expect(setup).toMatchObject({
      tenant: { id: 'tenant-1', provisioningStatus: 'FAILED' },
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
      siteSetupFor(makeTenant(), { ...owner, role: 'EDITOR' }, undefined),
    ).toBeUndefined();
  });

  it('lets a super-admin viewing the tenant retry', () => {
    expect(
      siteSetupFor(
        makeTenant(),
        virtualAdmin,
        makeAdmin({ role: 'SUPERADMIN' }),
      )?.canRetry,
    ).toBe(true);
  });

  it('shows a lesser admin the progress without retry', () => {
    expect(
      siteSetupFor(makeTenant(), virtualAdmin, makeAdmin({ role: 'MODERATOR' }))
        ?.canRetry,
    ).toBe(false);
  });
});
