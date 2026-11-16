import { CONTENT_ALIGNMENT } from '@shinefold/config';
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
import { moduleContentAlignmentFragment } from '@shinefold/service/shared/fragments/module/module-content-alignment';
import { getLocalizedField } from '@shinefold/service/shared/localization/get-localized-field/get-localized-field';
import { getLocalizedPortableTextBlock } from '@shinefold/service/shared/localization/get-localized-portable-text-block/get-localized-portable-text-block';
import { z } from 'zod';

const CARD_ALIGNMENT_EXPRESSION = `coalesce(cardAlignment, "${CONTENT_ALIGNMENT.LEFT}")`;
const cardAlignmentParser = z.enum([
  CONTENT_ALIGNMENT.LEFT,
  CONTENT_ALIGNMENT.CENTER,
]);

export const testimonialModuleQuery = q
  .parameters<TModuleQueryParams>()
  .star.filterByType('module_testimonial')
  .filterBy('_id == $id')
  .slice(0)
  .project((sub) => ({
    brandVariant: sub.field('brandVariant').notNull(),
    headingBlock: sub
      .field('headingBlock')
      .project(moduleHeadingBlockFragment)
      .notNull(),
    testimonials: sub
      .field('testimonials[]')
      .deref()
      .project((itemSub) => ({
        _id: true,
        name: itemSub.field('name').notNull(),
        quote: getLocalizedPortableTextBlock(itemSub, 'quote').notNull(),
        role: getLocalizedField(itemSub, 'role'),
        image: itemSub
          .field('image')
          .project(localizedImageWithAltOptionalFragment)
          .nullable(true),
        link: itemSub
          .field('link')
          .deref()
          .project(linkDocumentFragment)
          .nullable(true),
      }))
      .notNull(),
    ...ctaButtonsFragment,
    displayMode: sub.raw(DISPLAY_MODE_EXPRESSION, displayModeParser),
    cardAlignment: sub.raw(CARD_ALIGNMENT_EXPRESSION, cardAlignmentParser),
    ...moduleContentAlignmentFragment,
    ...moduleWideLayoutFragment,
    ...moduleAppearanceFragment,
  }))
  .notNull();
