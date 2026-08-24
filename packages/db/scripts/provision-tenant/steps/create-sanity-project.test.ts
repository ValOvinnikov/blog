import type { TTenant } from '@blog/db/schema/tenants';

import type { TProvisionEnv } from '../lib/env';

import { createTenantSanityProject } from './create-sanity-project';

const {
  setTenantSanityProjectMock,
  getTenantOwnerEmailMock,
  createSanityProjectMock,
  createSanityDatasetMock,
  addSanityCorsOriginMock,
  createSanityProjectInviteMock,
  listSanityDatasetsMock,
  listSanityCorsOriginsMock,
  listSanityProjectInvitesMock,
  callOrder,
} = vi.hoisted(() => {
  const callOrder: string[] = [];
  return {
    setTenantSanityProjectMock: vi.fn(),
    getTenantOwnerEmailMock: vi.fn(),
    createSanityProjectMock: vi.fn(),
    createSanityDatasetMock: vi.fn(),
    addSanityCorsOriginMock: vi.fn(),
    createSanityProjectInviteMock: vi.fn(),
    listSanityDatasetsMock: vi.fn(),
    listSanityCorsOriginsMock: vi.fn(),
    listSanityProjectInvitesMock: vi.fn(),
    callOrder,
  };
});

vi.mock('@blog/db/queries/tenants', () => ({
  setTenantSanityProject: setTenantSanityProjectMock,
}));

vi.mock('@blog/db/queries/memberships', () => ({
  getTenantOwnerEmail: getTenantOwnerEmailMock,
}));

vi.mock('../lib/sanity-management-client', () => ({
  createSanityProject: createSanityProjectMock,
  createSanityDataset: createSanityDatasetMock,
  addSanityCorsOrigin: addSanityCorsOriginMock,
  createSanityProjectInvite: createSanityProjectInviteMock,
  listSanityDatasets: listSanityDatasetsMock,
  listSanityCorsOrigins: listSanityCorsOriginsMock,
  listSanityProjectInvites: listSanityProjectInvitesMock,
}));

const env: TProvisionEnv = {
  sanityManagementToken: 'mgmt-token',
  sanityOrganizationId: 'org-abc',
  vercelToken: 'v-token',
  vercelOrgId: 'org_1',
  vercelTeamId: undefined,
  vercelWebProjectId: 'prj_web',
  vercelCliVersion: '48.0.0',
  adminAppBaseUrl: 'https://admin.example.com',
  platformDomain: 'example.com',
  tenantSanityDataset: 'test-dataset',
  webAppBaseUrl: 'https://example.com',
  revalidateSecret: 'revalidate-shh',
  githubRepository: 'acme/blog',
};

