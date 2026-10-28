import 'server-only';

import { HTTP_STATUS } from '@blog/config';
import { queries } from '@blog/db';
import {
  CUSTOM_DOMAIN_LOG,
  CUSTOM_DOMAIN_PATH,
} from '@platform/constants/custom-domain';
import { enqueueWorkerRequest } from '@platform/server/provisioning/enqueue-provisioning';
import { logger } from '@platform/utils/logger/logger';

/** Deletes the just-added `tenant_domains` row when the worker does not accept the connect, and reports whether it did. */
export const enqueueCustomDomainConnectOrUndo = async (
  tenantId: string,
  domain: string,
): Promise<boolean> => {
  const status = await enqueueWorkerRequest(
    CUSTOM_DOMAIN_PATH.CONNECT,
    tenantId,
    domain,
  );
  if (status === HTTP_STATUS.ACCEPTED) return true;

  logger.error(CUSTOM_DOMAIN_LOG.CONNECT_ENQUEUE_REJECTED, {
    tenantId,
    domain,
    responseStatus: status,
  });
  if (!(await queries.tenantDomains.removeTenantDomain(tenantId, domain))) {
    logger.error(CUSTOM_DOMAIN_LOG.CONNECT_ROLLBACK_FAILED, {
      tenantId,
      domain,
    });
  }
  return false;
};
