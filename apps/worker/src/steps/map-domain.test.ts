import { TENANT_PROVISIONING_STATUS } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';
import { faker } from '@faker-js/faker';
import { MOCK_NOW } from '@worker/testing/clock/frozen-clock';
import { MOCK_PROVISION_ENV } from '@worker/testing/provision-env/fake-provision-env';
import {
  MOCK_ENCRYPTED_TOKEN,
  MOCK_TENANT_DOMAIN,
  mockProvisionedTenant,
} from '@worker/testing/tenant/fixtures';
import {
  addVercelProjectDomain,
  listVercelProjectDomains,
} from '@worker/utils/vercel-client/vercel-client';

import { mapTenantDomain } from './map-domain';

faker.seed(6025);

const MOCK_OTHER_TENANT_DOMAIN = faker.internet.domainName();
const { vercelToken, vercelTeamId, vercelWebProjectId } = MOCK_PROVISION_ENV;

vi.mock('@worker/utils/vercel-client/vercel-client');

describe(mapTenantDomain, () => {
  let tenant: TTenant;

  beforeEach(() => {
    tenant = mockProvisionedTenant({
      sanityReadTokenEncrypted: MOCK_ENCRYPTED_TOKEN,
      provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
      seededAt: MOCK_NOW,
    });
  });

  it('adds the domain to the web project when not already registered', async () => {
    vi.mocked(listVercelProjectDomains).mockResolvedValue([
      { name: MOCK_OTHER_TENANT_DOMAIN },
    ]);
    await mapTenantDomain(tenant, MOCK_PROVISION_ENV);

    expect(listVercelProjectDomains).toHaveBeenCalledWith({
      token: vercelToken,
      teamId: vercelTeamId,
      projectId: vercelWebProjectId,
    });
    expect(addVercelProjectDomain).toHaveBeenCalledWith({
      token: vercelToken,
      teamId: vercelTeamId,
      projectId: vercelWebProjectId,
      domain: MOCK_TENANT_DOMAIN,
    });
  });

  it('skips adding the domain when already registered on the project', async () => {
    vi.mocked(listVercelProjectDomains).mockResolvedValue([
      { name: MOCK_TENANT_DOMAIN },
    ]);
    await mapTenantDomain(tenant, MOCK_PROVISION_ENV);

    expect(addVercelProjectDomain).not.toHaveBeenCalled();
  });
});
