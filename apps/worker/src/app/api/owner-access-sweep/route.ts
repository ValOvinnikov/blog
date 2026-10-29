import { HTTP_STATUS } from '@blog/config/constants';
import { sanitizeLogMessage } from '@blog/insight';
import { ENQUEUE_ERROR } from '@worker/constants/enqueue-error';
import { OWNER_ACCESS_LOG } from '@worker/constants/owner-access';
import { hasCronSecret } from '@worker/utils/cron-secret/cron-secret';
import { env } from '@worker/utils/env/env';
import { logger } from '@worker/utils/logger/logger';
import { runOwnerAccessSweep } from '@worker/utils/owner-access-sweep/run-owner-access-sweep';
import { respondError } from '@worker/utils/signed-tenant-request/signed-tenant-request';

// Next requires a literal here, so it cannot import a const.
export const maxDuration = 300;

export async function GET(request: Request): Promise<Response> {
  const secret = env.CRON_SECRET;
  if (!secret) {
    logger.error(OWNER_ACCESS_LOG.SWEEP_NOT_CONFIGURED);
    return respondError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ENQUEUE_ERROR.SERVER_ERROR,
    );
  }
  if (!hasCronSecret(request, secret)) {
    return respondError(HTTP_STATUS.UNAUTHORIZED, ENQUEUE_ERROR.UNAUTHORIZED);
  }

  try {
    const result = await runOwnerAccessSweep();
    return Response.json(result, { status: HTTP_STATUS.OK });
  } catch (error) {
    logger.error(OWNER_ACCESS_LOG.SWEEP_FAILED, {
      error: sanitizeLogMessage(error),
    });
    return respondError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ENQUEUE_ERROR.SERVER_ERROR,
    );
  }
}
