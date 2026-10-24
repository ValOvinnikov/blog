import { TENANT_PROVISIONING_STATUS } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';
import { MOCK_PROVISION_ENV } from '@worker/testing/provision-env/fake-provision-env';
import {
  MOCK_ENCRYPTED_TOKEN,
  MOCK_TENANT_DOMAIN,
  mockProvisionedTenant,
} from '@worker/testing/tenant/fixtures';

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

const { vercelToken, vercelWebProjectId } = MOCK_PROVISION_ENV;

beforeEach(() => {
  listVercelProjectDomainsMock.mockReset();
  addVercelProjectDomainMock.mockReset();
});

describe(mapTenantDomain, () => {
  let tenant: TTenant;

  beforeEach(() => {
    tenant = mockProvisionedTenant({
      sanityReadTokenEncrypted: MOCK_ENCRYPTED_TOKEN,
      provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
      seededAt: new Date(),
    });
  });

  it('adds the domain to the shared web project when not already registered', async () => {
    listVercelProjectDomainsMock.mockResolvedValue([
      { name: 'other-tenant.example.com' },
    ]);
    await mapTenantDomain(tenant, MOCK_PROVISION_ENV);

    expect(listVercelProjectDomainsMock).toHaveBeenCalledWith({
      token: vercelToken,
      teamId: undefined,
      projectId: vercelWebProjectId,
    });
    expect(addVercelProjectDomainMock).toHaveBeenCalledWith({
      token: vercelToken,
      teamId: undefined,
      projectId: vercelWebProjectId,
      domain: MOCK_TENANT_DOMAIN,
    });
  });

  it('skips adding the domain when already registered on the project', async () => {
    listVercelProjectDomainsMock.mockResolvedValue([
      { name: MOCK_TENANT_DOMAIN },
    ]);
    await mapTenantDomain(tenant, MOCK_PROVISION_ENV);

    expect(addVercelProjectDomainMock).not.toHaveBeenCalled();
  });
});
