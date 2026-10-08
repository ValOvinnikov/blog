import { q } from '@blog/service/sanity/query/query';
import { pageHeadingBlockFragment } from '@blog/service/shared/fragments/heading-block/page-heading-block';
import { sanityImageOptionalFragment } from '@blog/service/shared/fragments/image/image';
import type { TLocaleQueryParams } from '@blog/service/shared/localization/locale-query-params/locale-query-params';

export type TSectionPagesQueryParams = {
  parentId: string;
} & TLocaleQueryParams;

export const sectionPagesQuery = q
  .parameters<TSectionPagesQueryParams>()
  .star.filterByType('page_landing')
  // groqd's typed filterBy cannot reach a reference's `_ref`.
  .filterRaw('parent._ref == $parentId')
  .filterBy('language == $locale')
  .order('orderRank asc')
  .project((sub) => ({
    _id: true,
    slug: sub.field('slug.current').notNull(),
    headingBlock: sub
      .field('headingBlock')
      .project(pageHeadingBlockFragment)
      .notNull(),
    image: sub
      .field('seo.openGraph.ogImage')
      .project(sanityImageOptionalFragment)
      .nullable(true),
  }));
