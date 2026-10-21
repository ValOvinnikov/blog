import 'server-only';

import { ACTION_OUTCOME, HTTP_STATUS, type TActionResult } from '@blog/config';
import { toOutcome } from '@blog/utils/to-outcome';
import { isSuperAdmin } from '@platform/server/auth/is-super-admin';
import { requireTenantOwnerOrAdmin } from '@platform/server/auth/require-tenant-owner-or-admin';
import { enqueueWorkerRequest } from '@platform/server/provisioning/enqueue-provisioning';
import { logger } from '@platform/utils/logger/logger';

export type TOwnerAccessRequestResult = TActionResult<
  typeof ACTION_OUTCOME.SERVER_ERROR
>;

export const requestOwnerAccess = async (
  path: string,
  tenantId: string,
): Promise<TOwnerAccessRequestResult> => {
  await requireTenantOwnerOrAdmin(tenantId, isSuperAdmin);

  const status = await enqueueWorkerRequest(path, tenantId);

  if (status === HTTP_STATUS.ACCEPTED) {
    return toOutcome(ACTION_OUTCOME.SUCCESS);
  }
  if (status !== null) {
    logger.error('owner_access.request_failed', {
      tenantId,
      path,
      responseStatus: status,
    });
  }
  return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
};
