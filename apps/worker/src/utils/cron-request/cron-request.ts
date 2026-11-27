import { HTTP_STATUS } from '@shinefold/config/constants';
import type { TMaybeNull } from '@shinefold/config/types';
import { sanitizeLogMessage } from '@shinefold/insight';
import { ENQUEUE_ERROR } from '@worker/constants/enqueue-error';
import { hasBearerSecret } from '@worker/utils/bearer-secret/bearer-secret';
import { env } from '@worker/utils/env/env';
import { logger } from '@worker/utils/logger/logger';
import { respondError } from '@worker/utils/signed-tenant-request/signed-tenant-request';

export type TCronSweepEvents = {
  notConfigured: string;
  failed: string;
};

export function rejectCronRequest(
  request: Request,
  notConfiguredEvent: string,
): TMaybeNull<Response> {
  const secret = env.CRON_SECRET;
  if (!secret) {
    logger.error(notConfiguredEvent);
    return respondError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ENQUEUE_ERROR.SERVER_ERROR,
    );
  }
  if (!hasBearerSecret(request, secret)) {
    return respondError(HTTP_STATUS.UNAUTHORIZED, ENQUEUE_ERROR.UNAUTHORIZED);
  }
  return null;
}

export async function runCronSweep<TResult>(
  request: Request,
  { notConfigured, failed }: TCronSweepEvents,
  sweep: () => Promise<TResult>,
): Promise<Response> {
  const rejection = rejectCronRequest(request, notConfigured);
  if (rejection) return rejection;

  try {
    return Response.json(await sweep(), { status: HTTP_STATUS.OK });
  } catch (error) {
    logger.error(failed, { error: sanitizeLogMessage(error) });
    return respondError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ENQUEUE_ERROR.SERVER_ERROR,
    );
  }
}
