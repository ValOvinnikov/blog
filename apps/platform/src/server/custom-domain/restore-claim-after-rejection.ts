import 'server-only';

import { CUSTOM_DOMAIN_LOG } from '@platform/constants/custom-domain';
import { logger } from '@platform/utils/logger/logger';
import { queries } from '@shinefold/db';

export const restoreClaimAfterRejection = async (
  tenantId: string,
  domain: string,
  token: string,
): Promise<boolean> => {
  const restored = await queries.customDomainClaims.restoreCustomDomainClaim({
    tenantId,
    domain,
    token,
  });
  if (restored.ok) return true;

  logger.error(CUSTOM_DOMAIN_LOG.CLAIM_RESTORE_FAILED, {
    tenantId,
    domain,
    error: restored.error,
  });
  return false;
};
