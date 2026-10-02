import { TENANT_WRITE_REFUSAL } from '@blog/config';
import { queries } from '@blog/db';
import { resolveWritableTenant } from '@web/server/tenant/resolve-writable-tenant';
import { logger } from '@web/utils/logger/logger';
import type { NextResponse } from 'next/server';
import { getLocale, getTranslations } from 'next-intl/server';

import { renderResultResponse } from '../newsletter-result-page';

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
    const tenant = await resolveWritableTenant('newsletter.confirm');
    if (!tenant.ok) {
      if (tenant.reason === TENANT_WRITE_REFUSAL.INACTIVE) {
        logger.warn('newsletter.confirm_tenant_not_active');
        return renderResultResponse(
          {
            lang,
            title: t('unavailableTitle'),
            message: t('unavailableMessage'),
            returnHomeLabel,
          },
          403,
        );
      }
      return renderResultResponse(
        {
          lang,
          title: t('errorTitle'),
          message: t('errorMessage'),
          returnHomeLabel,
        },
        404,
      );
    }
    const { tenantId } = tenant;

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
