import { routes, TAXONOMY_KIND, type TTaxonomyKind } from '@blog/config';
import { service } from '@blog/service';
import type { THeadingLevel } from '@blog/ui/lib/react';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';
import { logger } from '@web/utils/logger/logger';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import {
  TaxonomyListModuleView,
  type ITaxonomyListModuleItem,
} from './taxonomy-list-module-view';

interface ITaxonomyListModuleSlot {
  fallbackTaxonomy: TTaxonomyKind;
  titleId: string;
  dataTestId: string;
  headingLevel: THeadingLevel;
  accessibleTitle: string;
  emptyMessage: string;
}

export interface ITaxonomyListModuleProps {
  id: string;
  locale?: string;
  tenant: string;
  slot?: ITaxonomyListModuleSlot;
}

/**
 * TaxonomyListModule — fetches a `module_taxonomyList` document's entries
 * and hands them to `TaxonomyListModuleView`, resolving the taxonomy kind,
 * per-entry hrefs and post-count copy from the fetched view model itself.
 */
export const TaxonomyListModule = async ({
  id,
  tenant,
  slot,
}: ITaxonomyListModuleProps) => {
  const tenantContext = await getTenantSanityContext(tenant);
  const result = await service.modules.taxonomyList.v1.getTaxonomyList(
    id,
    tenantContext,
    slot?.fallbackTaxonomy,
  );

  if (!result.ok) {
    if (!slot) return null;

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
    entries,
  } = result.data;

  if (!slot && entries.length === 0) return null;

  const namespace = taxonomy === TAXONOMY_KIND.TAGS ? 'tags' : 'topics';
  const t = await getTranslations(`taxonomyListModule.${namespace}`);
  const buildHref = taxonomy === TAXONOMY_KIND.TAGS ? routes.tag : routes.topic;

  const items: ITaxonomyListModuleItem[] = entries.map((entry) => ({
    id: entry.id,
    title: entry.title,
    description: entry.description,
    postCountLabel: t('postsCount', { count: entry.postCount }),
    href: buildHref(entry.slug),
  }));

  return (
    <TaxonomyListModuleView
      brandVariant={brandVariant}
      headingBlock={headingBlock}
      items={items}
      layout={layout}
      contentAlignment={contentAlignment}
      titleId={slot?.titleId ?? `taxonomy-list-${id}`}
      dataTestId={slot?.dataTestId ?? `taxonomy-list-module-${id}`}
      headingLevel={slot?.headingLevel ?? 2}
      accessibleTitle={slot?.accessibleTitle ?? t('fallbackHeading')}
      emptyMessage={slot?.emptyMessage ?? ''}
    />
  );
};
