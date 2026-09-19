import { queries } from '@blog/db';
import { isTenantActive } from '@web/server/tenant/is-tenant-active';
import { resolveTenantId } from '@web/server/tenant/resolve-tenant-id';
import { logger } from '@web/utils/logger/logger';
import type { NextResponse } from 'next/server';
import { getLocale, getTranslations } from 'next-intl/server';

import { renderResultResponse } from '../newsletter-result-page';

/**
 * `GET /api/newsletter/confirm?token=…` — the double opt-in confirmation link
 * every newsletter confirmation email points at. Flips the matching
 * `subscribers` row from `pending` to `active` via
 * `queries.subscribers.confirmSubscriber` and renders a plain result page;
 * `confirmed`/`already-confirmed` both read as success (the query's own
 * idempotency guarantee).
 *
 * `/api` routes are excluded from `proxy.ts`'s matcher, so the `x-tenant-id`
 * header it threads to Server Components/Actions never reaches here — this
 * route resolves the tenant directly from its own request's `Host` header.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const token = new URL(request.url).searchParams.get('token');
  const [lang, t] = await Promise.all([
    getLocale(),
    getTranslations('newsletterConfirm'),
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

  try {
    const host = request.headers.get('host');
    const tenantId = await resolveTenantId(host);
    if (!tenantId) {
      return renderResultResponse(
        {
          lang,
          title: t('errorTitle'),
          message: t('errorMessage'),
          returnHomeLabel,
        },
        500,
      );
    }

    if (!(await isTenantActive(tenantId))) {
      logger.warn('newsletter.confirm_tenant_not_active', { tenantId });
      return renderResultResponse(
        {
          lang,
          title: t('errorTitle'),
          message: t('errorMessage'),
          returnHomeLabel,
        },
        403,
      );
    }

    const result = await queries.subscribers.confirmSubscriber(tenantId, token);

    if (result.outcome === 'not-found') {
      return renderResultResponse(
        {
          lang,
          title: t('invalidTitle'),
          message: t('invalidMessage'),
          returnHomeLabel,
        },
        404,
      );
    }

    return renderResultResponse(
      {
        lang,
        title: t('confirmedTitle'),
        message: t('confirmedMessage'),
        returnHomeLabel,
      },
      200,
    );
  } catch (error) {
    logger.error('newsletter.confirm_failed', { error });
    return renderResultResponse(
      {
        lang,
        title: t('errorTitle'),
        message: t('errorMessage'),
        returnHomeLabel,
      },
      500,
    );
  }
}
