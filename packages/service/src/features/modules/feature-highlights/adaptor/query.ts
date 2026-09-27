import { q, type TModuleQueryParams } from '@blog/service/sanity/query';
import {
  ctaButtonFragment,
  ctaSecondaryButtonFragment,
} from '@blog/service/shared/fragments/cta/cta-button';
import { headingBlockFragment } from '@blog/service/shared/fragments/heading-block/heading-block';
import { sanityImageFragment } from '@blog/service/shared/fragments/image/image';
import { layoutFragment } from '@blog/service/shared/fragments/layout/layout';
import { listedTextBlockFragment } from '@blog/service/shared/fragments/portable-text/listed-text-block';

export const featureHighlightsModuleQuery = q
  .parameters<TModuleQueryParams>()
  .star.filterByType('module_featureHighlights')
  .filterBy('_id == $id')
  .slice(0)
  .project((sub) => ({
    brandVariant: sub.field('brandVariant').notNull(),
    headingBlock: sub
      .field('headingBlock')
      .project(headingBlockFragment)
      .notNull(),
    highlights: sub
      .field('highlights[]')
      .project((highlightSub) => ({
        _key: true,
        heading: highlightSub.field('heading').notNull(),
        body: highlightSub
          .field('body[]')
          .project(listedTextBlockFragment)
          .notNull(),
        image: highlightSub
          .field('image')
          .project(sanityImageFragment)
          .notNull(),
        action: highlightSub
          .field('action')
          .project(ctaSecondaryButtonFragment)
          .nullable(true),
      }))
      .notNull(),
    ctaButtons: sub
      .field('ctaButtons[]')
      .project(ctaButtonFragment)
      .nullable(true),
    mediaOrder: sub.field('mediaOrder').notNull(),
    contentAlignment: sub.field('contentAlignment').nullable(true),
    layout: sub.field('layout').project(layoutFragment).nullable(true),
  }))
  .notNull();
