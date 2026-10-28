import 'server-only';

import { ACTION_OUTCOME, HTTP_STATUS, type TActionResult } from '@blog/config';
import { isNull } from '@blog/utils/primitives';
import { toOutcome } from '@blog/utils/to-outcome';
import { OWNER_ACCESS_LOG } from '@platform/constants/owner-access';
import { isSuperAdmin } from '@platform/server/auth/is-super-admin';
import { requireTenantOwnerOrAdmin } from '@platform/server/auth/require-tenant-owner-or-admin';
import { enqueueWorkerRequest } from '@platform/server/provisioning/enqueue-provisioning';
import { logger } from '@platform/utils/logger/logger';

export type TOwnerAccessRequestResult = TActionResult<
  typeof ACTION_OUTCOME.SERVER_ERROR
>;

export const enqueueOwnerAccessRequest = async (
  path: string,
  tenantId: string,
  formerOwnerEmail?: string,
): Promise<TOwnerAccessRequestResult> => {
  const status = await enqueueWorkerRequest(path, {
    tenantId,
    formerOwnerEmail,
  });

  if (status === HTTP_STATUS.ACCEPTED) {
    return toOutcome(ACTION_OUTCOME.SUCCESS);
  }
  if (!isNull(status)) {
    logger.error(OWNER_ACCESS_LOG.REQUEST_FAILED, {
      tenantId,
      path,
      responseStatus: status,
    });
  }
  return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
};

export const requestOwnerAccess = async (
  path: string,
  tenantId: string,
): Promise<TOwnerAccessRequestResult> => {
  await requireTenantOwnerOrAdmin(tenantId, isSuperAdmin);
  return enqueueOwnerAccessRequest(path, tenantId);
};
