import { q, type TModuleQueryParams } from '@blog/service/sanity/query/query';
import {
  DISPLAY_MODE_EXPRESSION,
  displayModeParser,
} from '@blog/service/shared/expressions/module/display-mode';
import { ctaButtonsFragment } from '@blog/service/shared/fragments/cta/cta-buttons';
import { moduleHeadingBlockFragment } from '@blog/service/shared/fragments/heading-block/module-heading-block';
import { localizedImageWithAltFragment } from '@blog/service/shared/fragments/image/localized-image-with-alt';
import { moduleWideLayoutFragment } from '@blog/service/shared/fragments/layout/layout';
import { linkDocumentFragment } from '@blog/service/shared/fragments/link/link-document';
import { moduleContentAlignmentFragment } from '@blog/service/shared/fragments/module/module-content-alignment';
import { getLocalizedField } from '@blog/service/shared/localization/get-localized-field/get-localized-field';
import { getLocalizedPortableTextBlock } from '@blog/service/shared/localization/get-localized-portable-text-block/get-localized-portable-text-block';

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
          .project(localizedImageWithAltFragment)
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
    cardAlignment: sub.field('cardAlignment').nullable(true),
    ...moduleContentAlignmentFragment,
    ...moduleWideLayoutFragment,
  }))
  .notNull();
