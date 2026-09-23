import { q, type TModuleQueryParams } from '@blog/service/sanity/query';
import {
  DISPLAY_MODE_EXPRESSION,
  displayModeParser,
} from '@blog/service/shared/expressions/display-mode';
import {
  SHOW_IMAGES_EXPRESSION,
  showImagesParser,
} from '@blog/service/shared/expressions/show-images';
import { headingBlockFragment } from '@blog/service/shared/fragments/heading-block/heading-block';
import { layoutFragment } from '@blog/service/shared/fragments/layout/layout';

export const postLatestModuleQuery = q
  .parameters<TModuleQueryParams>()
  .star.filterByType('module_postLatest')
  .filterBy('_id == $id')
  .slice(0)
  .project((sub) => ({
    brandVariant: sub.field('brandVariant').notNull(),
    headingBlock: sub
      .field('headingBlock')
      .project(headingBlockFragment)
      .notNull(),
    limit: sub.field('limit').notNull(),
    layout: sub.field('layout').project(layoutFragment).nullable(true),
    contentAlignment: sub.field('contentAlignment').nullable(true),
    showImages: sub.raw(SHOW_IMAGES_EXPRESSION, showImagesParser),
    displayMode: sub.raw(DISPLAY_MODE_EXPRESSION, displayModeParser),
  }))
  .notNull();
