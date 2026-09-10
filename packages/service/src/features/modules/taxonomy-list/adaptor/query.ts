import { TAXONOMY_KIND, TAXONOMY_SORT, type TTaxonomyKind } from '@blog/config';
import { tagsQuery } from '@blog/service/features/entities/tags/adaptor/query';
import { topicsQuery } from '@blog/service/features/entities/topics/adaptor/query';
import { q } from '@blog/service/sanity/query';
import { headingBlockFragment } from '@blog/service/shared/fragments/heading-block';
import { layoutFragment } from '@blog/service/shared/fragments/layout';
import { z } from 'zod';

const RESOLVED_TAXONOMY_EXPRESSION = 'coalesce(taxonomy, $fallbackTaxonomy)';

const resolvedTaxonomyParser = z
  .enum([TAXONOMY_KIND.TOPICS, TAXONOMY_KIND.TAGS])
  .nullable();

const resolvedSortOrderParser = z.enum([
  TAXONOMY_SORT.ALPHABETICAL,
  TAXONOMY_SORT.MOST_POSTS,
]);

export const taxonomyListModuleQuery = q
  .parameters<{ id: string; fallbackTaxonomy: TTaxonomyKind | null }>()
  .star.filterByType('module_taxonomyList')
  .filterRaw('_id == $id')
  .slice(0)
  .project((sub) => ({
    brandVariant: sub.field('brandVariant').notNull(),
    headingBlock: sub
      .field('headingBlock')
      .project(headingBlockFragment)
      .nullable(true),
    layout: sub.field('layout').project(layoutFragment).nullable(true),
    contentAlignment: sub.field('contentAlignment').nullable(true),
    taxonomy: sub.raw(RESOLVED_TAXONOMY_EXPRESSION, resolvedTaxonomyParser),
    sortOrder: sub.raw(
      `coalesce(sortOrder, "${TAXONOMY_SORT.ALPHABETICAL}")`,
      resolvedSortOrderParser,
    ),
    limit: sub.field('limit').nullable(true),
    entries: sub.select({
      [`${RESOLVED_TAXONOMY_EXPRESSION} == "${TAXONOMY_KIND.TOPICS}"`]:
        topicsQuery,
      [`${RESOLVED_TAXONOMY_EXPRESSION} == "${TAXONOMY_KIND.TAGS}"`]: tagsQuery,
    }),
  }))
  .notNull();
