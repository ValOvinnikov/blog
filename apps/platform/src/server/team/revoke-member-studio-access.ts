import 'server-only';

import {
  MEMBER_ACCESS_PATH,
  MEMBER_ACCESS_REVOKE_RETRY_DELAYS_MS,
  TEAM_ACCESS_LOG,
} from '@platform/constants/team-access';
import { enqueueWorkerRequest } from '@platform/server/provisioning/enqueue-provisioning';
import { logger } from '@platform/utils/logger/logger';
import { HTTP_STATUS, type TMaybeNull } from '@shinefold/config';

type TRemovedMember = {
  memberEmail: string;
  sanityUserId?: string;
};

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

const requestRevoke = (tenantId: string, removed: TRemovedMember) =>
  enqueueWorkerRequest(MEMBER_ACCESS_PATH.REVOKE, { tenantId, ...removed });

/** Never throws: a revoke the worker never accepts is logged once, and the removal it follows stands. */
export const revokeMemberStudioAccess = async (
  tenantId: string,
  removed: TRemovedMember,
): Promise<void> => {
  let status: TMaybeNull<number> = await requestRevoke(tenantId, removed);

  for (const delayMs of MEMBER_ACCESS_REVOKE_RETRY_DELAYS_MS) {
    if (status === HTTP_STATUS.ACCEPTED) return;
    await wait(delayMs);
    status = await requestRevoke(tenantId, removed);
  }

  if (status !== HTTP_STATUS.ACCEPTED) {
    logger.error(TEAM_ACCESS_LOG.REVOKE_FAILED, {
      tenantId,
      responseStatus: status,
    });
  }
};
