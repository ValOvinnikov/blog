import 'server-only';

import { HTTP_STATUS } from '@blog/config';
import { queries } from '@blog/db';
import {
  CUSTOM_DOMAIN_LOG,
  CUSTOM_DOMAIN_PATH,
  CUSTOM_DOMAIN_REFUSAL,
  type TCustomDomainRefusal,
} from '@platform/constants/custom-domain';
import { enqueueWorkerRequest } from '@platform/server/provisioning/enqueue-provisioning';
import { logger } from '@platform/utils/logger/logger';

export type TConnectAttempt =
  | { isAccepted: true }
  | { isAccepted: false; isUndone: boolean; reason: TCustomDomainRefusal };

const rejectionReason = (status: number | null): TCustomDomainRefusal =>
  status === HTTP_STATUS.CONFLICT
    ? CUSTOM_DOMAIN_REFUSAL.CONNECT_CONFLICT
    : CUSTOM_DOMAIN_REFUSAL.CONNECT_UNAVAILABLE;

export const enqueueCustomDomainConnectOrUndo = async (
  tenantId: string,
  domain: string,
): Promise<TConnectAttempt> => {
  const status = await enqueueWorkerRequest(CUSTOM_DOMAIN_PATH.CONNECT, {
    tenantId,
    domain,
  });
  if (status === HTTP_STATUS.ACCEPTED) return { isAccepted: true };

  logger.error(CUSTOM_DOMAIN_LOG.CONNECT_ENQUEUE_REJECTED, {
    tenantId,
    domain,
    responseStatus: status,
  });
  const isUndone = await queries.tenantDomains.removeTenantDomain(
    tenantId,
    domain,
  );
  if (!isUndone) {
    logger.error(CUSTOM_DOMAIN_LOG.CONNECT_ROLLBACK_FAILED, {
      tenantId,
      domain,
    });
  }
  return { isAccepted: false, isUndone, reason: rejectionReason(status) };
};
