import { HTTP_STATUS } from '@shinefold/config/constants';
import { CANARY_LOG } from '@worker/constants/canary';
import { ENQUEUE_ERROR } from '@worker/constants/enqueue-error';
import { hasBearerSecret } from '@worker/utils/bearer-secret/bearer-secret';
import { awaitCanaryRun } from '@worker/utils/canary/await-canary-run';
import { env } from '@worker/utils/env/env';
import { logger } from '@worker/utils/logger/logger';
import {
  respond,
  respondError,
} from '@worker/utils/signed-tenant-request/signed-tenant-request';

// Next requires a literal here; it outlives the canary's 60-second wait.
export const maxDuration = 90;

export async function GET(request: Request): Promise<Response> {
  const secret = env.CANARY_SECRET;
  if (!secret) {
    logger.error(CANARY_LOG.NOT_CONFIGURED);
    return respondError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ENQUEUE_ERROR.SERVER_ERROR,
    );
  }
  if (!hasBearerSecret(request, secret)) {
    return respondError(HTTP_STATUS.UNAUTHORIZED, ENQUEUE_ERROR.UNAUTHORIZED);
  }

  const outcome = await awaitCanaryRun();
  if (outcome.ok) {
    const { runId, durationMs } = outcome;
    return respond(HTTP_STATUS.OK, { runId, durationMs });
  }

  const { runId, reason, error } = outcome;
  logger.error(CANARY_LOG.FAILED, { runId, reason, error });
  return respond(HTTP_STATUS.SERVICE_UNAVAILABLE, { runId, reason });
}
