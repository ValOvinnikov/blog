import { q } from '@blog/service/sanity/query/query';
import {
  LANDING_PAGE_PATH_EXPRESSION,
  pagePathParser,
} from '@blog/service/shared/expressions/landing-page/landing-page-path';
import { headingBlockFragment } from '@blog/service/shared/fragments/heading-block/heading-block';
import { sanityImageFragment } from '@blog/service/shared/fragments/image/image';
import type { TLocaleParams } from '@blog/service/shared/localization/locale-params/locale-params';

export type TChildPagesParams = { parentPath: string } & TLocaleParams;

// A slug never contains "/", so only a direct child of the page at $parentPath has this path.
export const childPagesQuery = q
  .parameters<TChildPagesParams>()
  .star.filterByType('page_landing')
  .filterBy('language == $locale')
  .filterRaw(
    `${LANDING_PAGE_PATH_EXPRESSION} == $parentPath + "/" + slug.current`,
  )
  .order('orderRank asc')
  .project((sub) => ({
    _id: true,
    path: sub.raw(LANDING_PAGE_PATH_EXPRESSION, pagePathParser.unwrap()),
    headingBlock: sub
      .field('headingBlock')
      .project(headingBlockFragment)
      .notNull(),
    image: sub
      .field('seo.openGraph.ogImage')
      .project(sanityImageFragment)
      .nullable(true),
  }));
