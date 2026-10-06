import { q } from '@blog/service/sanity/query/query';
import { headingBlockFragment } from '@blog/service/shared/fragments/heading-block/heading-block';
import { sanityImageFragment } from '@blog/service/shared/fragments/image/image';
import type { TLocaleParams } from '@blog/service/shared/localization/locale-params/locale-params';

export type TChildPagesQueryParams = { parentId: string } & TLocaleParams;

export const childPagesQuery = q
  .parameters<TChildPagesQueryParams>()
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
      .project(headingBlockFragment)
      .notNull(),
    image: sub
      .field('seo.openGraph.ogImage')
      .project(sanityImageFragment)
      .nullable(true),
  }));
