import { deleteVercelProjectDomains } from '@blog/db/utils/vercel-client/vercel-project-domains';
import { CUSTOM_DOMAIN_LOG } from '@worker/constants/custom-domain';
import { ENQUEUE_ERROR } from '@worker/constants/enqueue-error';
import { MOCK_SANITY_OUTAGE } from '@worker/testing/outage/fixtures';
import { MOCK_PROVISION_ENV } from '@worker/testing/provision-env/fake-provision-env';
import {
  MOCK_CUSTOM_DOMAIN,
  MOCK_TENANT_ID,
} from '@worker/testing/tenant/fixtures';
import { atStepAttempt } from '@worker/testing/workflow/step-attempt';
import { getDisconnectRefusal } from '@worker/utils/disconnect-guard/disconnect-guard';
import { logger } from '@worker/utils/logger/logger';
import { getVercelEnv } from '@worker/utils/vercel-env/vercel-env';

import { ensureCustomDomainDisconnected } from './ensure-custom-domain-disconnected';

vi.mock('@worker/utils/disconnect-guard/disconnect-guard');
vi.mock('@blog/db/utils/vercel-client/vercel-project-domains');
vi.mock('@worker/utils/vercel-env/vercel-env');
vi.mock('workflow');

describe(ensureCustomDomainDisconnected, () => {
  beforeEach(() => {
    atStepAttempt(1);
    vi.mocked(getVercelEnv).mockReturnValue(MOCK_PROVISION_ENV);
    vi.mocked(getDisconnectRefusal).mockResolvedValue(null);
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

  it.each([ENQUEUE_ERROR.DOMAIN_STILL_ASSIGNED, ENQUEUE_ERROR.DOMAIN_RESERVED])(
    'refuses to remove a domain with the %s refusal',
    async (refusal) => {
      vi.mocked(getDisconnectRefusal).mockResolvedValue(refusal);

      await expect(
        ensureCustomDomainDisconnected(MOCK_TENANT_ID, MOCK_CUSTOM_DOMAIN),
      ).rejects.toThrow(refusal);

      expect(deleteVercelProjectDomains).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(
        CUSTOM_DOMAIN_LOG.DISCONNECT_FAILED,
        expect.objectContaining({ tenantId: MOCK_TENANT_ID }),
      );
    },
  );

  it('fails without deleting when the guard cannot be evaluated', async () => {
    vi.mocked(getDisconnectRefusal).mockRejectedValue(
      new Error(MOCK_SANITY_OUTAGE),
    );

    await expect(
      ensureCustomDomainDisconnected(MOCK_TENANT_ID, MOCK_CUSTOM_DOMAIN),
    ).rejects.toThrow(MOCK_SANITY_OUTAGE);

    expect(deleteVercelProjectDomains).not.toHaveBeenCalled();
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
