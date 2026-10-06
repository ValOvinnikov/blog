import { routes, TAXONOMY_KIND } from '@blog/config';
import { service } from '@blog/service';
import { getRequestContext } from '@web/server/request-context/request-context';
import { logger } from '@web/utils/logger/logger';
import { notFound } from 'next/navigation';
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
    logger.error('taxonomy_list_module.fetch_failed', {
      id,
      error: result.error,
    });
    notFound();
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

  const namespace = taxonomy === TAXONOMY_KIND.TAGS ? 'tags' : 'topics';
  const t = await getTranslations(`taxonomyListModule.${namespace}`);
  const buildHref = taxonomy === TAXONOMY_KIND.TAGS ? routes.tag : routes.topic;

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
      emptyMessage={t('empty')}
    />
  );
};
