import { routes } from '@blog/config';
import { queries } from '@blog/db';
import { isTenantActive } from '@web/server/tenant/is-tenant-active';
import { resolveTenantId } from '@web/server/tenant/resolve-tenant-id';
import { logger } from '@web/utils/logger/logger';
import type { NextResponse } from 'next/server';
import { getTranslations } from 'next-intl/server';

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
  const t = await getTranslations('newsletterUnsubscribe');
  const returnHomeLabel = t('returnHome');

  if (!token) {
    return renderResultResponse(
      {
        title: t('invalidTitle'),
        message: t('invalidMessage'),
        returnHomeLabel,
      },
      400,
    );
  }

  return renderConfirmResponse({
    title: t('confirmTitle'),
    message: t('confirmMessage'),
    confirmButtonLabel: t('confirmButtonLabel'),
    actionUrl: routes.newsletterUnsubscribe(token),
  });
}

/**
 * `POST /api/newsletter/unsubscribe?token=…` performs the unsubscribe via
 * `queries.subscribers.unsubscribeByToken` and is simultaneously the RFC
 * 8058 one-click endpoint mail clients `POST` to directly. Every outcome —
 * an unknown token, an already-used token, a missing token, or an inactive
 * tenant — renders the same calm "you're unsubscribed / no longer valid"
 * copy rather than an error page, since `unsubscribeByToken`'s own
 * `not-found` outcome is indistinguishable from "already unsubscribed" (the
 * row is deleted on success).
 */
export async function POST(request: Request): Promise<NextResponse> {
  const token = new URL(request.url).searchParams.get('token');
  const t = await getTranslations('newsletterUnsubscribe');
  const returnHomeLabel = t('returnHome');
  const invalidCopy: TResultPageCopy = {
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
