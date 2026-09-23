import { q, type TModuleQueryParams } from '@blog/service/sanity/query';
import { ctaButtonFragment } from '@blog/service/shared/fragments/cta/cta-button';
import { headingBlockFragment } from '@blog/service/shared/fragments/heading-block/heading-block';
import { sanityImageFragment } from '@blog/service/shared/fragments/image/image';
import { layoutFragment } from '@blog/service/shared/fragments/layout/layout';
import { listedTextBlockFragment } from '@blog/service/shared/fragments/portable-text/listed-text-block';

export const ctaModuleQuery = q
  .parameters<TModuleQueryParams>()
  .star.filterByType('module_cta')
  .filterBy('_id == $id')
  .slice(0)
  .project((sub) => ({
    variant: sub.field('variant').notNull(),
    brandVariant: sub.field('brandVariant').notNull(),
    bandTone: sub.field('bandTone').notNull(),
    eyebrow: sub.field('eyebrow').nullable(true),
    headingBlock: sub
      .field('headingBlock')
      .project(headingBlockFragment)
      .notNull(),
    content: sub
      .field('content[]')
      .project(listedTextBlockFragment)
      .nullable(true),
    image: sub.field('image').project(sanityImageFragment).nullable(true),
    contentPositionSplit: sub.field('contentPositionSplit').nullable(true),
    contentPositionBanner: sub.field('contentPositionBanner').nullable(true),
    contentAlignment: sub.field('contentAlignment').nullable(true),
    mobileMediaOrder: sub.field('mobileMediaOrder').nullable(true),
    ctaButtons: sub
      .field('ctaButtons[]')
      .project(ctaButtonFragment)
      .nullable(true),
    footnote: sub.field('footnote').nullable(true),
    layout: sub.field('layout').project(layoutFragment).nullable(true),
  }))
  .notNull();
