import { routes } from '@blog/config';
import { queries } from '@blog/db';
import { isTenantActive } from '@web/server/tenant/is-tenant-active';
import { resolveTenantId } from '@web/server/tenant/resolve-tenant-id';
import { logger } from '@web/utils/logger/logger';
import type { NextResponse } from 'next/server';
import { getLocale, getTranslations } from 'next-intl/server';

import {
  renderConfirmResponse,
  renderResultResponse,
  type TResultPageCopy,
} from './unsubscribe-page';

/**
 * `GET /api/newsletter/unsubscribe?token=…` renders a confirmation page
 * whose single button `POST`s to this same URL. It never touches the
 * database — inbox scanners and link-prefetchers issue a `GET` on every URL
 * in an email, and a `GET` that unsubscribed would do so silently and
 * invisibly. The actual unsubscribe happens only in `POST` below.
 */
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

/**
 * `POST /api/newsletter/unsubscribe?token=…` performs the unsubscribe via
 * `queries.subscribers.unsubscribeByToken` and is simultaneously the RFC
 * 8058 one-click endpoint mail clients `POST` to directly.
 * `unsubscribeByToken`'s `not-found` outcome means "already unsubscribed",
 * not an error — the row is deleted on success.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const token = new URL(request.url).searchParams.get('token');
  const [lang, t] = await Promise.all([
    getLocale(),
    getTranslations('newsletterUnsubscribe'),
  ]);
  const returnHomeLabel = t('returnHome');
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
    const host = request.headers.get('host');
    const tenantId = await resolveTenantId(host);
    if (!tenantId) {
      logger.error('newsletter.unsubscribe_tenant_unresolved', { host });
      return renderResultResponse(invalidCopy, 200);
    }

    if (!(await isTenantActive(tenantId))) {
      logger.warn('newsletter.unsubscribe_tenant_not_active', { tenantId });
      return renderResultResponse(invalidCopy, 200);
    }

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
    logger.error('newsletter.unsubscribe_failed', { error });
    return renderResultResponse(invalidCopy, 200);
  }
}
