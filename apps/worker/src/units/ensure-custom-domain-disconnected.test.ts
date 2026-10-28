import { getTenantByDomain } from '@blog/db/queries/tenant-domains/get-tenant-by-domain';
import { deleteVercelProjectDomains } from '@blog/db/utils/vercel-client/vercel-project-domains';
import { CUSTOM_DOMAIN_LOG } from '@worker/constants/custom-domain';
import { MOCK_SANITY_OUTAGE } from '@worker/testing/outage/fixtures';
import { MOCK_PROVISION_ENV } from '@worker/testing/provision-env/fake-provision-env';
import {
  MOCK_CUSTOM_DOMAIN,
  MOCK_TENANT_ID,
  mockProvisionedTenant,
} from '@worker/testing/tenant/fixtures';
import { atStepAttempt } from '@worker/testing/workflow/step-attempt';
import { logger } from '@worker/utils/logger/logger';
import { getVercelEnv } from '@worker/utils/vercel-env/vercel-env';

import { ensureCustomDomainDisconnected } from './ensure-custom-domain-disconnected';

vi.mock('@blog/db/queries/tenant-domains/get-tenant-by-domain');
vi.mock('@blog/db/utils/vercel-client/vercel-project-domains');
vi.mock('@worker/utils/vercel-env/vercel-env');
vi.mock('workflow');

describe(ensureCustomDomainDisconnected, () => {
  beforeEach(() => {
    atStepAttempt(1);
    vi.mocked(getVercelEnv).mockReturnValue(MOCK_PROVISION_ENV);
    vi.mocked(getTenantByDomain).mockResolvedValue(undefined);
  });

  it('removes only the domain from the web project', async () => {
    await ensureCustomDomainDisconnected(MOCK_TENANT_ID, MOCK_CUSTOM_DOMAIN);

    expect(deleteVercelProjectDomains).toHaveBeenCalledWith({
      token: MOCK_PROVISION_ENV.vercelToken,
      teamId: MOCK_PROVISION_ENV.vercelTeamId,
      projectId: MOCK_PROVISION_ENV.vercelWebProjectId,
      domains: [MOCK_CUSTOM_DOMAIN],
    });
  });

  it('refuses to remove a domain a tenant still routes', async () => {
    vi.mocked(getTenantByDomain).mockResolvedValue(mockProvisionedTenant());

    await expect(
      ensureCustomDomainDisconnected(MOCK_TENANT_ID, MOCK_CUSTOM_DOMAIN),
    ).rejects.toThrow();

    expect(deleteVercelProjectDomains).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      CUSTOM_DOMAIN_LOG.DISCONNECT_FAILED,
      expect.objectContaining({ tenantId: MOCK_TENANT_ID }),
    );
  });

  it('rethrows a transient failure silently before the final attempt', async () => {
    vi.mocked(deleteVercelProjectDomains).mockRejectedValue(
      new Error(MOCK_SANITY_OUTAGE),
    );

    await expect(
      ensureCustomDomainDisconnected(MOCK_TENANT_ID, MOCK_CUSTOM_DOMAIN),
    ).rejects.toThrow(MOCK_SANITY_OUTAGE);

    expect(logger.error).not.toHaveBeenCalled();
  });
});
