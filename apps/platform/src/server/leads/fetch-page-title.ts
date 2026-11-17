import 'server-only';

import { LEAD_LOG } from '@platform/constants/lead';
import {
  internalPagesRoutes,
  postToInternalPagesRoute,
} from '@platform/server/internal-pages/post-to-internal-pages-route';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import {
  HTTP_STATUS,
  type TLocaleIsoCode,
  type TMaybeUndefined,
} from '@shinefold/config';
import { z } from 'zod';

const pageTitleResponseSchema = z.object({ title: z.string().min(1) });

export type TFetchPageTitleInput = {
  tenantId: string;
  documentId: string;
  locale: TLocaleIsoCode;
};

export const fetchPageTitle = async ({
  tenantId,
  documentId,
  locale,
}: TFetchPageTitleInput): Promise<TMaybeUndefined<string>> => {
  try {
    const result = await postToInternalPagesRoute(
      internalPagesRoutes.title(documentId),
      { tenantId, locale },
    );

    if (!result.isConfigured) {
      const { hasWebAppUrl, hasSecret } = result;
      logger.error(LEAD_LOG.PAGE_TITLE_SKIPPED, { hasWebAppUrl, hasSecret });
      return undefined;
    }

    const { response } = result;
    if (response.status === HTTP_STATUS.NOT_FOUND) return undefined;
    if (!response.ok) {
      logger.error(LEAD_LOG.PAGE_TITLE_FAILED, {
        tenantId,
        responseStatus: response.status,
      });
      return undefined;
    }

    const parsed = pageTitleResponseSchema.safeParse(await response.json());
    return parsed.success ? parsed.data.title : undefined;
  } catch (error) {
    logger.error(LEAD_LOG.PAGE_TITLE_ERROR, {
      tenantId,
      ...toLoggableError(error),
    });
    return undefined;
  }
};
