import { routes } from '@shinefold/config';
import { LANDING_PAGE_LOG } from '@web/constants/landing-page';
import { OG_TYPE } from '@web/constants/metadata';
import { toLocalizedPageMetadata } from '@web/metadata/to-localized-page-metadata';
import { getLandingPage } from '@web/server/landing/get-landing-page/get-landing-page';
import { logger } from '@web/utils/logger/logger';
import type { Metadata } from 'next';

export const buildLandingPageMetadata = async (
  path: string,
): Promise<Metadata> => {
  const result = await getLandingPage(path);

  if (!result.ok) {
    logger.error(LANDING_PAGE_LOG.METADATA_FETCH_FAILED, {
      path,
      error: result.error,
    });
    return {};
  }

  if (!result.data) {
    return {};
  }

  const { seo, translations } = result.data;

  return toLocalizedPageMetadata(seo, {
    href: routes.landingPage(path),
    translations: translations.map(({ language, slug: translatedPath }) => ({
      language,
      href: routes.landingPage(translatedPath),
    })),
    ogType: OG_TYPE.WEBSITE,
  });
};
