import { HTTP_STATUS } from '@blog/config/constants';
import type { TMaybeNull } from '@blog/config/types';
import { sanitizeLogMessage } from '@blog/insight';
import { isSecretMatch } from '@blog/utils';
import { ENQUEUE_ERROR } from '@worker/constants/enqueue-error';
import {
  CRON_BEARER_PREFIX,
  INACTIVITY_SWEEP_LOG,
} from '@worker/constants/inactivity-sweep';
import { env } from '@worker/utils/env/env';
import { getInactivitySweepEnv } from '@worker/utils/inactivity-sweep/inactivity-sweep-env';
import {
  runInactivitySweep,
  type TInactivitySweepResult,
} from '@worker/utils/inactivity-sweep/run-inactivity-sweep';
import { logger } from '@worker/utils/logger/logger';
import { runRetentionCleanups } from '@worker/utils/retention/run-retention-cleanups';
import { respondError } from '@worker/utils/signed-tenant-request/signed-tenant-request';

// Next requires a literal here, so it cannot import a const.
export const maxDuration = 300;

function hasCronSecret(request: Request, secret: string): boolean {
  const authorization = request.headers.get('authorization');
  const provided = authorization?.startsWith(CRON_BEARER_PREFIX)
    ? authorization.slice(CRON_BEARER_PREFIX.length)
    : null;
  return isSecretMatch(provided, secret);
}

async function sweepInactiveTenants(
  now: Date,
): Promise<TMaybeNull<TInactivitySweepResult>> {
  try {
    return await runInactivitySweep({ now, env: getInactivitySweepEnv() });
  } catch (error) {
    logger.error(INACTIVITY_SWEEP_LOG.FAILED, {
      error: sanitizeLogMessage(error),
    });
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
  const advanced = await sweepInactiveTenants(now);
  const deleted = await runRetentionCleanups(now);
  if (!advanced) {
    return respondError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ENQUEUE_ERROR.SERVER_ERROR,
    );
  }
  return Response.json({ advanced, deleted }, { status: HTTP_STATUS.OK });
}
