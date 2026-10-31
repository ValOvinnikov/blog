import { SANITY_PROJECT_ROLE } from '@blog/config';
import { ELEVATE_TENANT_OWNER_OUTCOME } from '@blog/db/constants';
import {
  MOCK_RECHECK_ENV,
  MOCK_SANITY_MANAGEMENT_TOKEN,
} from '@blog/db/testing/recheck-tenant-owners/fixtures';
import {
  MOCK_STEP_ERROR,
  MOCK_TENANT_MANAGEMENT_TOKEN,
  mockTenant,
} from '@blog/db/testing/tenants/fixtures';
import { faker } from '@faker-js/faker';

import { elevateTenantOwner } from './elevate-tenant-owner';

faker.seed(5804);

const {
  getTenantSanityManagementCredentialsMock,
  listSanityProjectAclMock,
  grantSanityProjectRoleMock,
} = vi.hoisted(() => ({
  getTenantSanityManagementCredentialsMock: vi.fn(),
  listSanityProjectAclMock: vi.fn(),
  grantSanityProjectRoleMock: vi.fn(),
}));

vi.mock(
  '@blog/db/queries/tenants/get-tenant-sanity-management-credentials',
  () => ({
    getTenantSanityManagementCredentials:
      getTenantSanityManagementCredentialsMock,
  }),
);

vi.mock(
  '@blog/db/utils/sanity-management-client/sanity-project-access',
  () => ({
    listSanityProjectAcl: listSanityProjectAclMock,
    grantSanityProjectRole: grantSanityProjectRoleMock,
  }),
);

const MOCK_NOW = faker.date.recent();
const MOCK_STALE_INVITE_AGE_MS = 1000 * 60 * 60 * 24 * 10;

function mockAclEntry(
  roleNames: string[],
  { isRobot = false }: { isRobot?: boolean } = {},
) {
  return {
    projectUserId: faker.string.alphanumeric(10),
    roles: roleNames.map((name) => ({ name })),
    isRobot,
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(MOCK_NOW);
  getTenantSanityManagementCredentialsMock.mockImplementation(
    (tenantId: string) =>
      Promise.resolve({
        projectId: tenantId,
        token: MOCK_TENANT_MANAGEMENT_TOKEN,
      }),
  );
});

afterEach(() => {
  vi.useRealTimers();
});

describe(elevateTenantOwner, () => {
  it('reports PENDING_ACCEPTANCE and never grants for a fresh invite', async () => {
    listSanityProjectAclMock.mockResolvedValue([
      mockAclEntry([SANITY_PROJECT_ROLE.EDITOR], { isRobot: true }),
    ]);

    const result = await elevateTenantOwner(
      mockTenant({ createdAt: MOCK_NOW }),
      MOCK_RECHECK_ENV,
    );

    expect(result).toBe(ELEVATE_TENANT_OWNER_OUTCOME.PENDING_ACCEPTANCE);
    expect(grantSanityProjectRoleMock).not.toHaveBeenCalled();
  });

  it('reports STALLED once the invite is older than the acceptance window', async () => {
    listSanityProjectAclMock.mockResolvedValue([]);
    const staleCreatedAt = new Date(
      MOCK_NOW.getTime() - MOCK_STALE_INVITE_AGE_MS,
    );

    const result = await elevateTenantOwner(
      mockTenant({ createdAt: staleCreatedAt }),
      MOCK_RECHECK_ENV,
    );

    expect(result).toBe(ELEVATE_TENANT_OWNER_OUTCOME.STALLED);
    expect(grantSanityProjectRoleMock).not.toHaveBeenCalled();
  });

  it('grants administrator to the owner once they appear in the ACL', async () => {
    const tenant = mockTenant({ createdAt: MOCK_NOW });
    const owner = mockAclEntry([SANITY_PROJECT_ROLE.VIEWER]);
    listSanityProjectAclMock.mockResolvedValue([
      mockAclEntry([SANITY_PROJECT_ROLE.EDITOR], { isRobot: true }),
      owner,
    ]);

    const result = await elevateTenantOwner(tenant, MOCK_RECHECK_ENV);

    expect(result).toBe(ELEVATE_TENANT_OWNER_OUTCOME.ELEVATED);
    expect(listSanityProjectAclMock).toHaveBeenCalledWith({
      token: MOCK_TENANT_MANAGEMENT_TOKEN,
      projectId: tenant.sanityProjectId,
    });
    expect(grantSanityProjectRoleMock).toHaveBeenCalledWith({
      token: MOCK_SANITY_MANAGEMENT_TOKEN,
      projectId: tenant.sanityProjectId,
      projectUserId: owner.projectUserId,
      role: SANITY_PROJECT_ROLE.ADMINISTRATOR,
    });
  });

  it('is a safe no-op for an owner who already holds administrator', async () => {
    listSanityProjectAclMock.mockResolvedValue([
      mockAclEntry([
        SANITY_PROJECT_ROLE.VIEWER,
        SANITY_PROJECT_ROLE.ADMINISTRATOR,
      ]),
    ]);

    const result = await elevateTenantOwner(
      mockTenant({ createdAt: MOCK_NOW }),
      MOCK_RECHECK_ENV,
    );

    expect(result).toBe(ELEVATE_TENANT_OWNER_OUTCOME.ALREADY_ADMINISTRATOR);
    expect(grantSanityProjectRoleMock).not.toHaveBeenCalled();
  });

  it('skips the ACL lookup when the tenant has no Sanity project yet', async () => {
    const result = await elevateTenantOwner(
      mockTenant({ createdAt: MOCK_NOW, sanityProjectId: null }),
      MOCK_RECHECK_ENV,
    );

    expect(result).toBe(ELEVATE_TENANT_OWNER_OUTCOME.PENDING_ACCEPTANCE);
    expect(listSanityProjectAclMock).not.toHaveBeenCalled();
  });

  it('reports AMBIGUOUS_MEMBERSHIP and never grants with several human members', async () => {
    listSanityProjectAclMock.mockResolvedValue([
      mockAclEntry([SANITY_PROJECT_ROLE.ADMINISTRATOR]),
      mockAclEntry([SANITY_PROJECT_ROLE.VIEWER]),
    ]);

    const result = await elevateTenantOwner(
      mockTenant({ createdAt: MOCK_NOW }),
      MOCK_RECHECK_ENV,
    );

    expect(result).toBe(ELEVATE_TENANT_OWNER_OUTCOME.AMBIGUOUS_MEMBERSHIP);
    expect(grantSanityProjectRoleMock).not.toHaveBeenCalled();
  });

  it('names the Sanity Manage step when the organisation token cannot grant administrator', async () => {
    listSanityProjectAclMock.mockResolvedValue([
      mockAclEntry([SANITY_PROJECT_ROLE.VIEWER]),
    ]);
    grantSanityProjectRoleMock.mockRejectedValue(new Error(MOCK_STEP_ERROR));

    await expect(
      elevateTenantOwner(mockTenant({ createdAt: MOCK_NOW }), MOCK_RECHECK_ENV),
    ).rejects.toThrow('by hand in Sanity Manage');
  });

  it('throws without reading the ACL when the tenant has no management token', async () => {
    getTenantSanityManagementCredentialsMock.mockResolvedValue(undefined);

    await expect(
      elevateTenantOwner(mockTenant({ createdAt: MOCK_NOW }), MOCK_RECHECK_ENV),
    ).rejects.toThrow('has no Sanity management token');
    expect(listSanityProjectAclMock).not.toHaveBeenCalled();
  });
});
