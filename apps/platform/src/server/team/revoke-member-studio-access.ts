import 'server-only';

import {
  MEMBER_ACCESS_PATH,
  MEMBER_ACCESS_REVOKE_RETRY_DELAYS_MS,
  TEAM_ACCESS_LOG,
} from '@platform/constants/team-access';
import {
  sendWorkerRequest,
  type TWorkerResponse,
} from '@platform/server/provisioning/enqueue-provisioning';
import { logger } from '@platform/utils/logger/logger';
import { HTTP_STATUS } from '@shinefold/config';
import { isNull } from '@shinefold/utils/primitives';

type TRemovedMember = {
  memberEmail: string;
  sanityUserId?: string;
};

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

const isSettled = ({ status }: TWorkerResponse) =>
  status === HTTP_STATUS.ACCEPTED ||
  (!isNull(status) &&
    status >= HTTP_STATUS.BAD_REQUEST &&
    status < HTTP_STATUS.INTERNAL_SERVER_ERROR);

const toFailureContext = (response: TWorkerResponse) =>
  'failureEvent' in response
    ? { cause: response.failureEvent, ...response.failure }
    : { responseStatus: response.status };

/** Never throws: a revoke the worker never accepts is logged once, and the removal it follows stands. */
export const revokeMemberStudioAccess = async (
  tenantId: string,
  removed: TRemovedMember,
): Promise<void> => {
  const request = () =>
    sendWorkerRequest(MEMBER_ACCESS_PATH.REVOKE, { tenantId, ...removed });

  let response = await request();
  for (const delayMs of MEMBER_ACCESS_REVOKE_RETRY_DELAYS_MS) {
    if (isSettled(response)) break;
    await wait(delayMs);
    response = await request();
  }

  if (response.status !== HTTP_STATUS.ACCEPTED) {
    logger.error(TEAM_ACCESS_LOG.REVOKE_FAILED, {
      tenantId,
      ...toFailureContext(response),
    });
  }
};
