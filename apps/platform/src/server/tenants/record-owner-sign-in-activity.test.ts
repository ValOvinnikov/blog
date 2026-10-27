import { queries } from '@blog/db';
import { MEMBERSHIP_ROLE, type TMembershipRole } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';
import { okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { TENANT_LOG } from '@platform/constants/tenant';
import { revalidateSiteConfig } from '@platform/server/site-config/revalidate-site-config';
import { mockMembership } from '@platform/testing/memberships/fixtures';
import {
  MOCK_OTHER_TENANT_ID,
  MOCK_TENANT_ID,
  mockTenant,
} from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';

import { recordOwnerSignInActivity } from './record-owner-sign-in-activity';

vi.mock('@blog/db', () => ({
  queries: {
    memberships: { listMembershipsWithTenantsForUser: vi.fn() },
    tenants: {
      touchTenantActivity: vi.fn(),
      wakeTenantFromInactivity: vi.fn(),
    },
  },
}));

vi.mock('@platform/server/site-config/revalidate-site-config');

faker.seed(5997);

const MOCK_USER_ID = faker.string.uuid();
const MOCK_SIGN_IN_AT = new Date('2026-10-01T12:00:00.000Z');
const MOCK_DB_ERROR = new Error(faker.lorem.sentence());
const OWNED_TENANT = mockTenant({ id: MOCK_TENANT_ID });
const EDITED_TENANT = mockTenant({ id: MOCK_OTHER_TENANT_ID });

const listMembershipsMock = vi.mocked(
  queries.memberships.listMembershipsWithTenantsForUser,
);
const touchTenantActivityMock = vi.mocked(queries.tenants.touchTenantActivity);
const wakeTenantFromInactivityMock = vi.mocked(
  queries.tenants.wakeTenantFromInactivity,
);

const membershipFor = (tenant: TTenant, role: TMembershipRole) => ({
  membership: mockMembership({
    userId: MOCK_USER_ID,
    tenantId: tenant.id,
    role,
  }),
  tenant,
});

describe(recordOwnerSignInActivity, () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(MOCK_SIGN_IN_AT);
    listMembershipsMock.mockResolvedValue([
      membershipFor(OWNED_TENANT, MEMBERSHIP_ROLE.OWNER),
      membershipFor(EDITED_TENANT, MEMBERSHIP_ROLE.EDITOR),
    ]);
    touchTenantActivityMock.mockResolvedValue(okResult(OWNED_TENANT));
    wakeTenantFromInactivityMock.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('touches activity only for the tenants the user owns', async () => {
    await recordOwnerSignInActivity(MOCK_USER_ID);

    expect(touchTenantActivityMock).toHaveBeenCalledExactlyOnceWith(
      OWNED_TENANT.id,
      MOCK_SIGN_IN_AT,
    );
  });

  it('purges the site cache of a tenant it wakes from inactivity', async () => {
    wakeTenantFromInactivityMock.mockResolvedValue(OWNED_TENANT);

    await recordOwnerSignInActivity(MOCK_USER_ID);

    expect(wakeTenantFromInactivityMock).toHaveBeenCalledWith(OWNED_TENANT.id);
    expect(revalidateSiteConfig).toHaveBeenCalledWith(OWNED_TENANT.id);
  });

  it('leaves the site cache alone when no tenant was woken', async () => {
    await recordOwnerSignInActivity(MOCK_USER_ID);

    expect(revalidateSiteConfig).not.toHaveBeenCalled();
  });

  it('logs a failed touch without throwing', async () => {
    touchTenantActivityMock.mockRejectedValue(MOCK_DB_ERROR);

    await expect(
      recordOwnerSignInActivity(MOCK_USER_ID),
    ).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalledWith(
      TENANT_LOG.SIGN_IN_ACTIVITY_FAILED,
      { tenantId: OWNED_TENANT.id, errorName: MOCK_DB_ERROR.name },
    );
  });

  it('logs a failed membership lookup without throwing', async () => {
    listMembershipsMock.mockRejectedValue(MOCK_DB_ERROR);

    await expect(
      recordOwnerSignInActivity(MOCK_USER_ID),
    ).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalledWith(
      TENANT_LOG.SIGN_IN_OWNER_LOOKUP_FAILED,
      { userId: MOCK_USER_ID, errorName: MOCK_DB_ERROR.name },
    );
  });
});
