import {
  q,
  type TModuleQueryParams,
} from '@shinefold/service/sanity/query/query';
import {
  DISPLAY_MODE_EXPRESSION,
  displayModeParser,
} from '@shinefold/service/shared/expressions/module/display-mode';
import { ctaButtonsFragment } from '@shinefold/service/shared/fragments/cta/cta-buttons';
import { moduleHeadingBlockFragment } from '@shinefold/service/shared/fragments/heading-block/module-heading-block';
import { localizedImageWithAltOptionalFragment } from '@shinefold/service/shared/fragments/image/localized-image-with-alt';
import { moduleWideLayoutFragment } from '@shinefold/service/shared/fragments/layout/layout';
import { linkDocumentFragment } from '@shinefold/service/shared/fragments/link/link-document';
import { moduleAppearanceFragment } from '@shinefold/service/shared/fragments/module/module-appearance';
import { moduleContentAlignmentLeftCenterFragment } from '@shinefold/service/shared/fragments/module/module-content-alignment';

export const featureListModuleQuery = q
  .parameters<TModuleQueryParams>()
  .star.filterByType('module_featureList')
  .filterBy('_id == $id')
  .slice(0)
  .project((sub) => ({
    brandVariant: sub.field('brandVariant').notNull(),
    headingBlock: sub
      .field('headingBlock')
      .project(moduleHeadingBlockFragment)
      .notNull(),
    features: sub
      .field('features[]')
      .deref()
      .project((featureSub) => ({
        _id: true,
        headingBlock: featureSub
          .field('headingBlock')
          .project(moduleHeadingBlockFragment)
          .notNull(),
        icon: featureSub.field('icon').nullable(true),
        image: featureSub
          .field('image')
          .project(localizedImageWithAltOptionalFragment)
          .nullable(true),
        link: featureSub
          .field('link')
          .deref()
          .project(linkDocumentFragment)
          .nullable(true),
      }))
      .nullable(true),
    ...ctaButtonsFragment,
    imageShape: sub.field('imageShape').notNull(),
    displayMode: sub.raw(DISPLAY_MODE_EXPRESSION, displayModeParser),
    ...moduleContentAlignmentLeftCenterFragment,
    cardAlignment: sub.field('cardAlignment').notNull(),
    ...moduleWideLayoutFragment,
    ...moduleAppearanceFragment,
  }))
  .notNull();
