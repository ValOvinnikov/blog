import { HTTP_STATUS } from '@blog/config/constants';
import { queries } from '@blog/db';
import { isUndefined } from '@blog/utils/primitives';
import { EMAIL_USAGE_LOG } from '@web/constants/email-usage';
import {
  isDeliveryOutcomeEvent,
  parseDeliveryEvent,
  toSiteId,
} from '@web/server/email-usage/parse-delivery-event/parse-delivery-event';
import { verifyResendWebhook } from '@web/server/email-usage/verify-resend-webhook/verify-resend-webhook';
import { respondEmpty } from '@web/utils/empty-response/empty-response';
import { env } from '@web/utils/env/env';
import { logger } from '@web/utils/logger/logger';
import type { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  const secret = env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    logger.error(EMAIL_USAGE_LOG.WEBHOOK_SECRET_MISSING);
    return respondEmpty(HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }

  const verified = verifyResendWebhook(
    await request.text(),
    request.headers,
    secret,
  );
  if (isUndefined(verified)) {
    logger.warn(EMAIL_USAGE_LOG.WEBHOOK_SIGNATURE_INVALID);
    return respondEmpty(HTTP_STATUS.UNAUTHORIZED);
  }

  const { eventId, payload } = verified;
  if (!isDeliveryOutcomeEvent(payload)) return respondEmpty(HTTP_STATUS.OK);

  const event = parseDeliveryEvent(payload);
  if (isUndefined(event)) {
    logger.warn(EMAIL_USAGE_LOG.WEBHOOK_EVENT_MALFORMED, { eventId });
    return respondEmpty(HTTP_STATUS.OK);
  }

  const { outcome, siteTag } = event;
  if (isUndefined(siteTag)) return respondEmpty(HTTP_STATUS.OK);

  const siteId = toSiteId(siteTag);
  if (isUndefined(siteId)) {
    logger.warn(EMAIL_USAGE_LOG.WEBHOOK_SITE_TAG_INVALID, { eventId, outcome });
    return respondEmpty(HTTP_STATUS.OK);
  }

  try {
    await queries.emailUsage.recordEmailDeliveryOutcome(
      eventId,
      siteId,
      outcome,
    );
  } catch (error) {
    logger.error(EMAIL_USAGE_LOG.DELIVERY_OUTCOME_RECORD_FAILED, {
      eventId,
      siteId,
      outcome,
      error,
    });
    return respondEmpty(HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }

  return respondEmpty(HTTP_STATUS.OK);
}
