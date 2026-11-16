import {
  q,
  type TModuleQueryParams,
} from '@shinefold/service/sanity/query/query';
import { ctaButtonsFragment } from '@shinefold/service/shared/fragments/cta/cta-buttons';
import { moduleHeadingBlockFragment } from '@shinefold/service/shared/fragments/heading-block/module-heading-block';
import { moduleLayoutFragment } from '@shinefold/service/shared/fragments/layout/layout';
import { moduleContentAlignmentLeftCenterFragment } from '@shinefold/service/shared/fragments/module/module-content-alignment';
import { getLocalizedField } from '@shinefold/service/shared/localization/get-localized-field/get-localized-field';

export const embedModuleQuery = q
  .parameters<TModuleQueryParams>()
  .star.filterByType('module_embed')
  .filterBy('_id == $id')
  .slice(0)
  .project((sub) => ({
    brandVariant: sub.field('brandVariant').notNull(),
    headingBlock: sub
      .field('headingBlock')
      .project(moduleHeadingBlockFragment)
      .notNull(),
    embed: sub
      .field('embed')
      .project((embedSub) => ({
        url: embedSub.field('url').notNull(),
        title: getLocalizedField(embedSub, 'title').notNull(),
        caption: getLocalizedField(embedSub, 'caption'),
      }))
      .notNull(),
    ...ctaButtonsFragment,
    ...moduleContentAlignmentLeftCenterFragment,
    ...moduleLayoutFragment,
  }))
  .notNull();
