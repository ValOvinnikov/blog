import { q, type TModuleQueryParams } from '@blog/service/sanity/query';
import { ctaSecondaryButtonFragment } from '@blog/service/shared/fragments/cta/cta-button';
import { ctaButtonsFragment } from '@blog/service/shared/fragments/cta/cta-buttons';
import { localizedHeadingBlockFragment } from '@blog/service/shared/fragments/heading-block/localized-heading-block';
import { localizedImageWithAltFragment } from '@blog/service/shared/fragments/image/localized-image-with-alt';
import { moduleWideLayoutFragment } from '@blog/service/shared/fragments/layout/layout';
import { moduleContentAlignmentFragment } from '@blog/service/shared/fragments/module/module-content-alignment';
import { getLocalizedField } from '@blog/service/shared/localization/get-localized-field/get-localized-field';
import { getLocalizedPortableTextBlock } from '@blog/service/shared/localization/get-localized-portable-text-block/get-localized-portable-text-block';

export const featureHighlightsModuleQuery = q
  .parameters<TModuleQueryParams>()
  .star.filterByType('module_featureHighlights')
  .filterBy('_id == $id')
  .slice(0)
  .project((sub) => ({
    brandVariant: sub.field('brandVariant').notNull(),
    headingBlock: sub
      .field('headingBlock')
      .project(localizedHeadingBlockFragment)
      .notNull(),
    highlights: sub
      .field('highlights[]')
      .project((highlightSub) => ({
        _key: true,
        heading: getLocalizedField(highlightSub, 'heading').notNull(),
        body: getLocalizedPortableTextBlock(highlightSub, 'body').notNull(),
        image: highlightSub
          .field('image')
          .project(localizedImageWithAltFragment)
          .notNull(),
        action: highlightSub
          .field('action')
          .project(ctaSecondaryButtonFragment)
          .nullable(true),
      }))
      .notNull(),
    ...ctaButtonsFragment,
    mediaOrder: sub.field('mediaOrder').notNull(),
    ...moduleContentAlignmentFragment,
    ...moduleWideLayoutFragment,
  }))
  .notNull();
