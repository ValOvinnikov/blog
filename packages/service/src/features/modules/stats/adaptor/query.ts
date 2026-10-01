import { q, type TModuleQueryParams } from '@blog/service/sanity/query';
import { ctaButtonsFragment } from '@blog/service/shared/fragments/cta/cta-buttons';
import { headingBlockFragment } from '@blog/service/shared/fragments/heading-block/heading-block';
import { moduleWideLayoutFragment } from '@blog/service/shared/fragments/layout/layout';
import { moduleContentAlignmentFragment } from '@blog/service/shared/fragments/module/module-content-alignment';

export const statsModuleQuery = q
  .parameters<TModuleQueryParams>()
  .star.filterByType('module_stats')
  .filterBy('_id == $id')
  .slice(0)
  .project((sub) => ({
    brandVariant: sub.field('brandVariant').notNull(),
    headingBlock: sub
      .field('headingBlock')
      .project(headingBlockFragment)
      .notNull(),
    stats: sub
      .field('stats[]')
      .project((statSub) => ({
        _key: true,
        value: statSub.field('value').notNull(),
        label: statSub.field('label').notNull(),
        description: statSub.field('description').nullable(true),
      }))
      .notNull(),
    footnote: sub.field('footnote').nullable(true),
    ...ctaButtonsFragment,
    ...moduleContentAlignmentFragment,
    ...moduleWideLayoutFragment,
  }))
  .notNull();
