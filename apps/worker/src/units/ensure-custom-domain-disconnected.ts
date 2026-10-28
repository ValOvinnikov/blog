import { deleteVercelProjectDomains } from '@blog/db/utils/vercel-client/vercel-project-domains';
import { sanitizeLogMessage } from '@blog/insight';
import { CUSTOM_DOMAIN_LOG } from '@worker/constants/custom-domain';
import { PROVISIONING_UNIT_MAX_RETRIES } from '@worker/constants/provisioning';
import { getDisconnectRefusal } from '@worker/utils/disconnect-guard/disconnect-guard';
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
    const refusal = await getDisconnectRefusal(domain);
    if (refusal) {
      throw new FatalError(
        `Domain "${domain}" cannot be disconnected: ${refusal}.`,
      );
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
