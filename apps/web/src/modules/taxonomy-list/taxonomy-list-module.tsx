import { routes, TAXONOMY_KIND } from '@blog/config';
import { service } from '@blog/service';
import { VoiceRichText } from '@web/components/shared/voice-rich-text';
import { TAXONOMY_LIST_LOG } from '@web/constants/taxonomy-list';
import { getRequestContext } from '@web/server/request-context/request-context';
import { getVoiceRich } from '@web/server/site-config/get-voice-rich/get-voice-rich';
import { markErrorLogged } from '@web/utils/logged-error';
import { logger } from '@web/utils/logger/logger';
import { getTranslations } from 'next-intl/server';

import {
  TaxonomyListModuleView,
  type ITaxonomyListModuleItem,
} from './taxonomy-list-module-view';

export interface ITaxonomyListModuleProps {
  id: string;
}

export const TaxonomyListModule = async ({ id }: ITaxonomyListModuleProps) => {
  const { sanityContext } = await getRequestContext();
  const result = await service.modules.taxonomyList.v1.getTaxonomyList(
    id,
    sanityContext,
  );

  if (!result.ok) {
    logger.error(TAXONOMY_LIST_LOG.MODULE_FETCH_FAILED, {
      id,
      error: result.error,
    });
    throw markErrorLogged(result.error);
  }

  const {
    brandVariant,
    headingBlock,
    layout,
    contentAlignment,
    taxonomy,
    showLatestPosts,
    entries,
  } = result.data;

  const isTags = taxonomy === TAXONOMY_KIND.TAGS;
  const [t, emptyRich] = await Promise.all([
    getTranslations(`taxonomyListModule.${isTags ? 'tags' : 'topics'}`),
    getVoiceRich(isTags ? 'tagsEmpty' : 'topicsEmpty'),
  ]);
  const buildHref = isTags ? routes.tag : routes.topic;

  const items: ITaxonomyListModuleItem[] = entries.flatMap(
    ({ id: entryId, title, slug, description, postCount, latestPosts }) =>
      slug
        ? [
            {
              id: entryId,
              title,
              description,
              postCountLabel: t('postsCount', { count: postCount }),
              href: buildHref(slug),
              posts: latestPosts.map((post) => ({
                id: post.id,
                title: post.title,
                href: routes.post(post.slug),
              })),
              latestPostsLabel: t('latestPostsLabel', { name: title }),
            },
          ]
        : [],
  );

  return (
    <TaxonomyListModuleView
      brandVariant={brandVariant}
      headingBlock={headingBlock}
      items={items}
      layout={layout}
      contentAlignment={contentAlignment}
      showLatestPosts={showLatestPosts}
      titleId={`taxonomy-list-${id}`}
      dataTestId={`taxonomy-list-module-${id}`}
      headingLevel={2}
      emptyMessage={<VoiceRichText value={emptyRich} />}
      latestLabel={t('latestLabel')}
    />
  );
};
