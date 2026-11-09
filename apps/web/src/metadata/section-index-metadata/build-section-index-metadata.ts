import type { TSectionIndexType } from '@blog/service';
import { SECTION_INDEX_LOG } from '@web/constants/section-index';
import { toLocalizedPageMetadata } from '@web/metadata/to-localized-page-metadata';
import { getSectionIndexPage } from '@web/server/section-index/get-section-index-page/get-section-index-page';
import { logger } from '@web/utils/logger/logger';
import { sectionIndexHref } from '@web/utils/section-index-href';
import type { Metadata } from 'next';

export const buildSectionIndexMetadata = async (
  type: TSectionIndexType,
): Promise<Metadata> => {
  const result = await getSectionIndexPage(type);

  if (!result.ok) {
    logger.error(SECTION_INDEX_LOG.METADATA_FETCH_FAILED, {
      type,
      error: result.error,
    });
    return {};
  }

  if (!result.data) {
    return {};
  }

  const { seo, translations } = result.data;
  const href = sectionIndexHref(type);

  return toLocalizedPageMetadata(seo, {
    href,
    translations: translations.map((language) => ({ language, href })),
    ogType: 'website',
  });
};
