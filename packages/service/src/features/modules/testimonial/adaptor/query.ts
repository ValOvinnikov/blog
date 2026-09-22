import { q } from '@blog/service/sanity/query';
import {
  DISPLAY_MODE_EXPRESSION,
  displayModeParser,
} from '@blog/service/shared/expressions/display-mode';
import { ctaButtonFragment } from '@blog/service/shared/fragments/cta/cta-button';
import { headingBlockFragment } from '@blog/service/shared/fragments/heading-block/heading-block';
import { sanityImageFragment } from '@blog/service/shared/fragments/image/image';
import { layoutFragment } from '@blog/service/shared/fragments/layout/layout';
import { linkDocumentFragment } from '@blog/service/shared/fragments/link/link-document';
import { listedTextBlockFragment } from '@blog/service/shared/fragments/portable-text/listed-text-block';

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
      .project((itemSub) => ({
        _id: true,
        name: itemSub.field('name').notNull(),
        quote: itemSub
          .field('quote[]')
          .project(listedTextBlockFragment)
          .notNull(),
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
      // Mirrors the schema's own `min(1)` rule — a below-minimum module
      // degrades to no cards rather than failing the whole page.
      .nullable(true),
    ctaButtons: sub
      .field('ctaButtons[]')
      .project(ctaButtonFragment)
      .nullable(true),
    displayMode: sub.raw(DISPLAY_MODE_EXPRESSION, displayModeParser),
    cardAlignment: sub.field('cardAlignment').nullable(true),
    contentAlignment: sub.field('contentAlignment').nullable(true),
    layout: sub.field('layout').project(layoutFragment).nullable(true),
  }))
  .notNull();
