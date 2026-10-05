import { q, type TModuleQueryParams } from '@blog/service/sanity/query';
import {
  DISPLAY_MODE_EXPRESSION,
  displayModeParser,
} from '@blog/service/shared/expressions/module/display-mode';
import { ctaButtonsFragment } from '@blog/service/shared/fragments/cta/cta-buttons';
import { headingBlockFragment } from '@blog/service/shared/fragments/heading-block/heading-block';
import { sanityImageFragment } from '@blog/service/shared/fragments/image/image';
import { moduleWideLayoutFragment } from '@blog/service/shared/fragments/layout/layout';
import { linkDocumentFragment } from '@blog/service/shared/fragments/link/link-document';
import { moduleContentAlignmentFragment } from '@blog/service/shared/fragments/module/module-content-alignment';
import { textBlockFragment } from '@blog/service/shared/fragments/portable-text/text-block';

export const testimonialModuleQuery = q
  .parameters<TModuleQueryParams>()
  .star.filterByType('module_testimonial')
  .filterBy('_id == $id')
  .slice(0)
  .project((sub) => ({
    brandVariant: sub.field('brandVariant').notNull(),
    headingBlock: sub
      .field('headingBlock')
      .project(headingBlockFragment)
      .notNull(),
    testimonials: sub
      .field('testimonials[]')
      .deref()
      .project((itemSub) => ({
        _id: true,
        name: itemSub.field('name').notNull(),
        quote: itemSub.field('quote[]').project(textBlockFragment).notNull(),
        role: itemSub.field('role').nullable(true),
        image: itemSub
          .field('image')
          .project(sanityImageFragment)
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
