import {
  q,
  type TModuleQueryParams,
} from '@shinefold/service/sanity/query/query';
import { ctaSecondaryButtonFragment } from '@shinefold/service/shared/fragments/cta/cta-button';
import { ctaButtonsFragment } from '@shinefold/service/shared/fragments/cta/cta-buttons';
import { moduleHeadingBlockFragment } from '@shinefold/service/shared/fragments/heading-block/module-heading-block';
import { localizedImageWithAltFragment } from '@shinefold/service/shared/fragments/image/localized-image-with-alt';
import { moduleWideLayoutFragment } from '@shinefold/service/shared/fragments/layout/layout';
import { moduleContentAlignmentLeftCenterFragment } from '@shinefold/service/shared/fragments/module/module-content-alignment';
import { getLocalizedField } from '@shinefold/service/shared/localization/get-localized-field/get-localized-field';
import { getLocalizedPortableTextBlock } from '@shinefold/service/shared/localization/get-localized-portable-text-block/get-localized-portable-text-block';

export const featureHighlightsModuleQuery = q
  .parameters<TModuleQueryParams>()
  .star.filterByType('module_featureHighlights')
  .filterBy('_id == $id')
  .slice(0)
  .project((sub) => ({
    brandVariant: sub.field('brandVariant').notNull(),
    headingBlock: sub
      .field('headingBlock')
      .project(moduleHeadingBlockFragment)
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
    ...moduleContentAlignmentLeftCenterFragment,
    ...moduleWideLayoutFragment,
  }))
  .notNull();
