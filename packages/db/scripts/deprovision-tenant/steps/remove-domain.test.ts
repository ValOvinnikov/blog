import {
  MOCK_DEPROVISION_DRY_RUN_ENV,
  MOCK_DEPROVISION_ENV,
} from '@blog/db/testing/deprovision-tenant/fixtures';
import {
  MOCK_TENANT_DOMAIN,
  mockTenant,
} from '@blog/db/testing/tenants/fixtures';
import { deleteVercelProjectDomain } from '@blog/db/utils/vercel-client/vercel-project-domains';
import { faker } from '@faker-js/faker';

import { removeTenantDomain } from './remove-domain';

vi.mock('@blog/db/utils/vercel-client/vercel-project-domains');

faker.seed(5765);

const MOCK_TENANT = mockTenant({ primaryDomain: MOCK_TENANT_DOMAIN });

describe(removeTenantDomain, () => {
  it('removes the domain from the shared web project', async () => {
    await removeTenantDomain(MOCK_TENANT, MOCK_DEPROVISION_ENV);

    expect(deleteVercelProjectDomain).toHaveBeenCalledWith({
      token: MOCK_DEPROVISION_ENV.vercelToken,
      teamId: MOCK_DEPROVISION_ENV.vercelTeamId,
      projectId: MOCK_DEPROVISION_ENV.vercelWebProjectId,
      domain: MOCK_TENANT_DOMAIN,
    });
  });

  it('does not call the API in dry-run mode', async () => {
    await removeTenantDomain(MOCK_TENANT, MOCK_DEPROVISION_DRY_RUN_ENV);

    expect(deleteVercelProjectDomain).not.toHaveBeenCalled();
  });
});
