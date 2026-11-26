import { routes } from '@shinefold/config';
import { OG_TYPE } from '@web/constants/metadata';
import { TAG_INDEX_LOG } from '@web/constants/tag-index';
import { toLocalizedPageMetadata } from '@web/metadata/to-localized-page-metadata';
import { getTagIndexPage } from '@web/server/tag-index/get-tag-index-page/get-tag-index-page';
import { logger } from '@web/utils/logger/logger';
import type { Metadata } from 'next';

export const buildTagIndexMetadata = async (): Promise<Metadata> => {
  const result = await getTagIndexPage();

  if (!result.ok) {
    logger.error(TAG_INDEX_LOG.METADATA_FETCH_FAILED, { error: result.error });
    return {};
  }

  if (!result.data) {
    return {};
  }

  const { seo, translations } = result.data;
  const href = routes.tags();

  return toLocalizedPageMetadata(seo, {
    href,
    translations: translations.map((language) => ({ language, href })),
    ogType: OG_TYPE.WEBSITE,
  });
};
