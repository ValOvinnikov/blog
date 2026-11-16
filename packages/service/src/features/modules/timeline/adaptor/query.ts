import {
  q,
  type TModuleQueryParams,
} from '@shinefold/service/sanity/query/query';
import { ctaButtonsFragment } from '@shinefold/service/shared/fragments/cta/cta-buttons';
import { moduleHeadingBlockFragment } from '@shinefold/service/shared/fragments/heading-block/module-heading-block';
import { moduleLayoutFragment } from '@shinefold/service/shared/fragments/layout/layout';
import { moduleContentAlignmentLeftCenterFragment } from '@shinefold/service/shared/fragments/module/module-content-alignment';
import { getLocalizedField } from '@shinefold/service/shared/localization/get-localized-field/get-localized-field';
import { getLocalizedPortableTextBlock } from '@shinefold/service/shared/localization/get-localized-portable-text-block/get-localized-portable-text-block';

export const timelineModuleQuery = q
  .parameters<TModuleQueryParams>()
  .star.filterByType('module_timeline')
  .filterBy('_id == $id')
  .slice(0)
  .project((sub) => ({
    brandVariant: sub.field('brandVariant').notNull(),
    headingBlock: sub
      .field('headingBlock')
      .project(moduleHeadingBlockFragment)
      .notNull(),
    markerStyle: sub.field('markerStyle').notNull(),
    items: sub
      .field('items[]')
      .project((itemSub) => ({
        _key: true,
        marker: getLocalizedField(itemSub, 'marker'),
        heading: getLocalizedField(itemSub, 'heading').notNull(),
        body: getLocalizedPortableTextBlock(itemSub, 'body'),
      }))
      .notNull(),
    orientation: sub.field('orientation').notNull(),
    ...ctaButtonsFragment,
    ...moduleContentAlignmentLeftCenterFragment,
    itemAlignment: sub.field('itemAlignment').notNull(),
    ...moduleLayoutFragment,
  }))
  .notNull();
