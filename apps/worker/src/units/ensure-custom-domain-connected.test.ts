import { getTenantByDomain } from '@blog/db/queries/tenant-domains/get-tenant-by-domain';
import { CUSTOM_DOMAIN_LOG } from '@worker/constants/custom-domain';
import { PROVISIONING_UNIT_MAX_RETRIES } from '@worker/constants/provisioning';
import { mapTenantDomain } from '@worker/steps/map-domain';
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

import { ensureCustomDomainConnected } from './ensure-custom-domain-connected';

vi.mock('@blog/db/queries/tenant-domains/get-tenant-by-domain');
vi.mock('@worker/steps/map-domain');
vi.mock('@worker/utils/vercel-env/vercel-env');
vi.mock('workflow');

describe(ensureCustomDomainConnected, () => {
  beforeEach(() => {
    atStepAttempt(1);
    vi.mocked(getVercelEnv).mockReturnValue(MOCK_PROVISION_ENV);
    vi.mocked(getTenantByDomain).mockResolvedValue(mockProvisionedTenant());
  });

  it('maps the domain onto the web project', async () => {
    await ensureCustomDomainConnected(MOCK_TENANT_ID, MOCK_CUSTOM_DOMAIN);

    expect(mapTenantDomain).toHaveBeenCalledWith(
      MOCK_CUSTOM_DOMAIN,
      MOCK_PROVISION_ENV,
    );
  });

  it('fails without mapping when the domain is no longer assigned to the tenant', async () => {
    vi.mocked(getTenantByDomain).mockResolvedValue(undefined);

    await expect(
      ensureCustomDomainConnected(MOCK_TENANT_ID, MOCK_CUSTOM_DOMAIN),
    ).rejects.toThrow();

    expect(mapTenantDomain).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      CUSTOM_DOMAIN_LOG.CONNECT_FAILED,
      expect.objectContaining({ tenantId: MOCK_TENANT_ID }),
    );
  });

  it('rethrows a transient failure silently before the final attempt', async () => {
    vi.mocked(mapTenantDomain).mockRejectedValue(new Error(MOCK_SANITY_OUTAGE));

    await expect(
      ensureCustomDomainConnected(MOCK_TENANT_ID, MOCK_CUSTOM_DOMAIN),
    ).rejects.toThrow(MOCK_SANITY_OUTAGE);

    expect(logger.error).not.toHaveBeenCalled();
  });

  it('logs a failure once its retries are spent', async () => {
    atStepAttempt(PROVISIONING_UNIT_MAX_RETRIES + 1);
    vi.mocked(mapTenantDomain).mockRejectedValue(new Error(MOCK_SANITY_OUTAGE));

    await expect(
      ensureCustomDomainConnected(MOCK_TENANT_ID, MOCK_CUSTOM_DOMAIN),
    ).rejects.toThrow(MOCK_SANITY_OUTAGE);

    expect(logger.error).toHaveBeenCalledWith(
      CUSTOM_DOMAIN_LOG.CONNECT_FAILED,
      {
        tenantId: MOCK_TENANT_ID,
        domain: MOCK_CUSTOM_DOMAIN,
        error: MOCK_SANITY_OUTAGE,
      },
    );
  });
});
