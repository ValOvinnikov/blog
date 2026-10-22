import { NEWSLETTER_RESULT, SUBSCRIBER_OUTCOME } from '@blog/config';
import { queries } from '@blog/db';
import {
  redirectToNewsletterResult,
  redirectToNewsletterUnsubscribeConfirmation,
} from '@web/server/newsletter/newsletter-result-redirect/newsletter-result-redirect';
import { readNewsletterUnsubscribeSubscriberId } from '@web/server/newsletter/newsletter-unsubscribe-token/newsletter-unsubscribe-token';
import {
  clearNewsletterUnsubscribeToken,
  readNewsletterUnsubscribeToken,
  storeNewsletterUnsubscribeToken,
} from '@web/server/newsletter/newsletter-unsubscribe-token-cookie/newsletter-unsubscribe-token-cookie';
import { resolveRequestTenant } from '@web/server/tenant/request-tenant/request-tenant';
import { logger } from '@web/utils/logger/logger';
import type { NextResponse } from 'next/server';

export async function GET(request: Request): Promise<NextResponse> {
  const token = new URL(request.url).searchParams.get('token');

  if (!token) {
    return redirectToNewsletterResult(
      request,
      NEWSLETTER_RESULT.UNSUBSCRIBE_INVALID,
    );
  }

  await storeNewsletterUnsubscribeToken(token);
  return redirectToNewsletterUnsubscribeConfirmation(request);
}

export async function POST(request: Request): Promise<NextResponse> {
  const token =
    new URL(request.url).searchParams.get('token') ??
    (await readNewsletterUnsubscribeToken());
  await clearNewsletterUnsubscribeToken();

  if (!token) {
    return redirectToNewsletterResult(
      request,
      NEWSLETTER_RESULT.UNSUBSCRIBE_INVALID,
    );
  }

  try {
    const tenant = await resolveRequestTenant();
    if (!tenant) {
      logger.error('newsletter.unsubscribe_link_tenant_unresolved');
      return redirectToNewsletterResult(
        request,
        NEWSLETTER_RESULT.UNSUBSCRIBE_FAILED,
      );
    }

    const subscriberId = readNewsletterUnsubscribeSubscriberId(token);
    const result = subscriberId
      ? await queries.subscribers.unsubscribeById(tenant.id, subscriberId)
      : await queries.subscribers.unsubscribeByToken(tenant.id, token);

    return redirectToNewsletterResult(
      request,
      result.outcome === SUBSCRIBER_OUTCOME.NOT_FOUND
        ? NEWSLETTER_RESULT.UNSUBSCRIBE_INVALID
        : NEWSLETTER_RESULT.UNSUBSCRIBED,
    );
  } catch (error) {
    logger.error('newsletter.unsubscribe_link_failed', { error });
    return redirectToNewsletterResult(
      request,
      NEWSLETTER_RESULT.UNSUBSCRIBE_FAILED,
    );
  }
}
