import { HTTP_STATUS } from '@blog/config/constants';
import { sanitizeLogMessage } from '@blog/insight';
import { isSecretMatch } from '@blog/utils';
import { ENQUEUE_ERROR } from '@worker/constants/enqueue-error';
import {
  CRON_BEARER_PREFIX,
  INACTIVITY_SWEEP_FAILED_EVENT,
  INACTIVITY_SWEEP_NOT_CONFIGURED_EVENT,
} from '@worker/constants/inactivity-sweep';
import { env } from '@worker/utils/env/env';
import { getInactivitySweepEnv } from '@worker/utils/inactivity-sweep/inactivity-sweep-env';
import { runInactivitySweep } from '@worker/utils/inactivity-sweep/run-inactivity-sweep';
import { logger } from '@worker/utils/logger/logger';
import { respondError } from '@worker/utils/signed-tenant-request/signed-tenant-request';

function hasCronSecret(request: Request, secret: string): boolean {
  const authorization = request.headers.get('authorization');
  const provided = authorization?.startsWith(CRON_BEARER_PREFIX)
    ? authorization.slice(CRON_BEARER_PREFIX.length)
    : null;
  return isSecretMatch(provided, secret);
}

export async function GET(request: Request): Promise<Response> {
  const secret = env.CRON_SECRET;
  if (!secret) {
    logger.error(INACTIVITY_SWEEP_NOT_CONFIGURED_EVENT);
    return respondError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ENQUEUE_ERROR.SERVER_ERROR,
    );
  }
  if (!hasCronSecret(request, secret)) {
    return respondError(HTTP_STATUS.UNAUTHORIZED, ENQUEUE_ERROR.UNAUTHORIZED);
  }

  try {
    const advanced = await runInactivitySweep({
      now: new Date(),
      env: getInactivitySweepEnv(),
    });
    return Response.json({ advanced }, { status: HTTP_STATUS.OK });
  } catch (error) {
    logger.error(INACTIVITY_SWEEP_FAILED_EVENT, {
      error: sanitizeLogMessage(error),
    });
    return respondError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ENQUEUE_ERROR.SERVER_ERROR,
    );
  }
}
