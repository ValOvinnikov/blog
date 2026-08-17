import type { TTenant } from '@blog/db/schema/tenants';

import type { TProvisionEnv } from '../lib/env';

import { createTenantSanityProject } from './create-sanity-project';

const {
  setTenantSanityProjectMock,
  createSanityProjectMock,
  createSanityDatasetMock,
  addSanityCorsOriginMock,
} = vi.hoisted(() => ({
  setTenantSanityProjectMock: vi.fn(),
  createSanityProjectMock: vi.fn(),
  createSanityDatasetMock: vi.fn(),
  addSanityCorsOriginMock: vi.fn(),
}));

vi.mock('@blog/db/queries/tenants', () => ({
  setTenantSanityProject: setTenantSanityProjectMock,
}));

vi.mock('../lib/sanity-management-client', () => ({
  createSanityProject: createSanityProjectMock,
  createSanityDataset: createSanityDatasetMock,
  addSanityCorsOrigin: addSanityCorsOriginMock,
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
  setTenantSanityProjectMock.mockReset();
  createSanityProjectMock.mockReset();
  createSanityDatasetMock.mockReset();
  addSanityCorsOriginMock.mockReset();
});

describe(createTenantSanityProject, () => {
  it('skips creation and returns the persisted values when already provisioned', async () => {
    const tenant = baseTenant({
      sanityProjectId: 'proj123',
      sanityDataset: 'production',
    });

    const result = await createTenantSanityProject(tenant, env);

    expect(result).toEqual({
      sanityProjectId: 'proj123',
      sanityDataset: 'production',
    });
    expect(createSanityProjectMock).not.toHaveBeenCalled();
    expect(setTenantSanityProjectMock).not.toHaveBeenCalled();
  });

  it('creates the project, dataset, and CORS origin, then persists the result', async () => {
    const tenant = baseTenant();
    createSanityProjectMock.mockResolvedValue({ id: 'proj456' });

    const result = await createTenantSanityProject(tenant, env);

    expect(createSanityProjectMock).toHaveBeenCalledWith({
      token: 'mgmt-token',
      displayName: 'Acme',
      organizationId: 'org-abc',
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
    expect(setTenantSanityProjectMock).toHaveBeenCalledWith('tenant-1', {
      sanityProjectId: 'proj456',
      sanityDataset: 'production',
    });
    expect(result).toEqual({
      sanityProjectId: 'proj456',
      sanityDataset: 'production',
    });
  });
});