function baseTenant(overrides: Partial<TTenant> = {}): TTenant {
  return {
    id: 'tenant-1',
    slug: 'acme',
    name: 'Acme',
    primaryDomain: 'acme.example.com',
    sanityProjectId: null,
    sanityDataset: null,
    sanityReadTokenEncrypted: null,
    locale: 'en',
    plan: 'FREE',
    status: 'ACTIVE',
    provisioningStatus: 'PENDING',
    provisioningSteps: null,
    studioVercelProjectId: null,
    seededAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as TTenant;
}

beforeEach(() => {
  callOrder.length = 0;
  setTenantSanityProjectMock.mockReset();
  getTenantOwnerEmailMock.mockReset();
  createSanityProjectMock.mockReset();
  createSanityDatasetMock.mockReset();
  addSanityCorsOriginMock.mockReset();
  createSanityProjectInviteMock.mockReset();
  listSanityDatasetsMock.mockReset();
  listSanityCorsOriginsMock.mockReset();
  listSanityProjectInvitesMock.mockReset();

  setTenantSanityProjectMock.mockImplementation(async () => {
    callOrder.push('setTenantSanityProject');
  });
  getTenantOwnerEmailMock.mockImplementation(async () => {
    callOrder.push('getTenantOwnerEmail');
    return 'owner@example.com';
  });
  createSanityProjectMock.mockImplementation(async () => {
    callOrder.push('createSanityProject');
    return { id: 'proj456' };
  });
  createSanityDatasetMock.mockImplementation(async () => {
    callOrder.push('createSanityDataset');
  });
  addSanityCorsOriginMock.mockImplementation(async () => {
    callOrder.push('addSanityCorsOrigin');
  });
  createSanityProjectInviteMock.mockImplementation(async () => {
    callOrder.push('createSanityProjectInvite');
  });
  listSanityDatasetsMock.mockImplementation(async () => {
    callOrder.push('listSanityDatasets');
    return [];
  });
  listSanityCorsOriginsMock.mockImplementation(async () => {
    callOrder.push('listSanityCorsOrigins');
    return [];
  });
  listSanityProjectInvitesMock.mockImplementation(async () => {
    callOrder.push('listSanityProjectInvites');
    return [];
  });
});

describe(createTenantSanityProject, () => {
  it('creates nothing when the project, dataset, CORS entry, and owner invite all already exist', async () => {
    const tenant = baseTenant({
      sanityProjectId: 'proj123',
      sanityDataset: 'test-dataset',
    });
    listSanityDatasetsMock.mockImplementation(async () => {
      callOrder.push('listSanityDatasets');
      return [{ name: 'test-dataset' }];
    });
    listSanityCorsOriginsMock.mockImplementation(async () => {
      callOrder.push('listSanityCorsOrigins');
      return [{ id: 'cors1', origin: 'https://admin.example.com' }];
    });
    listSanityProjectInvitesMock.mockImplementation(async () => {
      callOrder.push('listSanityProjectInvites');
      return [{ email: 'owner@example.com', status: 'pending' }];
    });

    const result = await createTenantSanityProject(tenant, env);

    expect(result).toEqual({
      sanityProjectId: 'proj123',
      sanityDataset: 'test-dataset',
    });
    expect(createSanityProjectMock).not.toHaveBeenCalled();
    expect(setTenantSanityProjectMock).not.toHaveBeenCalled();
    expect(createSanityDatasetMock).not.toHaveBeenCalled();
    expect(addSanityCorsOriginMock).not.toHaveBeenCalled();
    expect(createSanityProjectInviteMock).not.toHaveBeenCalled();
    expect(listSanityDatasetsMock).toHaveBeenCalledWith({
      token: 'mgmt-token',
      projectId: 'proj123',
    });
    expect(listSanityCorsOriginsMock).toHaveBeenCalledWith({
      token: 'mgmt-token',
      projectId: 'proj123',
    });
  });

  it('creates the project, dataset, and CORS origin in order, persisting the project immediately after creation', async () => {
    const tenant = baseTenant();

    const result = await createTenantSanityProject(tenant, env);

    expect(createSanityProjectMock).toHaveBeenCalledWith({
      token: 'mgmt-token',
      displayName: 'Acme',
      organizationId: 'org-abc',
    });
    expect(setTenantSanityProjectMock).toHaveBeenCalledWith('tenant-1', {
      sanityProjectId: 'proj456',
      sanityDataset: 'test-dataset',
    });
    expect(createSanityDatasetMock).toHaveBeenCalledWith({
      token: 'mgmt-token',
      projectId: 'proj456',
      dataset: 'test-dataset',
    });
    expect(addSanityCorsOriginMock).toHaveBeenCalledWith({
      token: 'mgmt-token',
      projectId: 'proj456',
      origin: 'https://admin.example.com',
      allowCredentials: true,
    });
    expect(result).toEqual({
      sanityProjectId: 'proj456',
      sanityDataset: 'test-dataset',
    });

    // The persist call must land immediately after project creation and
    // before any dataset/CORS work — a retry after a later failure must
    // never re-mint a project it can no longer find.
    expect(callOrder.indexOf('createSanityProject')).toBe(0);
    expect(callOrder.indexOf('setTenantSanityProject')).toBe(1);
    expect(callOrder.indexOf('setTenantSanityProject')).toBeLessThan(
      callOrder.indexOf('createSanityDataset'),
    );
    expect(callOrder.indexOf('setTenantSanityProject')).toBeLessThan(
      callOrder.indexOf('addSanityCorsOrigin'),
    );
  });

  it('persists the created project before a later CORS failure propagates', async () => {
    const tenant = baseTenant();
    addSanityCorsOriginMock.mockImplementation(async () => {
      callOrder.push('addSanityCorsOrigin');
      throw new Error('CORS API is down');
    });

    await expect(createTenantSanityProject(tenant, env)).rejects.toThrow(
      /CORS API is down/,
    );

    expect(setTenantSanityProjectMock).toHaveBeenCalledWith('tenant-1', {
      sanityProjectId: 'proj456',
      sanityDataset: 'test-dataset',
    });
    expect(callOrder.indexOf('setTenantSanityProject')).toBeGreaterThan(-1);
    expect(callOrder.indexOf('setTenantSanityProject')).toBeLessThan(
      callOrder.indexOf('addSanityCorsOrigin'),
    );
  });

  it('only creates the dataset when the project is already persisted but the dataset is missing', async () => {
    const tenant = baseTenant({
      sanityProjectId: 'proj123',
      sanityDataset: 'test-dataset',
    });
    listSanityCorsOriginsMock.mockImplementation(async () => {
      callOrder.push('listSanityCorsOrigins');
      return [{ id: 'cors1', origin: 'https://admin.example.com' }];
    });

    const result = await createTenantSanityProject(tenant, env);

    expect(createSanityProjectMock).not.toHaveBeenCalled();
    expect(setTenantSanityProjectMock).not.toHaveBeenCalled();
    expect(createSanityDatasetMock).toHaveBeenCalledWith({
      token: 'mgmt-token',
      projectId: 'proj123',
      dataset: 'test-dataset',
    });
    expect(addSanityCorsOriginMock).not.toHaveBeenCalled();
    expect(result).toEqual({
      sanityProjectId: 'proj123',
      sanityDataset: 'test-dataset',
    });
  });

  it('only adds the CORS origin when the project and dataset already exist but the CORS entry is missing', async () => {
    const tenant = baseTenant({
      sanityProjectId: 'proj123',
      sanityDataset: 'test-dataset',
    });
    listSanityDatasetsMock.mockImplementation(async () => {
      callOrder.push('listSanityDatasets');
      return [{ name: 'test-dataset' }];
    });

    const result = await createTenantSanityProject(tenant, env);

    expect(createSanityProjectMock).not.toHaveBeenCalled();
    expect(setTenantSanityProjectMock).not.toHaveBeenCalled();
    expect(createSanityDatasetMock).not.toHaveBeenCalled();
    expect(addSanityCorsOriginMock).toHaveBeenCalledWith({
      token: 'mgmt-token',
      projectId: 'proj123',
      origin: 'https://admin.example.com',
      allowCredentials: true,
    });
    expect(result).toEqual({
      sanityProjectId: 'proj123',
      sanityDataset: 'test-dataset',
    });
  });

  it('resolves the tenant owner email and invites them as an editor when not already invited', async () => {
    const tenant = baseTenant();

    await createTenantSanityProject(tenant, env);

    expect(getTenantOwnerEmailMock).toHaveBeenCalledWith('tenant-1');
    expect(listSanityProjectInvitesMock).toHaveBeenCalledWith({
      token: 'mgmt-token',
      projectId: 'proj456',
    });
    expect(createSanityProjectInviteMock).toHaveBeenCalledWith({
      token: 'mgmt-token',
      projectId: 'proj456',
      email: 'owner@example.com',
      role: 'editor',
    });
  });

  it('does not re-invite an owner who already has a pending or accepted invite', async () => {
    const tenant = baseTenant({
      sanityProjectId: 'proj123',
      sanityDataset: 'test-dataset',
    });
    listSanityDatasetsMock.mockImplementation(async () => {
      callOrder.push('listSanityDatasets');
      return [{ name: 'test-dataset' }];
    });
    listSanityCorsOriginsMock.mockImplementation(async () => {
      callOrder.push('listSanityCorsOrigins');
      return [{ id: 'cors1', origin: 'https://admin.example.com' }];
    });
    listSanityProjectInvitesMock.mockImplementation(async () => {
      callOrder.push('listSanityProjectInvites');
      return [{ email: 'Owner@Example.com', status: 'accepted' }];
    });

    await createTenantSanityProject(tenant, env);

    expect(createSanityProjectInviteMock).not.toHaveBeenCalled();
  });

  it('does not re-invite when a retry finds the owner still pending, exercising the real invite-list parsing against a mocked fetch', async () => {
    const actual = await vi.importActual<
      typeof import('../lib/sanity-management-client')
    >('../lib/sanity-management-client');
    listSanityProjectInvitesMock.mockImplementation(
      actual.listSanityProjectInvites,
    );
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: [{ email: 'owner@example.com', status: 'pending' }],
          nextCursor: null,
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const tenant = baseTenant({
      sanityProjectId: 'proj123',
      sanityDataset: 'test-dataset',
    });
    listSanityDatasetsMock.mockImplementation(async () => {
      callOrder.push('listSanityDatasets');
      return [{ name: 'test-dataset' }];
    });
    listSanityCorsOriginsMock.mockImplementation(async () => {
      callOrder.push('listSanityCorsOrigins');
      return [{ id: 'cors1', origin: 'https://admin.example.com' }];
    });

    try {
      await createTenantSanityProject(tenant, env);

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.sanity.io/v2026-07-10/access/project/proj123/invites?status=pending&status=accepted',
        expect.anything(),
      );
      expect(createSanityProjectInviteMock).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('skips inviting when the tenant has no resolvable owner email, logging the gap', async () => {
    const tenant = baseTenant();
    getTenantOwnerEmailMock.mockImplementation(async () => {
      callOrder.push('getTenantOwnerEmail');
      return undefined;
    });
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const result = await createTenantSanityProject(tenant, env);

    expect(listSanityProjectInvitesMock).not.toHaveBeenCalled();
    expect(createSanityProjectInviteMock).not.toHaveBeenCalled();
    expect(result).toEqual({
      sanityProjectId: 'proj456',
      sanityDataset: 'test-dataset',
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('tenant-1'),
    );

    consoleErrorSpy.mockRestore();
  });

  it('propagates an invite API failure the same way a CORS API failure propagates', async () => {
    const tenant = baseTenant();
    createSanityProjectInviteMock.mockImplementation(async () => {
      callOrder.push('createSanityProjectInvite');
      throw new Error('Access API is down');
    });

    await expect(createTenantSanityProject(tenant, env)).rejects.toThrow(
      /Access API is down/,
    );

    // The project, dataset, and CORS work already landed before the invite
    // call — a retry must not re-do that work, matching the CORS-failure
    // test's expectation for the steps before it.
    expect(setTenantSanityProjectMock).toHaveBeenCalledWith('tenant-1', {
      sanityProjectId: 'proj456',
      sanityDataset: 'test-dataset',
    });
    expect(createSanityDatasetMock).toHaveBeenCalled();
    expect(addSanityCorsOriginMock).toHaveBeenCalled();
  });
});
