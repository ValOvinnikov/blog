import { faker } from '@faker-js/faker';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import { mockedAuth } from '@platform/testing/auth/mocked-auth';
import { mockMembership } from '@platform/testing/memberships/fixtures';
import { MOCK_TENANT_ID, mockTenant } from '@platform/testing/tenants/fixtures';
import { noEntitlementGrantQueries } from '@platform/testing/tenants/no-entitlement-grant-queries';
import { queries } from '@shinefold/db';
import { MEMBERSHIP_ROLE } from '@shinefold/db/constants';

import { resolveStudioCaller } from './resolve-studio-caller';

vi.mock('@platform/server/auth/auth');

vi.mock('@shinefold/db', async () => {
  const { mockDbConstants } =
    await import('@platform/testing/mock-db-constants');

  return {
    ...(await mockDbConstants()),
    queries: {
      ...noEntitlementGrantQueries(),
      tenants: {
        getTenantById: vi.fn(),
        getTenantIdBySanityProjectId: vi.fn(),
      },
      memberships: { getMembership: vi.fn() },
      admins: { getAdminByUserId: vi.fn() },
    },
  };
});

faker.seed(7710);

const MOCK_USER = { id: faker.string.uuid(), email: faker.internet.email() };
const MOCK_PROJECT_ID = faker.string.alphanumeric(8);
const MOCK_OTHER_PROJECT_ID = faker.string.alphanumeric(8);

const getTenantIdBySanityProjectId = vi.mocked(
  queries.tenants.getTenantIdBySanityProjectId,
);
const getMembership = vi.mocked(queries.memberships.getMembership);
const getAdminByUserId = vi.mocked(queries.admins.getAdminByUserId);

describe(resolveStudioCaller, () => {
  beforeEach(() => {
    mockedAuth.mockResolvedValue({ user: MOCK_USER, expires: '' });
    getTenantIdBySanityProjectId.mockImplementation(async (projectId) =>
      projectId === MOCK_PROJECT_ID ? MOCK_TENANT_ID : undefined,
    );
    vi.mocked(queries.tenants.getTenantById).mockResolvedValue(mockTenant());
    getAdminByUserId.mockResolvedValue(undefined);
    getMembership.mockResolvedValue(undefined);
  });

  it.each([MEMBERSHIP_ROLE.OWNER, MEMBERSHIP_ROLE.EDITOR])(
    "admits the site's %s",
    async (role) => {
      getMembership.mockResolvedValue(mockMembership({ role }));

      const caller = await resolveStudioCaller(MOCK_PROJECT_ID);

      expect(caller).toEqual({
        tenant: expect.objectContaining({ id: MOCK_TENANT_ID }),
        userId: MOCK_USER.id,
        email: MOCK_USER.email,
      });
      expect(getMembership).toHaveBeenCalledWith(MOCK_USER.id, MOCK_TENANT_ID);
    },
  );

  it('admits an operator with no membership of the site', async () => {
    getAdminByUserId.mockResolvedValue(mockAdmin({ userId: MOCK_USER.id }));

    const caller = await resolveStudioCaller(MOCK_PROJECT_ID);

    expect(caller?.tenant.id).toBe(MOCK_TENANT_ID);
    expect(getMembership).not.toHaveBeenCalled();
  });

  it('refuses a reader, who has no Studio access', async () => {
    getMembership.mockResolvedValue(
      mockMembership({ role: MEMBERSHIP_ROLE.READER }),
    );

    expect(await resolveStudioCaller(MOCK_PROJECT_ID)).toBeUndefined();
  });

  it('refuses an outsider or locked member, whom the membership read omits', async () => {
    expect(await resolveStudioCaller(MOCK_PROJECT_ID)).toBeUndefined();
  });

  it("refuses a project id that names no site, without reading anyone's membership", async () => {
    expect(await resolveStudioCaller(MOCK_OTHER_PROJECT_ID)).toBeUndefined();
    expect(getMembership).not.toHaveBeenCalled();
  });

  it('refuses a request with no session', async () => {
    mockedAuth.mockResolvedValue(null);

    expect(await resolveStudioCaller(MOCK_PROJECT_ID)).toBeUndefined();
    expect(getTenantIdBySanityProjectId).not.toHaveBeenCalled();
  });
});
