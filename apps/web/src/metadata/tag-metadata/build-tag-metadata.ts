import { routes } from '@shinefold/config';
import { OG_TYPE } from '@web/constants/metadata';
import { TAG_LOG } from '@web/constants/tag';
import { toPaginatedPageMetadata } from '@web/metadata/to-paginated-page-metadata';
import { getTagPage } from '@web/server/tag/get-tag-page/get-tag-page';
import { logger } from '@web/utils/logger/logger';
import type { Metadata } from 'next';

export const buildTagMetadata = async (
  slug: string,
  page = 1,
): Promise<Metadata> => {
  const result = await getTagPage(slug);

  if (!result.ok) {
    logger.error(TAG_LOG.METADATA_FETCH_FAILED, { slug, error: result.error });
    return {};
  }

  if (!result.data) {
    return {};
  }

  const { seo, translations } = result.data;

  return toPaginatedPageMetadata(seo, {
    page,
    href: routes.tag(slug, page),
    translations: translations.map(({ language, slug: translatedSlug }) => ({
      language,
      href: routes.tag(translatedSlug),
    })),
    ogType: OG_TYPE.WEBSITE,
    feedUrl: routes.tagRssFeed(slug),
  });
};
