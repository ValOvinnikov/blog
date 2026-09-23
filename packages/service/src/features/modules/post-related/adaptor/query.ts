import { q, type TIdParams } from '@blog/service/sanity/query';
import {
  SHOW_IMAGES_EXPRESSION,
  showImagesParser,
} from '@blog/service/shared/expressions/show-images';
import { headingBlockFragment } from '@blog/service/shared/fragments/heading-block/heading-block';
import { layoutFragment } from '@blog/service/shared/fragments/layout/layout';

export const postRelatedModuleQuery = q
  .parameters<TIdParams>()
  .star.filterByType('module_postRelated')
  .filterBy('_id == $id')
  .slice(0)
  .project((sub) => ({
    brandVariant: sub.field('brandVariant').notNull(),
    headingBlock: sub
      .field('headingBlock')
      .project(headingBlockFragment)
      .notNull(),
    showImages: sub.raw(SHOW_IMAGES_EXPRESSION, showImagesParser),
    limit: sub.field('limit').notNull(),
    layout: sub.field('layout').project(layoutFragment).nullable(true),
    contentAlignment: sub.field('contentAlignment').nullable(true),
  }))
  .notNull();
