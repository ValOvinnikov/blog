import { TENANT_PROVISIONING_STATUS } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';
import { makeTenant } from '@worker/testing/tenant/fixtures';
import type { TProvisionEnv } from '@worker/utils/provision-env/provision-env';

import { mapTenantDomain } from './map-domain';

const { listVercelProjectDomainsMock, addVercelProjectDomainMock } = vi.hoisted(
  () => ({
    listVercelProjectDomainsMock: vi.fn(),
    addVercelProjectDomainMock: vi.fn(),
  }),
);

vi.mock('@worker/utils/vercel-client/vercel-client', () => ({
  listVercelProjectDomains: listVercelProjectDomainsMock,
  addVercelProjectDomain: addVercelProjectDomainMock,
}));

const TENANT_DOMAIN = 'acme.example.com';

const env: TProvisionEnv = {
  sanityManagementToken: 'mgmt-token',
  sanityOrganizationId: 'org-abc',
  vercelToken: 'v-token',
  vercelTeamId: undefined,
  vercelWebProjectId: 'prj_web',
  adminAppBaseUrl: 'https://admin.example.com',
  tenantSanityDataset: 'test-dataset',
  webAppBaseUrl: 'https://example.com',
  revalidateSecret: 'revalidate-shh',
};

function baseTenant(overrides: Partial<TTenant> = {}): TTenant {
  return makeTenant({
    primaryDomain: TENANT_DOMAIN,
    sanityProjectId: 'proj123',
    sanityDataset: 'production',
    sanityReadTokenEncrypted: 'enc',
    provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
    seededAt: new Date(),
    ...overrides,
  });
}

beforeEach(() => {
  listVercelProjectDomainsMock.mockReset();
  addVercelProjectDomainMock.mockReset();
});

describe(mapTenantDomain, () => {
  let tenant: TTenant;

  beforeEach(() => {
    tenant = baseTenant();
  });

  it('adds the domain to the shared web project when not already registered', async () => {
    listVercelProjectDomainsMock.mockResolvedValue([
      { name: 'other-tenant.example.com' },
    ]);
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
      domain: TENANT_DOMAIN,
    });
  });

  it('skips adding the domain when already registered on the project', async () => {
    listVercelProjectDomainsMock.mockResolvedValue([{ name: TENANT_DOMAIN }]);
    await mapTenantDomain(tenant, env);

    expect(addVercelProjectDomainMock).not.toHaveBeenCalled();
  });
});
