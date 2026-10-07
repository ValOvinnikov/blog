import { q, type TModuleQueryParams } from '@blog/service/sanity/query/query';
import { ctaButtonsFragment } from '@blog/service/shared/fragments/cta/cta-buttons';
import { moduleHeadingBlockFragment } from '@blog/service/shared/fragments/heading-block/module-heading-block';
import { moduleWideLayoutFragment } from '@blog/service/shared/fragments/layout/layout';
import { moduleContentAlignmentLeftCenterFragment } from '@blog/service/shared/fragments/module/module-content-alignment';
import { getLocalizedField } from '@blog/service/shared/localization/get-localized-field/get-localized-field';

export const statsModuleQuery = q
  .parameters<TModuleQueryParams>()
  .star.filterByType('module_stats')
  .filterBy('_id == $id')
  .slice(0)
  .project((sub) => ({
    brandVariant: sub.field('brandVariant').notNull(),
    headingBlock: sub
      .field('headingBlock')
      .project(moduleHeadingBlockFragment)
      .notNull(),
    stats: sub
      .field('stats[]')
      .project((statSub) => ({
        _key: true,
        value: getLocalizedField(statSub, 'value').notNull(),
        label: getLocalizedField(statSub, 'label').notNull(),
        description: getLocalizedField(statSub, 'description'),
      }))
      .notNull(),
    footnote: getLocalizedField(sub, 'footnote'),
    ...ctaButtonsFragment,
    ...moduleContentAlignmentLeftCenterFragment,
    ...moduleWideLayoutFragment,
  }))
  .notNull();
