import { q, type TModuleQueryParams } from '@blog/service/sanity/query';
import {
  DISPLAY_MODE_EXPRESSION,
  displayModeParser,
} from '@blog/service/shared/expressions/module/display-mode';
import { ctaButtonsFragment } from '@blog/service/shared/fragments/cta/cta-buttons';
import { localizedHeadingBlockFragment } from '@blog/service/shared/fragments/heading-block/localized-heading-block';
import { localizedImageWithAltFragment } from '@blog/service/shared/fragments/image/localized-image-with-alt';
import { moduleWideLayoutFragment } from '@blog/service/shared/fragments/layout/layout';
import { linkDocumentFragment } from '@blog/service/shared/fragments/link/link-document';
import { moduleContentAlignmentLeftCenterFragment } from '@blog/service/shared/fragments/module/module-content-alignment';

export const featureListModuleQuery = q
  .parameters<TModuleQueryParams>()
  .star.filterByType('module_featureList')
  .filterBy('_id == $id')
  .slice(0)
  .project((sub) => ({
    brandVariant: sub.field('brandVariant').notNull(),
    headingBlock: sub
      .field('headingBlock')
      .project(localizedHeadingBlockFragment)
      .notNull(),
    features: sub
      .field('features[]')
      .deref()
      .project((featureSub) => ({
        _id: true,
        headingBlock: featureSub
          .field('headingBlock')
          .project(localizedHeadingBlockFragment)
          .notNull(),
        icon: featureSub.field('icon').nullable(true),
        image: featureSub
          .field('image')
          .project(localizedImageWithAltFragment)
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
  }))
  .notNull();
