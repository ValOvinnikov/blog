import { q } from '@blog/service/sanity/query';
import { ctaButtonFragment } from '@blog/service/shared/fragments/cta-button';
import {
  DISPLAY_MODE_EXPRESSION,
  displayModeParser,
} from '@blog/service/shared/fragments/display-mode';
import { headingBlockFragment } from '@blog/service/shared/fragments/heading-block';
import { sanityImageFragment } from '@blog/service/shared/fragments/image';
import { layoutFragment } from '@blog/service/shared/fragments/layout';
import { linkDocumentFragment } from '@blog/service/shared/fragments/link-document';
import {
  SHOW_IMAGES_EXPRESSION,
  showImagesParser,
} from '@blog/service/shared/fragments/show-images';

export const testimonialModuleQuery = q
  .parameters<{ id: string }>()
  .star.filterByType('module_testimonial')
  .filterRaw('_id == $id')
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
      .project((testimonialSub) => ({
        _id: true,
        quote: testimonialSub.field('quote').notNull(),
        name: testimonialSub.field('name').notNull(),
        role: testimonialSub.field('role').nullable(true),
        photo: testimonialSub
          .field('photo')
          .project(sanityImageFragment)
          .nullable(true),
        link: testimonialSub
          .field('link')
          .deref()
          .project(linkDocumentFragment)
          .nullable(true),
      }))
      .nullable(true),
    ctaButtons: sub
      .field('ctaButtons[]')
      .project(ctaButtonFragment)
      .nullable(true),
    showImages: sub.raw(SHOW_IMAGES_EXPRESSION, showImagesParser),
    displayMode: sub.raw(DISPLAY_MODE_EXPRESSION, displayModeParser),
    contentAlignment: sub.field('contentAlignment').nullable(true),
    cardAlignment: sub.field('cardAlignment').notNull(),
    layout: sub.field('layout').project(layoutFragment).nullable(true),
  }))
  .notNull();
