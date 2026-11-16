import {
  q,
  type TModuleQueryParams,
} from '@shinefold/service/sanity/query/query';
import { moduleHeadingBlockFragment } from '@shinefold/service/shared/fragments/heading-block/module-heading-block';
import { moduleLayoutFragment } from '@shinefold/service/shared/fragments/layout/layout';

export const cookieSettingsModuleQuery = q
  .parameters<TModuleQueryParams>()
  .star.filterByType('module_cookieSettings')
  .filterBy('_id == $id')
  .slice(0)
  .project((sub) => ({
    brandVariant: sub.field('brandVariant').notNull(),
    headingBlock: sub
      .field('headingBlock')
      .project(moduleHeadingBlockFragment)
      .nullable(true),
    ...moduleLayoutFragment,
  }))
  .notNull();
