import { getTenantByDomain } from '@blog/db/queries/tenant-domains/get-tenant-by-domain';
import { sanitizeLogMessage } from '@blog/insight';
import { CUSTOM_DOMAIN_LOG } from '@worker/constants/custom-domain';
import { PROVISIONING_UNIT_MAX_RETRIES } from '@worker/constants/provisioning';
import { mapTenantDomain } from '@worker/steps/map-domain';
import { logger } from '@worker/utils/logger/logger';
import { getVercelEnv } from '@worker/utils/vercel-env/vercel-env';
import { FatalError } from 'workflow';

import { isFinalStepAttempt } from './run-reported-step';

export async function ensureCustomDomainConnected(
  tenantId: string,
  domain: string,
): Promise<void> {
  'use step';

  try {
    const assignedTenant = await getTenantByDomain(domain);
    if (assignedTenant?.id !== tenantId) {
      throw new FatalError(
        `Domain "${domain}" is not assigned to tenant "${tenantId}".`,
      );
    }
    await mapTenantDomain(domain, getVercelEnv());
  } catch (error) {
    if (isFinalStepAttempt(error)) {
      logger.error(CUSTOM_DOMAIN_LOG.CONNECT_FAILED, {
        tenantId,
        domain,
        error: sanitizeLogMessage(error),
      });
    }
    throw error;
  }
}

ensureCustomDomainConnected.maxRetries = PROVISIONING_UNIT_MAX_RETRIES;
