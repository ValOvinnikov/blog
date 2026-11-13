import { HTTP_STATUS } from '@blog/config/constants';
import type { TMaybeNull } from '@blog/config/types';
import { sanitizeLogMessage } from '@blog/insight';
import { DOWNGRADE_GRACE_LOG } from '@worker/constants/downgrade-grace';
import { ENQUEUE_ERROR } from '@worker/constants/enqueue-error';
import { INACTIVITY_SWEEP_LOG } from '@worker/constants/inactivity-sweep';
import { hasCronSecret } from '@worker/utils/cron-secret/cron-secret';
import { runDowngradeGraceSweep } from '@worker/utils/downgrade-grace/run-downgrade-grace-sweep';
import { env } from '@worker/utils/env/env';
import type { TInactivitySweepContext } from '@worker/utils/inactivity-sweep/inactivity-stages';
import { getInactivitySweepEnv } from '@worker/utils/inactivity-sweep/inactivity-sweep-env';
import { runInactivitySweep } from '@worker/utils/inactivity-sweep/run-inactivity-sweep';
import { logger } from '@worker/utils/logger/logger';
import { runRetentionCleanups } from '@worker/utils/retention/run-retention-cleanups';
import { respondError } from '@worker/utils/signed-tenant-request/signed-tenant-request';

// Next requires a literal here, so it cannot import a const.
export const maxDuration = 300;

async function runOrLog<TResult>(
  sweep: (ctx: TInactivitySweepContext) => Promise<TResult>,
  now: Date,
  failedEvent: string,
): Promise<TMaybeNull<TResult>> {
  try {
    return await sweep({ now, env: getInactivitySweepEnv() });
  } catch (error) {
    logger.error(failedEvent, { error: sanitizeLogMessage(error) });
    return null;
  }
}

export async function GET(request: Request): Promise<Response> {
  const secret = env.CRON_SECRET;
  if (!secret) {
    logger.error(INACTIVITY_SWEEP_LOG.NOT_CONFIGURED);
    return respondError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ENQUEUE_ERROR.SERVER_ERROR,
    );
  }
  if (!hasCronSecret(request, secret)) {
    return respondError(HTTP_STATUS.UNAUTHORIZED, ENQUEUE_ERROR.UNAUTHORIZED);
  }

  const now = new Date();
  const advanced = await runOrLog(
    runInactivitySweep,
    now,
    INACTIVITY_SWEEP_LOG.FAILED,
  );
  const grace = await runOrLog(
    runDowngradeGraceSweep,
    now,
    DOWNGRADE_GRACE_LOG.FAILED,
  );
  const deleted = await runRetentionCleanups(now);
  if (!advanced || !grace) {
    return respondError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ENQUEUE_ERROR.SERVER_ERROR,
    );
  }
  return Response.json(
    { advanced, grace, deleted },
    { status: HTTP_STATUS.OK },
  );
}
