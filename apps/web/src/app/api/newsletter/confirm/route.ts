import {
  SUBSCRIBER_OUTCOME,
  NEWSLETTER_RESULT,
  TENANT_WRITE_REFUSAL,
} from '@shinefold/config';
import { queries } from '@shinefold/db';
import { NEWSLETTER_LOG } from '@web/constants/newsletter';
import { redirectToNewsletterResult } from '@web/server/newsletter/newsletter-result-redirect/newsletter-result-redirect';
import { resolveWritableTenant } from '@web/server/tenant/write-gate/write-gate';
import { logger } from '@web/utils/logger/logger';
import type { NextResponse } from 'next/server';

export async function GET(request: Request): Promise<NextResponse> {
  const token = new URL(request.url).searchParams.get('token');

  if (!token) {
    return redirectToNewsletterResult(
      request,
      NEWSLETTER_RESULT.CONFIRM_INVALID,
    );
  }

  try {
    const tenant = await resolveWritableTenant('newsletter.confirm');
    if (!tenant.ok) {
      if (tenant.error === TENANT_WRITE_REFUSAL.INACTIVE) {
        logger.warn(NEWSLETTER_LOG.CONFIRM_TENANT_NOT_ACTIVE);
        return redirectToNewsletterResult(
          request,
          NEWSLETTER_RESULT.CONFIRM_UNAVAILABLE,
        );
      }
      return redirectToNewsletterResult(
        request,
        NEWSLETTER_RESULT.CONFIRM_FAILED,
      );
    }

    const result = await queries.subscribers.confirmSubscriber(
      tenant.data,
      token,
    );

    return redirectToNewsletterResult(
      request,
      result.outcome === SUBSCRIBER_OUTCOME.NOT_FOUND
        ? NEWSLETTER_RESULT.CONFIRM_INVALID
        : NEWSLETTER_RESULT.CONFIRMED,
    );
  } catch (error) {
    logger.error(NEWSLETTER_LOG.CONFIRM_FAILED, { error });
    return redirectToNewsletterResult(
      request,
      NEWSLETTER_RESULT.CONFIRM_FAILED,
    );
  }
}
