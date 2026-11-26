import { routes } from '@shinefold/config';
import { HOME_PAGE_LOG } from '@web/constants/home-page';
import { OG_TYPE } from '@web/constants/metadata';
import { toLocalizedPageMetadata } from '@web/metadata/to-localized-page-metadata';
import { getHomePage } from '@web/server/home/get-home-page/get-home-page';
import { logger } from '@web/utils/logger/logger';
import type { Metadata } from 'next';

export const buildHomePageMetadata = async (): Promise<Metadata> => {
  const result = await getHomePage();

  if (!result.ok) {
    logger.error(HOME_PAGE_LOG.METADATA_FETCH_FAILED, { error: result.error });
    return {};
  }

  if (!result.data) {
    return {};
  }

  const { seo, translations } = result.data;
  const href = routes.home();

  return toLocalizedPageMetadata(seo, {
    href,
    translations: translations.map((language) => ({ language, href })),
    ogType: OG_TYPE.WEBSITE,
    titleAbsolute: true,
  });
};
