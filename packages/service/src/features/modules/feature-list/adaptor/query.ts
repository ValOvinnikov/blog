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

export const featureListModuleQuery = q
  .parameters<{ id: string }>()
  .star.filterByType('module_featureList')
  .filterRaw('_id == $id')
  .slice(0)
  .project((sub) => ({
    brandVariant: sub.field('brandVariant').notNull(),
    headingBlock: sub
      .field('headingBlock')
      .project(headingBlockFragment)
      .notNull(),
    features: sub
      .field('features[]')
      .deref()
      .project((featureSub) => ({
        _id: true,
        headingBlock: featureSub
          .field('headingBlock')
          .project(headingBlockFragment)
          .notNull(),
        icon: featureSub.field('icon').nullable(true),
        image: featureSub
          .field('image')
          .project(sanityImageFragment)
          .nullable(true),
        link: featureSub
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
    imageShape: sub.field('imageShape').notNull(),
    displayMode: sub.raw(DISPLAY_MODE_EXPRESSION, displayModeParser),
    contentAlignment: sub.field('contentAlignment').nullable(true),
    cardAlignment: sub.field('cardAlignment').notNull(),
    layout: sub.field('layout').project(layoutFragment).nullable(true),
  }))
  .notNull();
