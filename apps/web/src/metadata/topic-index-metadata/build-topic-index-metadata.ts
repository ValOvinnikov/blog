import { routes } from '@shinefold/config';
import { OG_TYPE } from '@web/constants/metadata';
import { TOPIC_INDEX_LOG } from '@web/constants/topic-index';
import { toLocalizedPageMetadata } from '@web/metadata/to-localized-page-metadata';
import { getTopicIndexPage } from '@web/server/topic-index/get-topic-index-page/get-topic-index-page';
import { logger } from '@web/utils/logger/logger';
import type { Metadata } from 'next';

export const buildTopicIndexMetadata = async (): Promise<Metadata> => {
  const result = await getTopicIndexPage();

  if (!result.ok) {
    logger.error(TOPIC_INDEX_LOG.METADATA_FETCH_FAILED, {
      error: result.error,
    });
    return {};
  }

  if (!result.data) {
    return {};
  }

  const { seo, translations } = result.data;
  const href = routes.topics();

  return toLocalizedPageMetadata(seo, {
    href,
    translations: translations.map((language) => ({ language, href })),
    ogType: OG_TYPE.WEBSITE,
  });
};
