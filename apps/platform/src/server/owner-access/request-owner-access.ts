import 'server-only';

import { OWNER_ACCESS_LOG } from '@platform/constants/owner-access';
import { TEAM_ACCESS_LOG } from '@platform/constants/team-access';
import { isSuperAdmin } from '@platform/server/auth/is-super-admin';
import { requireTenantOwnerOrAdmin } from '@platform/server/auth/require-tenant-owner-or-admin';
import { enqueueWorkerRequest } from '@platform/server/provisioning/enqueue-provisioning';
import { logger } from '@platform/utils/logger/logger';
import {
  ACTION_OUTCOME,
  HTTP_STATUS,
  type TActionResult,
} from '@shinefold/config';
import { isNull } from '@shinefold/utils/primitives';
import { toOutcome } from '@shinefold/utils/to-outcome';

export type TOwnerAccessRequestResult = TActionResult<
  typeof ACTION_OUTCOME.SERVER_ERROR
>;

type TAccessRequestTarget = {
  formerOwnerEmail?: string;
  membershipId?: string;
};

export const enqueueOwnerAccessRequest = async (
  path: string,
  tenantId: string,
  { formerOwnerEmail, membershipId }: TAccessRequestTarget = {},
): Promise<TOwnerAccessRequestResult> => {
  const status = await enqueueWorkerRequest(path, {
    tenantId,
    formerOwnerEmail,
    membershipId,
  });

  if (status === HTTP_STATUS.ACCEPTED) {
    return toOutcome(ACTION_OUTCOME.SUCCESS);
  }
  if (!isNull(status)) {
    const context = { tenantId, path, responseStatus: status };
    if (membershipId) {
      logger.error(TEAM_ACCESS_LOG.ACCESS_REQUEST_FAILED, {
        ...context,
        membershipId,
      });
    } else {
      logger.error(OWNER_ACCESS_LOG.REQUEST_FAILED, context);
    }
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
