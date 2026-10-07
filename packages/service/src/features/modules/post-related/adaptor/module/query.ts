import { q, type TModuleQueryParams } from '@blog/service/sanity/query/query';
import {
  SHOW_IMAGES_EXPRESSION,
  showImagesParser,
} from '@blog/service/shared/expressions/module/show-images';
import { moduleHeadingBlockFragment } from '@blog/service/shared/fragments/heading-block/module-heading-block';
import { moduleWideLayoutFragment } from '@blog/service/shared/fragments/layout/layout';
import { moduleContentAlignmentLeftCenterFragment } from '@blog/service/shared/fragments/module/module-content-alignment';

export const postRelatedModuleQuery = q
  .parameters<TModuleQueryParams>()
  .star.filterByType('module_postRelated')
  .filterBy('_id == $id')
  .slice(0)
  .project((sub) => ({
    brandVariant: sub.field('brandVariant').notNull(),
    headingBlock: sub
      .field('headingBlock')
      .project(moduleHeadingBlockFragment)
      .notNull(),
    showImages: sub.raw(SHOW_IMAGES_EXPRESSION, showImagesParser),
    limit: sub.field('limit').notNull(),
    ...moduleWideLayoutFragment,
    ...moduleContentAlignmentLeftCenterFragment,
  }))
  .notNull();
