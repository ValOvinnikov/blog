import {
  q,
  type TModuleQueryParams,
} from '@shinefold/service/sanity/query/query';
import {
  DISPLAY_MODE_EXPRESSION,
  displayModeParser,
} from '@shinefold/service/shared/expressions/module/display-mode';
import {
  SHOW_IMAGES_EXPRESSION,
  showImagesParser,
} from '@shinefold/service/shared/expressions/module/show-images';
import { moduleHeadingBlockFragment } from '@shinefold/service/shared/fragments/heading-block/module-heading-block';
import { moduleWideLayoutFragment } from '@shinefold/service/shared/fragments/layout/layout';
import { moduleAppearanceFragment } from '@shinefold/service/shared/fragments/module/module-appearance';
import { moduleContentAlignmentLeftCenterFragment } from '@shinefold/service/shared/fragments/module/module-content-alignment';

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
    ...moduleAppearanceFragment,
    displayMode: sub.raw(DISPLAY_MODE_EXPRESSION, displayModeParser),
  }))
  .notNull();
