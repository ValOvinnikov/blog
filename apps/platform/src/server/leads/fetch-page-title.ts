import 'server-only';

import {
  HTTP_METHOD,
  HTTP_STATUS,
  type TLocaleIsoCode,
  type TMaybeUndefined,
} from '@blog/config';
import { buildEnqueueHeaders } from '@blog/utils/enqueue-signature';
import { LEAD_LOG } from '@platform/constants/lead';
import { env } from '@platform/utils/env/env';
import { logger } from '@platform/utils/logger/logger';
import { z } from 'zod';

const PAGE_TITLE_TIMEOUT_MS = 5000;

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
  const { WEB_APP_URL: webAppUrl, INTERNAL_PAGES_SECRET: secret } = env;

  if (!webAppUrl || !secret) {
    logger.error(LEAD_LOG.PAGE_TITLE_SKIPPED, {
      hasWebAppUrl: Boolean(webAppUrl),
      hasSecret: Boolean(secret),
    });
    return undefined;
  }

  const url = new URL(
    `/api/internal/pages/${encodeURIComponent(documentId)}`,
    webAppUrl,
  );
  const rawBody = JSON.stringify({ tenantId, locale });

  try {
    const response = await fetch(url, {
      method: HTTP_METHOD.POST,
      headers: {
        'Content-Type': 'application/json',
        ...buildEnqueueHeaders({ secret, path: url.pathname, rawBody }),
      },
      body: rawBody,
      signal: AbortSignal.timeout(PAGE_TITLE_TIMEOUT_MS),
    });

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
    logger.error(LEAD_LOG.PAGE_TITLE_ERROR, { tenantId, error });
    return undefined;
  }
};
