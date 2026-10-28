import { listTenantHosts } from '@blog/db/queries/tenant-domains/list-tenant-hosts';
import {
  MOCK_DEPROVISION_DRY_RUN_ENV,
  MOCK_DEPROVISION_ENV,
} from '@blog/db/testing/deprovision-tenant/fixtures';
import { MOCK_WWW_TENANT_DOMAIN } from '@blog/db/testing/tenant-domains/fixtures';
import {
  MOCK_TENANT_DOMAIN,
  mockTenant,
} from '@blog/db/testing/tenants/fixtures';
import { deleteVercelProjectDomains } from '@blog/db/utils/vercel-client/vercel-project-domains';
import { faker } from '@faker-js/faker';

import { removeTenantDomain } from './remove-domain';

vi.mock('@blog/db/utils/vercel-client/vercel-project-domains');
vi.mock('@blog/db/queries/tenant-domains/list-tenant-hosts');

faker.seed(5765);

const MOCK_TENANT = mockTenant({ primaryDomain: MOCK_TENANT_DOMAIN });
const MOCK_HOSTS = [MOCK_TENANT_DOMAIN, MOCK_WWW_TENANT_DOMAIN];

describe(removeTenantDomain, () => {
  beforeEach(() => {
    vi.mocked(listTenantHosts).mockResolvedValue(MOCK_HOSTS);
  });

  it('removes every tenant host from the shared web project', async () => {
    await removeTenantDomain(MOCK_TENANT, MOCK_DEPROVISION_ENV);

    expect(deleteVercelProjectDomains).toHaveBeenCalledWith({
      token: MOCK_DEPROVISION_ENV.vercelToken,
      teamId: MOCK_DEPROVISION_ENV.vercelTeamId,
      projectId: MOCK_DEPROVISION_ENV.vercelWebProjectId,
      domains: MOCK_HOSTS,
    });
  });

  it('does not call the API in dry-run mode', async () => {
    await removeTenantDomain(MOCK_TENANT, MOCK_DEPROVISION_DRY_RUN_ENV);

    expect(deleteVercelProjectDomains).not.toHaveBeenCalled();
  });
});
