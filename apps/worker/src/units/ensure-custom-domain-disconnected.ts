import { getTenantByDomain } from '@blog/db/queries/tenant-domains/get-tenant-by-domain';
import { deleteVercelProjectDomains } from '@blog/db/utils/vercel-client/vercel-project-domains';
import { sanitizeLogMessage } from '@blog/insight';
import { CUSTOM_DOMAIN_LOG } from '@worker/constants/custom-domain';
import { PROVISIONING_UNIT_MAX_RETRIES } from '@worker/constants/provisioning';
import { logger } from '@worker/utils/logger/logger';
import { getVercelEnv } from '@worker/utils/vercel-env/vercel-env';
import { FatalError } from 'workflow';

import { isFinalStepAttempt } from './run-reported-step';

export async function ensureCustomDomainDisconnected(
  tenantId: string,
  domain: string,
): Promise<void> {
  'use step';

  try {
    if (await getTenantByDomain(domain)) {
      throw new FatalError(`Domain "${domain}" is still assigned to a tenant.`);
    }
    const { vercelToken, vercelTeamId, vercelWebProjectId } = getVercelEnv();
    await deleteVercelProjectDomains({
      token: vercelToken,
      teamId: vercelTeamId,
      projectId: vercelWebProjectId,
      domains: [domain],
    });
  } catch (error) {
    if (isFinalStepAttempt(error)) {
      logger.error(CUSTOM_DOMAIN_LOG.DISCONNECT_FAILED, {
        tenantId,
        domain,
        error: sanitizeLogMessage(error),
      });
    }
    throw error;
  }
}

ensureCustomDomainDisconnected.maxRetries = PROVISIONING_UNIT_MAX_RETRIES;
