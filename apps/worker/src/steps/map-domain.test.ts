import { faker } from '@faker-js/faker';
import { MOCK_PROVISION_ENV } from '@worker/testing/provision-env/fake-provision-env';
import { MOCK_TENANT_DOMAIN } from '@worker/testing/tenant/fixtures';
import {
  addVercelProjectDomain,
  listVercelProjectDomains,
} from '@worker/utils/vercel-client/vercel-client';

import { mapTenantDomain } from './map-domain';

faker.seed(7005);

const MOCK_OTHER_TENANT_DOMAIN = faker.internet.domainName();
const { vercelToken, vercelTeamId, vercelWebProjectId } = MOCK_PROVISION_ENV;

vi.mock('@worker/utils/vercel-client/vercel-client');

describe(mapTenantDomain, () => {
  it('adds the domain to the web project when not already registered', async () => {
    vi.mocked(listVercelProjectDomains).mockResolvedValue([
      { name: MOCK_OTHER_TENANT_DOMAIN },
    ]);
    await mapTenantDomain(MOCK_TENANT_DOMAIN, MOCK_PROVISION_ENV);

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
    await mapTenantDomain(MOCK_TENANT_DOMAIN, MOCK_PROVISION_ENV);

    expect(addVercelProjectDomain).not.toHaveBeenCalled();
  });
});
