import { q } from '@blog/service/sanity/query';
import {
  SHOW_IMAGES_EXPRESSION,
  showImagesParser,
} from '@blog/service/shared/expressions/show-images';
import { headingBlockFragment } from '@blog/service/shared/fragments/heading-block/heading-block';
import { layoutFragment } from '@blog/service/shared/fragments/layout/layout';

export const postListModuleQuery = q
  .parameters<{ id: string }>()
  .star.filterByType('module_postList')
  .filterRaw('_id == $id')
  .slice(0)
  .project((sub) => ({
    brandVariant: sub.field('brandVariant').notNull(),
    headingBlock: sub
      .field('headingBlock')
      .project(headingBlockFragment)
      .notNull(),
    pageSize: sub.field('pageSize').notNull(),
    layout: sub.field('layout').project(layoutFragment).nullable(true),
    contentAlignment: sub.field('contentAlignment').nullable(true),
    showImages: sub.raw(SHOW_IMAGES_EXPRESSION, showImagesParser),
  }))
  .notNull();
