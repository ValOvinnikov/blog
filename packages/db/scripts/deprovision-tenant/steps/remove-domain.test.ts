import { MOCK_DEPROVISION_ENV } from '@blog/db/testing/deprovision-tenant/fixtures';
import {
  MOCK_TENANT_DOMAIN,
  mockTenant,
} from '@blog/db/testing/tenants/fixtures';

import { removeTenantDomain } from './remove-domain';

const { deleteVercelProjectDomainMock } = vi.hoisted(() => ({
  deleteVercelProjectDomainMock: vi.fn(),
}));

vi.mock('@blog/db/utils/vercel-client/vercel-project-domains', () => ({
  deleteVercelProjectDomain: deleteVercelProjectDomainMock,
}));

const MOCK_TENANT = mockTenant({ primaryDomain: MOCK_TENANT_DOMAIN });

beforeEach(() => {
  deleteVercelProjectDomainMock.mockReset().mockResolvedValue({
    alreadyGone: false,
  });
});

describe(removeTenantDomain, () => {
  it('removes the domain from the shared web project', async () => {
    await removeTenantDomain(MOCK_TENANT, MOCK_DEPROVISION_ENV);

    expect(deleteVercelProjectDomainMock).toHaveBeenCalledWith({
      token: MOCK_DEPROVISION_ENV.vercelToken,
      teamId: undefined,
      projectId: MOCK_DEPROVISION_ENV.vercelWebProjectId,
      domain: MOCK_TENANT_DOMAIN,
    });
  });

  it('does not call the API in dry-run mode', async () => {
    await removeTenantDomain(MOCK_TENANT, {
      ...MOCK_DEPROVISION_ENV,
      dryRun: true,
    });

    expect(deleteVercelProjectDomainMock).not.toHaveBeenCalled();
  });
});
