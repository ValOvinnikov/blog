import { routes } from '@blog/config';
import { queries } from '@blog/db';
import { resolveRequestTenant } from '@web/server/tenant/request-tenant/request-tenant';
import { logger } from '@web/utils/logger/logger';
import type { NextResponse } from 'next/server';
import { getLocale, getTranslations } from 'next-intl/server';

import {
  renderResultResponse,
  type TResultPageCopy,
} from '../newsletter-result-page';

import { renderConfirmResponse } from './unsubscribe-page';

export async function GET(request: Request): Promise<NextResponse> {
  const token = new URL(request.url).searchParams.get('token');
  const [lang, t] = await Promise.all([
    getLocale(),
    getTranslations('newsletterUnsubscribe'),
  ]);
  const returnHomeLabel = t('returnHome');

  if (!token) {
    return renderResultResponse(
      {
        lang,
        title: t('invalidTitle'),
        message: t('invalidMessage'),
        returnHomeLabel,
      },
      400,
    );
  }

  return renderConfirmResponse({
    lang,
    title: t('confirmTitle'),
    message: t('confirmMessage'),
    confirmButtonLabel: t('confirmButtonLabel'),
    returnHomeLabel,
    actionUrl: routes.newsletterUnsubscribe(token),
  });
}

export async function POST(request: Request): Promise<NextResponse> {
  const token = new URL(request.url).searchParams.get('token');
  const [lang, t] = await Promise.all([
    getLocale(),
    getTranslations('newsletterUnsubscribe'),
  ]);
  const returnHomeLabel = t('returnHome');
  const errorCopy: TResultPageCopy = {
    lang,
    title: t('errorTitle'),
    message: t('errorMessage'),
    returnHomeLabel,
  };
  const invalidCopy: TResultPageCopy = {
    lang,
    title: t('invalidTitle'),
    message: t('invalidMessage'),
    returnHomeLabel,
  };

  if (!token) {
    return renderResultResponse(invalidCopy, 400);
  }

  try {
    const tenant = await resolveRequestTenant();
    if (!tenant) {
      logger.error('newsletter.unsubscribe_link_tenant_unresolved');
      return renderResultResponse(errorCopy, 404);
    }
    const { id: tenantId } = tenant;

    const result = await queries.subscribers.unsubscribeByToken(
      tenantId,
      token,
    );

    if (result.outcome === 'not-found') {
      return renderResultResponse(invalidCopy, 200);
    }

    return renderResultResponse(
      {
        lang,
        title: t('successTitle'),
        message: t('successMessage'),
        returnHomeLabel,
      },
      200,
    );
  } catch (error) {
    logger.error('newsletter.unsubscribe_link_failed', { error });
    return renderResultResponse(errorCopy, 500);
  }
}
