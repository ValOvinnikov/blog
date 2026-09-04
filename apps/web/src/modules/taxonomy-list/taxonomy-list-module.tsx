import type { TTaxonomyKind } from '@blog/config';
import { service } from '@blog/service';
import type { THeadingLevel } from '@blog/ui/lib/react';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';
import { logger } from '@web/utils/logger/logger';
import { notFound } from 'next/navigation';

import {
  TaxonomyListModuleView,
  type ITaxonomyListModuleItem,
} from './taxonomy-list-module-view';

export interface ITaxonomyListModuleProps {
  id: string;
  tenant: string;
  taxonomy: TTaxonomyKind;
  titleId: string;
  dataTestId: string;
  headingLevel: THeadingLevel;
  accessibleTitle: string;
  emptyMessage: string;
  buildHref: (slug: string) => string;
  formatPostCount: (count: number) => string;
}

/**
 * TaxonomyListModule — fetches a `module_taxonomyList` document's entries
 * (topics or tags, per `taxonomy`) and hands them to
 * `TaxonomyListModuleView`. Which taxonomy this instance lists, the
 * per-entry href, and the post-count copy are all supplied by the page —
 * the module carries no taxonomy-specific i18n namespace of its own, so a
 * second index page (tags) reuses it by passing its own strings.
 */
export const TaxonomyListModule = async ({
  id,
  tenant,
  taxonomy,
  titleId,
  dataTestId,
  headingLevel,
  accessibleTitle,
  emptyMessage,
  buildHref,
  formatPostCount,
}: ITaxonomyListModuleProps) => {
  const tenantContext = await getTenantSanityContext(tenant);
  const result = await service.modules.taxonomyList.v1.getTaxonomyList(
    id,
    taxonomy,
    tenantContext,
  );

  if (!result.ok) {
    logger.error('taxonomy_list_module.fetch_failed', {
      id,
      taxonomy,
      error: result.error,
    });
    notFound();
  }

  const { brandVariant, sectionHeader, layout, entries, contentAlignment } =
    result.data;

  const items: ITaxonomyListModuleItem[] = entries.map((entry) => ({
    id: entry.id,
    title: entry.title,
    description: entry.description,
    postCountLabel: formatPostCount(entry.postCount),
    href: buildHref(entry.slug),
  }));

  return (
    <TaxonomyListModuleView
      brandVariant={brandVariant}
      sectionHeader={sectionHeader}
      items={items}
      layout={layout}
      contentAlignment={contentAlignment}
      titleId={titleId}
      dataTestId={dataTestId}
      headingLevel={headingLevel}
      accessibleTitle={accessibleTitle}
      emptyMessage={emptyMessage}
    />
  );
};
