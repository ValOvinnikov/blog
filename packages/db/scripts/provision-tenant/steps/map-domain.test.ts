import type { TTenant } from '@blog/db/schema/tenants';

import type { TProvisionEnv } from '../lib/env';

import { mapTenantDomain } from './map-domain';

const { listVercelProjectDomainsMock, addVercelProjectDomainMock } = vi.hoisted(
  () => ({
    listVercelProjectDomainsMock: vi.fn(),
    addVercelProjectDomainMock: vi.fn(),
  }),
);

vi.mock('../lib/vercel-client', () => ({
  listVercelProjectDomains: listVercelProjectDomainsMock,
  addVercelProjectDomain: addVercelProjectDomainMock,
}));

const env: TProvisionEnv = {
  sanityManagementToken: 'mgmt-token',
  vercelToken: 'v-token',
  vercelOrgId: 'org_1',
  vercelTeamId: undefined,
  vercelWebProjectId: 'prj_web',
  vercelCliVersion: '48.0.0',
  adminAppBaseUrl: 'https://admin.example.com',
  callbackSecret: 'shh',
  platformDomain: 'valstack.dev',
};

function baseTenant(overrides: Partial<TTenant> = {}): TTenant {
  return {
    id: 'tenant-1',
    slug: 'acme',
    name: 'Acme',
    primaryDomain: 'acme.example.com',
    sanityProjectId: 'proj123',
    sanityDataset: 'production',
    sanityReadTokenEncrypted: 'enc',
    locale: 'en',
    plan: 'FREE',
    status: 'ACTIVE',
    provisioningStatus: 'PROVISIONING',
    provisioningSteps: null,
    studioVercelProjectId: 'prj_studio',
    seededAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as TTenant;
}

beforeEach(() => {
  listVercelProjectDomainsMock.mockReset();
  addVercelProjectDomainMock.mockReset();
});

describe(mapTenantDomain, () => {
  it('adds the domain to the shared web project when not already registered', async () => {
    listVercelProjectDomainsMock.mockResolvedValue([
      { name: 'other-tenant.example.com' },
    ]);
    const tenant = baseTenant();

    await mapTenantDomain(tenant, env);

    expect(listVercelProjectDomainsMock).toHaveBeenCalledWith({
      token: 'v-token',
      teamId: undefined,
      projectId: 'prj_web',
    });
    expect(addVercelProjectDomainMock).toHaveBeenCalledWith({
      token: 'v-token',
      teamId: undefined,
      projectId: 'prj_web',
      domain: 'acme.example.com',
    });
  });

  it('skips adding the domain when already registered on the project', async () => {
    listVercelProjectDomainsMock.mockResolvedValue([
      { name: 'acme.example.com' },
    ]);
    const tenant = baseTenant();

    await mapTenantDomain(tenant, env);

    expect(addVercelProjectDomainMock).not.toHaveBeenCalled();
  });
});
