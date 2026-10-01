import { q, type TModuleQueryParams } from '@blog/service/sanity/query';
import {
  SHOW_IMAGES_EXPRESSION,
  showImagesParser,
} from '@blog/service/shared/expressions/show-images';
import { headingBlockFragment } from '@blog/service/shared/fragments/heading-block/heading-block';
import { moduleWideLayoutFragment } from '@blog/service/shared/fragments/layout/layout';
import { moduleContentAlignmentFragment } from '@blog/service/shared/fragments/module/module-content-alignment';

export const postListModuleQuery = q
  .parameters<TModuleQueryParams>()
  .star.filterByType('module_postList')
  .filterBy('_id == $id')
  .slice(0)
  .project((sub) => ({
    brandVariant: sub.field('brandVariant').notNull(),
    headingBlock: sub
      .field('headingBlock')
      .project(headingBlockFragment)
      .notNull(),
    pageSize: sub.field('pageSize').notNull(),
    ...moduleWideLayoutFragment,
    ...moduleContentAlignmentFragment,
    showImages: sub.raw(SHOW_IMAGES_EXPRESSION, showImagesParser),
  }))
  .notNull();
