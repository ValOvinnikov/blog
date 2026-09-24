import { q, type TModuleQueryParams } from '@blog/service/sanity/query';
import {
  DISPLAY_MODE_EXPRESSION,
  displayModeParser,
} from '@blog/service/shared/expressions/display-mode';
import { ctaButtonFragment } from '@blog/service/shared/fragments/cta/cta-button';
import { headingBlockFragment } from '@blog/service/shared/fragments/heading-block/heading-block';
import { sanityImageFragment } from '@blog/service/shared/fragments/image/image';
import { layoutFragment } from '@blog/service/shared/fragments/layout/layout';
import { linkDocumentFragment } from '@blog/service/shared/fragments/link/link-document';

export const featureListModuleQuery = q
  .parameters<TModuleQueryParams>()
  .star.filterByType('module_featureList')
  .filterBy('_id == $id')
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
