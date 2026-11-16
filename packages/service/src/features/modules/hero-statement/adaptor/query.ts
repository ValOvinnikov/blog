import {
  q,
  type TModuleQueryParams,
} from '@shinefold/service/sanity/query/query';
import { ctaButtonsFragment } from '@shinefold/service/shared/fragments/cta/cta-buttons';
import { moduleHeadingBlockFragment } from '@shinefold/service/shared/fragments/heading-block/module-heading-block';
import { localizedImageWithAltOptionalFragment } from '@shinefold/service/shared/fragments/image/localized-image-with-alt';
import { moduleHeroLayoutFragment } from '@shinefold/service/shared/fragments/layout/layout';
import { moduleContentAlignmentFragment } from '@shinefold/service/shared/fragments/module/module-content-alignment';
import { getLocalizedField } from '@shinefold/service/shared/localization/get-localized-field/get-localized-field';

export const heroStatementModuleQuery = q
  .parameters<TModuleQueryParams>()
  .star.filterByType('module_heroStatement')
  .filterBy('_id == $id')
  .slice(0)
  .project((sub) => ({
    brandVariant: sub.field('brandVariant').notNull(),
    variant: sub.field('variant').notNull(),
    eyebrow: getLocalizedField(sub, 'eyebrow'),
    headingBlock: sub
      .field('headingBlock')
      .project(moduleHeadingBlockFragment)
      .notNull(),
    image: sub
      .field('image')
      .project(localizedImageWithAltOptionalFragment)
      .nullable(true),
    ...ctaButtonsFragment,
    contentPositionSplit: sub.field('contentPositionSplit').nullable(true),
    contentPositionBanner: sub.field('contentPositionBanner').nullable(true),
    ...moduleContentAlignmentFragment,
    mediaOrderSplit: sub.field('mediaOrderSplit').nullable(true),
    mediaOrderStacked: sub.field('mediaOrderStacked').nullable(true),
    ...moduleHeroLayoutFragment,
  }))
  .notNull();
