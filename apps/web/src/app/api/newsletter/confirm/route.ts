import { NEWSLETTER_RESULT, TENANT_WRITE_REFUSAL } from '@blog/config';
import { queries } from '@blog/db';
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
      if (tenant.reason === TENANT_WRITE_REFUSAL.INACTIVE) {
        logger.warn('newsletter.confirm_tenant_not_active');
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
      tenant.tenantId,
      token,
    );

    return redirectToNewsletterResult(
      request,
      result.outcome === 'not-found'
        ? NEWSLETTER_RESULT.CONFIRM_INVALID
        : NEWSLETTER_RESULT.CONFIRMED,
    );
  } catch (error) {
    logger.error('newsletter.confirm_failed', { error });
    return redirectToNewsletterResult(
      request,
      NEWSLETTER_RESULT.CONFIRM_FAILED,
    );
  }
}
