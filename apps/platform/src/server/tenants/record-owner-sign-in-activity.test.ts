import { MEMBERSHIP_ROLE, type TMembershipRole } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';
import { revalidateSiteConfig } from '@platform/server/site-config/revalidate-site-config';
import { makeMembership } from '@platform/testing/memberships/fixtures';
import { makeTenant } from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';

import { recordOwnerSignInActivity } from './record-owner-sign-in-activity';

const {
  listMembershipsWithTenantsForUserMock,
  touchTenantActivityMock,
  wakeTenantFromInactivityMock,
} = vi.hoisted(() => ({
  listMembershipsWithTenantsForUserMock: vi.fn(),
  touchTenantActivityMock: vi.fn(),
  wakeTenantFromInactivityMock: vi.fn(),
}));

vi.mock('@blog/db', () => ({
  queries: {
    memberships: {
      listMembershipsWithTenantsForUser: listMembershipsWithTenantsForUserMock,
    },
    tenants: {
      touchTenantActivity: touchTenantActivityMock,
      wakeTenantFromInactivity: wakeTenantFromInactivityMock,
    },
  },
}));

vi.mock('@platform/server/site-config/revalidate-site-config');

vi.mock('@platform/utils/logger/logger');

const USER_ID = 'user-1';
const DB_DOWN = new Error('db down');
const OWNED_TENANT = makeTenant({ id: 'tenant-owned' });
const EDITED_TENANT = makeTenant({ id: 'tenant-edited' });

const membershipFor = (tenant: TTenant, role: TMembershipRole) => ({
  membership: makeMembership({ userId: USER_ID, tenantId: tenant.id, role }),
  tenant,
});

describe(recordOwnerSignInActivity, () => {
  beforeEach(() => {
    listMembershipsWithTenantsForUserMock.mockResolvedValue([
      membershipFor(OWNED_TENANT, MEMBERSHIP_ROLE.OWNER),
      membershipFor(EDITED_TENANT, MEMBERSHIP_ROLE.EDITOR),
    ]);
    touchTenantActivityMock.mockResolvedValue({ ok: true, data: OWNED_TENANT });
    wakeTenantFromInactivityMock.mockResolvedValue(null);
  });

  it('touches activity only for the tenants the user owns', async () => {
    await recordOwnerSignInActivity(USER_ID);

    expect(touchTenantActivityMock).toHaveBeenCalledTimes(1);
    expect(touchTenantActivityMock).toHaveBeenCalledWith(
      OWNED_TENANT.id,
      expect.any(Date),
    );
  });

  it('purges the site cache of a tenant it wakes from inactivity', async () => {
    wakeTenantFromInactivityMock.mockResolvedValue(OWNED_TENANT);

    await recordOwnerSignInActivity(USER_ID);

    expect(wakeTenantFromInactivityMock).toHaveBeenCalledWith(OWNED_TENANT.id);
    expect(revalidateSiteConfig).toHaveBeenCalledWith(OWNED_TENANT.id);
  });

  it('leaves the site cache alone when no tenant was woken', async () => {
    await recordOwnerSignInActivity(USER_ID);

    expect(revalidateSiteConfig).not.toHaveBeenCalled();
  });

  it('logs a failed touch without throwing', async () => {
    touchTenantActivityMock.mockRejectedValue(DB_DOWN);

    await expect(recordOwnerSignInActivity(USER_ID)).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalledWith(
      'tenant.sign_in_activity_failed',
      expect.objectContaining({ tenantId: OWNED_TENANT.id }),
    );
  });

  it('logs a failed membership lookup without throwing', async () => {
    listMembershipsWithTenantsForUserMock.mockRejectedValue(DB_DOWN);

    await expect(recordOwnerSignInActivity(USER_ID)).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalledWith(
      'tenant.sign_in_owner_lookup_failed',
      expect.objectContaining({ userId: USER_ID }),
    );
  });
});
