import { NEWSLETTER_RESULT, routes } from '@blog/config';
import { queries } from '@blog/db';
import { resolveNewsletterLinkLocale } from '@web/server/newsletter/newsletter-link-locale/newsletter-link-locale';
import { redirectToNewsletterResult } from '@web/server/newsletter/newsletter-result-redirect/newsletter-result-redirect';
import { resolveRequestTenant } from '@web/server/tenant/request-tenant/request-tenant';
import { logger } from '@web/utils/logger/logger';
import type { NextResponse } from 'next/server';
import { getTranslations } from 'next-intl/server';

import { renderConfirmResponse } from './unsubscribe-page';

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return redirectToNewsletterResult(
      request,
      NEWSLETTER_RESULT.UNSUBSCRIBE_INVALID,
    );
  }

  const { locale } = await resolveNewsletterLinkLocale(
    searchParams.get('lang'),
  );
  const t = await getTranslations({
    locale,
    namespace: 'newsletterUnsubscribe',
  });

  return renderConfirmResponse({
    lang: locale,
    title: t('confirmTitle'),
    message: t('confirmMessage'),
    confirmButtonLabel: t('confirmButtonLabel'),
    returnHomeLabel: t('returnHome'),
    actionUrl: routes.newsletterUnsubscribe(token, locale),
  });
}

export async function POST(request: Request): Promise<NextResponse> {
  const token = new URL(request.url).searchParams.get('token');

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

    const result = await queries.subscribers.unsubscribeByToken(
      tenant.id,
      token,
    );

    return redirectToNewsletterResult(
      request,
      result.outcome === 'not-found'
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
