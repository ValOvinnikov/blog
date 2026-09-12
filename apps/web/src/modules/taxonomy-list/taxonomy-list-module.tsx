import { routes, TAXONOMY_KIND } from '@blog/config';
import { service } from '@blog/service';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';
import { logger } from '@web/utils/logger/logger';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import {
  TaxonomyListModuleView,
  type ITaxonomyListModuleItem,
} from './taxonomy-list-module-view';

export interface ITaxonomyListModuleProps {
  id: string;
  locale?: string;
  tenant: string;
}

/**
 * TaxonomyListModule — fetches a `module_taxonomyList` document's entries
 * and hands them to `TaxonomyListModuleView`, resolving the taxonomy kind,
 * per-entry hrefs and post-count copy from the fetched view model itself.
 */
export const TaxonomyListModule = async ({
  id,
  tenant,
}: ITaxonomyListModuleProps) => {
  const tenantContext = await getTenantSanityContext(tenant);
  const result = await service.modules.taxonomyList.v1.getTaxonomyList(
    id,
    tenantContext,
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

  const items: ITaxonomyListModuleItem[] = entries.map((entry) => ({
    id: entry.id,
    title: entry.title,
    description: entry.description,
    postCountLabel: t('postsCount', { count: entry.postCount }),
    href: buildHref(entry.slug),
    posts: entry.latestPosts.map((post) => ({
      id: post.id,
      title: post.title,
      href: routes.post(post.slug),
    })),
    latestPostsLabel: t('latestPostsLabel', { name: entry.title }),
  }));

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
      accessibleTitle={t('fallbackHeading')}
      emptyMessage={t('empty')}
    />
  );
};
