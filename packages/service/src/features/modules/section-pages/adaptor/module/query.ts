import {
  q,
  type TModuleQueryParams,
} from '@shinefold/service/sanity/query/query';
import { moduleHeadingBlockFragment } from '@shinefold/service/shared/fragments/heading-block/module-heading-block';
import { moduleWideLayoutFragment } from '@shinefold/service/shared/fragments/layout/layout';
import { moduleContentAlignmentLeftCenterFragment } from '@shinefold/service/shared/fragments/module/module-content-alignment';

export const sectionPagesModuleQuery = q
  .parameters<TModuleQueryParams>()
  .star.filterByType('module_sectionPages')
  .filterBy('_id == $id')
  .slice(0)
  .project((sub) => ({
    brandVariant: sub.field('brandVariant').notNull(),
    headingBlock: sub
      .field('headingBlock')
      .project(moduleHeadingBlockFragment)
      .nullable(true),
    ...moduleContentAlignmentLeftCenterFragment,
    ...moduleWideLayoutFragment,
  }))
  .notNull();
