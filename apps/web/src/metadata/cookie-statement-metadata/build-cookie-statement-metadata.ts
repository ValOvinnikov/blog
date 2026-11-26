import { routes } from '@shinefold/config';
import { COOKIE_STATEMENT_LOG } from '@web/constants/cookie-statement';
import { OG_TYPE } from '@web/constants/metadata';
import { toLocalizedPageMetadata } from '@web/metadata/to-localized-page-metadata';
import { getCookieStatementPage } from '@web/server/cookie-statement/get-cookie-statement-page/get-cookie-statement-page';
import { logger } from '@web/utils/logger/logger';
import type { Metadata } from 'next';

export const buildCookieStatementMetadata = async (): Promise<Metadata> => {
  const result = await getCookieStatementPage();

  if (!result.ok) {
    logger.error(COOKIE_STATEMENT_LOG.METADATA_FETCH_FAILED, {
      error: result.error,
    });
    return {};
  }

  if (!result.data) {
    return {};
  }

  const { seo, translations } = result.data;
  const href = routes.cookieStatement();

  return toLocalizedPageMetadata(seo, {
    href,
    translations: translations.map((language) => ({ language, href })),
    ogType: OG_TYPE.WEBSITE,
  });
};
