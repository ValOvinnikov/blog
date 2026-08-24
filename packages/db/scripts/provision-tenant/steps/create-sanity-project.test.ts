import type { TTenant } from '@blog/db/schema/tenants';

import type { TProvisionEnv } from '../lib/env';

import { createTenantSanityProject } from './create-sanity-project';

const {
  setTenantSanityProjectMock,
  getTenantOwnerEmailMock,
  getFirstAdminEmailMock,
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
    getFirstAdminEmailMock: vi.fn(),
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

vi.mock('@blog/db/queries/admins', () => ({
  getFirstAdminEmail: getFirstAdminEmailMock,
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
  callbackSecret: 'shh',
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
  getFirstAdminEmailMock.mockReset();
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
  getFirstAdminEmailMock.mockImplementation(async () => {
    callOrder.push('getFirstAdminEmail');
    return 'superadmin@example.com';
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
  it('creates nothing when the project, dataset, CORS entry, and owner/superadmin invites all already exist', async () => {
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
      return [
        { email: 'owner@example.com', status: 'pending' },
        { email: 'superadmin@example.com', status: 'pending' },
      ];
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

  it('resolves the tenant owner email and invites them as an administrator when not already invited', async () => {
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
      role: 'administrator',
    });
  });

  it('invites both the owner and the superadmin as administrator when they are distinct emails', async () => {
    const tenant = baseTenant();

    await createTenantSanityProject(tenant, env);

    expect(createSanityProjectInviteMock).toHaveBeenCalledTimes(2);
    expect(createSanityProjectInviteMock).toHaveBeenNthCalledWith(1, {
      token: 'mgmt-token',
      projectId: 'proj456',
      email: 'owner@example.com',
      role: 'administrator',
    });
    expect(createSanityProjectInviteMock).toHaveBeenNthCalledWith(2, {
      token: 'mgmt-token',
      projectId: 'proj456',
      email: 'superadmin@example.com',
      role: 'administrator',
    });
  });

  it('does not re-invite an owner who already has a pending or accepted invite', async () => {
    const tenant = baseTenant({
      sanityProjectId: 'proj123',
      sanityDataset: 'test-dataset',
    });
    getFirstAdminEmailMock.mockImplementation(async () => {
      callOrder.push('getFirstAdminEmail');
      return undefined;
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
    getFirstAdminEmailMock.mockImplementation(async () => {
      callOrder.push('getFirstAdminEmail');
      return undefined;
    });
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

  it('skips inviting when the tenant has no resolvable owner email or admins row, logging both gaps', async () => {
    const tenant = baseTenant();
    getTenantOwnerEmailMock.mockImplementation(async () => {
      callOrder.push('getTenantOwnerEmail');
      return undefined;
    });
    getFirstAdminEmailMock.mockImplementation(async () => {
      callOrder.push('getFirstAdminEmail');
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
    expect(consoleErrorSpy).toHaveBeenCalledTimes(2);

    consoleErrorSpy.mockRestore();
  });

  it('still invites the superadmin when the tenant has no resolvable owner email', async () => {
    const tenant = baseTenant();
    getTenantOwnerEmailMock.mockImplementation(async () => {
      callOrder.push('getTenantOwnerEmail');
      return undefined;
    });
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    await createTenantSanityProject(tenant, env);

    expect(createSanityProjectInviteMock).toHaveBeenCalledTimes(1);
    expect(createSanityProjectInviteMock).toHaveBeenCalledWith({
      token: 'mgmt-token',
      projectId: 'proj456',
      email: 'superadmin@example.com',
      role: 'administrator',
    });

    consoleErrorSpy.mockRestore();
  });

  it('resolves the platform superadmin email and invites them as an administrator when not already invited', async () => {
    const tenant = baseTenant();

    await createTenantSanityProject(tenant, env);

    expect(getFirstAdminEmailMock).toHaveBeenCalled();
    expect(createSanityProjectInviteMock).toHaveBeenCalledWith({
      token: 'mgmt-token',
      projectId: 'proj456',
      email: 'superadmin@example.com',
      role: 'administrator',
    });
  });

  it('does not re-invite a superadmin who already has a pending or accepted invite', async () => {
    const tenant = baseTenant({
      sanityProjectId: 'proj123',
      sanityDataset: 'test-dataset',
    });
    getTenantOwnerEmailMock.mockImplementation(async () => {
      callOrder.push('getTenantOwnerEmail');
      return undefined;
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
      return [{ email: 'Superadmin@Example.com', status: 'accepted' }];
    });
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    await createTenantSanityProject(tenant, env);

    expect(createSanityProjectInviteMock).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('skips inviting when there is no admins row at all, without crashing the step', async () => {
    const tenant = baseTenant();
    getFirstAdminEmailMock.mockImplementation(async () => {
      callOrder.push('getFirstAdminEmail');
      return undefined;
    });
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const result = await createTenantSanityProject(tenant, env);

    expect(createSanityProjectInviteMock).toHaveBeenCalledTimes(1);
    expect(createSanityProjectInviteMock).toHaveBeenCalledWith({
      token: 'mgmt-token',
      projectId: 'proj456',
      email: 'owner@example.com',
      role: 'administrator',
    });
    expect(result).toEqual({
      sanityProjectId: 'proj456',
      sanityDataset: 'test-dataset',
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('no admins row found'),
    );

    consoleErrorSpy.mockRestore();
  });

  it('invites the owner and superadmin only once when they resolve to the same email, avoiding a duplicate-invite 400', async () => {
    const tenant = baseTenant();
    getFirstAdminEmailMock.mockImplementation(async () => {
      callOrder.push('getFirstAdminEmail');
      return 'owner@example.com';
    });

    await createTenantSanityProject(tenant, env);

    expect(createSanityProjectInviteMock).toHaveBeenCalledTimes(1);
    expect(createSanityProjectInviteMock).toHaveBeenCalledWith({
      token: 'mgmt-token',
      projectId: 'proj456',
      email: 'owner@example.com',
      role: 'administrator',
    });
  });

  it('treats the owner/superadmin email match case-insensitively', async () => {
    const tenant = baseTenant();
    getFirstAdminEmailMock.mockImplementation(async () => {
      callOrder.push('getFirstAdminEmail');
      return 'Owner@Example.com';
    });

    await createTenantSanityProject(tenant, env);

    expect(createSanityProjectInviteMock).toHaveBeenCalledTimes(1);
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
