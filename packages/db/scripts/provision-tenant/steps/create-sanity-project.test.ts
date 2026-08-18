import type { TTenant } from '@blog/db/schema/tenants';

import type { TProvisionEnv } from '../lib/env';

import { createTenantSanityProject } from './create-sanity-project';

const {
  setTenantSanityProjectMock,
  createSanityProjectMock,
  createSanityDatasetMock,
  addSanityCorsOriginMock,
  listSanityDatasetsMock,
  listSanityCorsOriginsMock,
  callOrder,
} = vi.hoisted(() => {
  const callOrder: string[] = [];
  return {
    setTenantSanityProjectMock: vi.fn(),
    createSanityProjectMock: vi.fn(),
    createSanityDatasetMock: vi.fn(),
    addSanityCorsOriginMock: vi.fn(),
    listSanityDatasetsMock: vi.fn(),
    listSanityCorsOriginsMock: vi.fn(),
    callOrder,
  };
});

vi.mock('@blog/db/queries/tenants', () => ({
  setTenantSanityProject: setTenantSanityProjectMock,
}));

vi.mock('../lib/sanity-management-client', () => ({
  createSanityProject: createSanityProjectMock,
  createSanityDataset: createSanityDatasetMock,
  addSanityCorsOrigin: addSanityCorsOriginMock,
  listSanityDatasets: listSanityDatasetsMock,
  listSanityCorsOrigins: listSanityCorsOriginsMock,
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
  webAppBaseUrl: 'https://example.com',
  revalidateSecret: 'revalidate-shh',
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
  createSanityProjectMock.mockReset();
  createSanityDatasetMock.mockReset();
  addSanityCorsOriginMock.mockReset();
  listSanityDatasetsMock.mockReset();
  listSanityCorsOriginsMock.mockReset();

  setTenantSanityProjectMock.mockImplementation(async () => {
    callOrder.push('setTenantSanityProject');
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
  listSanityDatasetsMock.mockImplementation(async () => {
    callOrder.push('listSanityDatasets');
    return [];
  });
  listSanityCorsOriginsMock.mockImplementation(async () => {
    callOrder.push('listSanityCorsOrigins');
    return [];
  });
});

describe(createTenantSanityProject, () => {
  it('creates nothing when the project, dataset, and CORS entry all already exist', async () => {
    const tenant = baseTenant({
      sanityProjectId: 'proj123',
      sanityDataset: 'production',
    });
    listSanityDatasetsMock.mockImplementation(async () => {
      callOrder.push('listSanityDatasets');
      return [{ name: 'production' }];
    });
    listSanityCorsOriginsMock.mockImplementation(async () => {
      callOrder.push('listSanityCorsOrigins');
      return [{ id: 'cors1', origin: 'https://admin.example.com' }];
    });

    const result = await createTenantSanityProject(tenant, env);

    expect(result).toEqual({
      sanityProjectId: 'proj123',
      sanityDataset: 'production',
    });
    expect(createSanityProjectMock).not.toHaveBeenCalled();
    expect(setTenantSanityProjectMock).not.toHaveBeenCalled();
    expect(createSanityDatasetMock).not.toHaveBeenCalled();
    expect(addSanityCorsOriginMock).not.toHaveBeenCalled();
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
      sanityDataset: 'production',
    });
    expect(createSanityDatasetMock).toHaveBeenCalledWith({
      token: 'mgmt-token',
      projectId: 'proj456',
      dataset: 'production',
    });
    expect(addSanityCorsOriginMock).toHaveBeenCalledWith({
      token: 'mgmt-token',
      projectId: 'proj456',
      origin: 'https://admin.example.com',
      allowCredentials: true,
    });
    expect(result).toEqual({
      sanityProjectId: 'proj456',
      sanityDataset: 'production',
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
      sanityDataset: 'production',
    });
    expect(callOrder.indexOf('setTenantSanityProject')).toBeGreaterThan(-1);
    expect(callOrder.indexOf('setTenantSanityProject')).toBeLessThan(
      callOrder.indexOf('addSanityCorsOrigin'),
    );
  });

  it('only creates the dataset when the project is already persisted but the dataset is missing', async () => {
    const tenant = baseTenant({
      sanityProjectId: 'proj123',
      sanityDataset: 'production',
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
      dataset: 'production',
    });
    expect(addSanityCorsOriginMock).not.toHaveBeenCalled();
    expect(result).toEqual({
      sanityProjectId: 'proj123',
      sanityDataset: 'production',
    });
  });

  it('only adds the CORS origin when the project and dataset already exist but the CORS entry is missing', async () => {
    const tenant = baseTenant({
      sanityProjectId: 'proj123',
      sanityDataset: 'production',
    });
    listSanityDatasetsMock.mockImplementation(async () => {
      callOrder.push('listSanityDatasets');
      return [{ name: 'production' }];
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
      sanityDataset: 'production',
    });
  });
});
