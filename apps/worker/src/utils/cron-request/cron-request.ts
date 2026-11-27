import { HTTP_STATUS } from '@shinefold/config/constants';
import type { TMaybeNull } from '@shinefold/config/types';
import { ENQUEUE_ERROR } from '@worker/constants/enqueue-error';
import { hasBearerSecret } from '@worker/utils/bearer-secret/bearer-secret';
import { env } from '@worker/utils/env/env';
import { logger } from '@worker/utils/logger/logger';
import { respondError } from '@worker/utils/signed-tenant-request/signed-tenant-request';

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
