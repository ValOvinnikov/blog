import 'server-only';

import { HTTP_STATUS } from '@blog/config';
import { queries } from '@blog/db';
import {
  CUSTOM_DOMAIN_LOG,
  CUSTOM_DOMAIN_PATH,
} from '@platform/constants/custom-domain';
import { enqueueWorkerRequest } from '@platform/server/provisioning/enqueue-provisioning';
import { logger } from '@platform/utils/logger/logger';

export const enqueueCustomDomainDisconnectOrRestore = async (
  tenantId: string,
  domain: string,
): Promise<boolean> => {
  const status = await enqueueWorkerRequest(CUSTOM_DOMAIN_PATH.DISCONNECT, {
    tenantId,
    domain,
  });
  if (status === HTTP_STATUS.ACCEPTED) return true;

  logger.error(CUSTOM_DOMAIN_LOG.DISCONNECT_REJECTED_RESTORING, {
    tenantId,
    domain,
    responseStatus: status,
  });
  const restored = await queries.tenantDomains.addTenantDomain(
    tenantId,
    domain,
  );
  if (!restored.ok) {
    logger.error(CUSTOM_DOMAIN_LOG.DISCONNECT_RESTORE_FAILED, {
      tenantId,
      domain,
      error: restored.error,
    });
  }
  return false;
};
