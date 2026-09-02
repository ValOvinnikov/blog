import { ELEVATE_TENANT_OWNER_OUTCOME } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';

import type { TProvisionEnv } from '../lib/env';

import {
  elevateTenantOwner,
  OWNER_ACCEPTANCE_STALL_THRESHOLD_MS,
} from './elevate-tenant-owner';

const { listSanityProjectAclMock, grantSanityProjectRoleMock } = vi.hoisted(
  () => ({
    listSanityProjectAclMock: vi.fn(),
    grantSanityProjectRoleMock: vi.fn(),
  }),
);

vi.mock('../lib/sanity-management-client', () => ({
  listSanityProjectAcl: listSanityProjectAclMock,
  grantSanityProjectRole: grantSanityProjectRoleMock,
}));

const env: TProvisionEnv = {
  sanityManagementToken: 'mgmt-token',
  sanityOrganizationId: 'org-abc',
  vercelToken: 'v-token',
  vercelTeamId: undefined,
  githubRunId: undefined,
  githubRepository: undefined,
  githubServerUrl: undefined,
  tenantRegistryEnvironment: undefined,
  vercelWebProjectId: 'prj_web',
  adminAppBaseUrl: 'https://admin.example.com',
  tenantSanityDataset: 'test-dataset',
  webAppBaseUrl: 'https://example.com',
  revalidateSecret: 'revalidate-shh',
  resendApiKey: undefined,
};

function tenantAt(createdAt: Date, overrides: Partial<TTenant> = {}): TTenant {
  return {
    id: 'tenant-1',
    slug: 'acme',
    name: 'Acme',
    primaryDomain: 'acme.example.com',
    sanityProjectId: 'proj-abc',
    sanityDataset: 'production',
    sanityReadTokenEncrypted: null,
    locale: 'en',
    plan: 'FREE',
    status: 'ACTIVE',
    provisioningStatus: 'PROVISIONING',
    provisioningSteps: null,
    studioVercelProjectId: null,
    seededAt: null,
    webhookCreatedAt: null,
    deprovisionedAt: null,
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  } as TTenant;
}

beforeEach(() => {
  listSanityProjectAclMock.mockReset();
  grantSanityProjectRoleMock.mockReset().mockResolvedValue(undefined);
});

describe(elevateTenantOwner, () => {
  it('reports PENDING_ACCEPTANCE and never grants when the owner has not yet accepted (fresh invite)', async () => {
    listSanityProjectAclMock.mockResolvedValue([
      { projectUserId: 'p-robot', roles: [{ name: 'editor' }], isRobot: true },
    ]);

    const result = await elevateTenantOwner(tenantAt(new Date()), env);

    expect(result).toBe(ELEVATE_TENANT_OWNER_OUTCOME.PENDING_ACCEPTANCE);
    expect(grantSanityProjectRoleMock).not.toHaveBeenCalled();
  });

  it('reports STALLED once the invite is older than the acceptance window', async () => {
    listSanityProjectAclMock.mockResolvedValue([]);
    const staleCreatedAt = new Date(Date.now() - 1000 * 60 * 60 * 24 * 10);

    const result = await elevateTenantOwner(tenantAt(staleCreatedAt), env);

    expect(result).toBe(ELEVATE_TENANT_OWNER_OUTCOME.STALLED);
    expect(grantSanityProjectRoleMock).not.toHaveBeenCalled();
  });

  it('reports STALLED at exactly the acceptance-window boundary (inclusive)', async () => {
    listSanityProjectAclMock.mockResolvedValue([]);
    const now = new Date('2026-01-10T00:00:00.000Z');
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const boundaryCreatedAt = new Date(
      now.getTime() - OWNER_ACCEPTANCE_STALL_THRESHOLD_MS,
    );
    const result = await elevateTenantOwner(tenantAt(boundaryCreatedAt), env);

    expect(result).toBe(ELEVATE_TENANT_OWNER_OUTCOME.STALLED);
    vi.useRealTimers();
  });

  it('reports PENDING_ACCEPTANCE one millisecond inside the acceptance window', async () => {
    listSanityProjectAclMock.mockResolvedValue([]);
    const now = new Date('2026-01-10T00:00:00.000Z');
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const justInsideCreatedAt = new Date(
      now.getTime() - OWNER_ACCEPTANCE_STALL_THRESHOLD_MS + 1,
    );
    const result = await elevateTenantOwner(tenantAt(justInsideCreatedAt), env);

    expect(result).toBe(ELEVATE_TENANT_OWNER_OUTCOME.PENDING_ACCEPTANCE);
    vi.useRealTimers();
  });

  it('grants administrator, keyed on projectUserId, once the owner appears in the ACL listing', async () => {
    listSanityProjectAclMock.mockResolvedValue([
      { projectUserId: 'p-robot', roles: [{ name: 'editor' }], isRobot: true },
      {
        projectUserId: 'p-owner',
        roles: [{ name: 'viewer' }],
        isRobot: false,
      },
    ]);

    const result = await elevateTenantOwner(tenantAt(new Date()), env);

    expect(result).toBe(ELEVATE_TENANT_OWNER_OUTCOME.ELEVATED);
    expect(grantSanityProjectRoleMock).toHaveBeenCalledWith({
      token: 'mgmt-token',
      projectId: 'proj-abc',
      projectUserId: 'p-owner',
      role: 'administrator',
    });
  });

  it('is idempotent — an owner who already holds administrator is a safe no-op', async () => {
    listSanityProjectAclMock.mockResolvedValue([
      {
        projectUserId: 'p-owner',
        roles: [{ name: 'viewer' }, { name: 'administrator' }],
        isRobot: false,
      },
    ]);

    const result = await elevateTenantOwner(tenantAt(new Date()), env);

    expect(result).toBe(ELEVATE_TENANT_OWNER_OUTCOME.ALREADY_ADMINISTRATOR);
    expect(grantSanityProjectRoleMock).not.toHaveBeenCalled();
  });

  it('does not call the ACL API when the tenant has no Sanity project yet', async () => {
    const result = await elevateTenantOwner(
      tenantAt(new Date(), { sanityProjectId: null }),
      env,
    );

    expect(result).toBe(ELEVATE_TENANT_OWNER_OUTCOME.PENDING_ACCEPTANCE);
    expect(listSanityProjectAclMock).not.toHaveBeenCalled();
  });

  it('reports AMBIGUOUS_MEMBERSHIP and never grants when more than one human member is present (e.g. a superadmin who joined via Manage)', async () => {
    listSanityProjectAclMock.mockResolvedValue([
      {
        projectUserId: 'p-superadmin',
        roles: [{ name: 'administrator' }],
        isRobot: false,
      },
      {
        projectUserId: 'p-owner',
        roles: [{ name: 'viewer' }],
        isRobot: false,
      },
    ]);

    const result = await elevateTenantOwner(tenantAt(new Date()), env);

    expect(result).toBe(ELEVATE_TENANT_OWNER_OUTCOME.AMBIGUOUS_MEMBERSHIP);
    expect(grantSanityProjectRoleMock).not.toHaveBeenCalled();
  });
});
